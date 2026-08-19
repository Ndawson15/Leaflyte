//! Localhost HTTP API for VS Code / Cursor capture in **production desktop builds**.
//! Dev mode (`tauri dev`) uses the Next.js routes on the same port instead.

use crate::vault::{app_config_dir, resolve_safe, root_of, VaultState};
use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::sync::Arc;
use std::thread;
use tiny_http::{Header, Method, Request, Response, Server, StatusCode};

const CAPTURE_ADDR: &str = "127.0.0.1:1420";
const TOKEN_FILE: &str = "capture-token.txt";

#[derive(Serialize)]
struct VaultResponse {
    path: String,
}

#[derive(Serialize)]
struct ErrorResponse {
    error: String,
}

#[derive(Serialize)]
struct CaptureHealth {
    ok: bool,
    message: &'static str,
}

#[derive(Serialize)]
struct CaptureResult {
    path: String,
    #[serde(rename = "vaultPath")]
    vault_path: String,
    created: bool,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct CaptureBody {
    content: String,
    language_id: Option<String>,
    title: Option<String>,
    folder: Option<String>,
    extension: Option<String>,
}

pub fn start_if_needed(state: Arc<VaultState>) {
    if cfg!(debug_assertions) {
        return;
    }

    thread::spawn(move || {
        if let Err(err) = run(state) {
            log::error!("Capture server failed: {err}");
        }
    });
}

fn run(state: Arc<VaultState>) -> Result<(), String> {
    let _token = get_or_create_capture_token()?;
    let server = Server::http(CAPTURE_ADDR).map_err(|e| e.to_string())?;
    log::info!("Leaflyte capture API listening on http://{CAPTURE_ADDR}");

    for mut request in server.incoming_requests() {
        let path = request.url().to_string();
        let method = request.method().clone();

        let response = match (method, path.as_str()) {
            (Method::Get, "/api/vault") => {
                if let Err(resp) = authorize(&request) {
                    resp
                } else {
                    handle_vault(&state)
                }
            }
            (Method::Get, "/api/capture") => json_response(
                StatusCode(200),
                &CaptureHealth {
                    ok: true,
                    message: "Leaflyte capture is ready",
                },
            ),
            (Method::Post, "/api/capture") => {
                if let Err(resp) = authorize(&request) {
                    resp
                } else {
                    handle_capture(&state, &mut request)
                }
            }
            _ => json_response(
                StatusCode(404),
                &ErrorResponse {
                    error: "Not found".into(),
                },
            ),
        };

        if let Err(err) = request.respond(response) {
            log::warn!("Capture response failed: {err}");
        }
    }

    Ok(())
}

fn get_or_create_capture_token() -> Result<String, String> {
    let dir = app_config_dir().ok_or("Could not resolve app config directory")?;
    let path = dir.join(TOKEN_FILE);

    if path.exists() {
        let raw = fs::read_to_string(&path).map_err(|e| e.to_string())?;
        let trimmed = raw.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
    }

    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let mut bytes = [0u8; 32];
    getrandom::fill(&mut bytes).map_err(|e| e.to_string())?;
    let token = bytes.iter().map(|b| format!("{b:02x}")).collect::<String>();
    fs::write(&path, format!("{token}\n")).map_err(|e| e.to_string())?;
    Ok(token)
}

fn authorize(request: &Request) -> Result<(), Response<std::io::Cursor<Vec<u8>>>> {
    let expected = get_or_create_capture_token().map_err(|err| {
        json_response(
            StatusCode(500),
            &ErrorResponse { error: err },
        )
    })?;
    let auth = request
        .headers()
        .iter()
        .find(|h| h.field.equiv("Authorization"))
        .map(|h| h.value.as_str());
    let bearer = format!("Bearer {expected}");
    if auth == Some(bearer.as_str()) {
        Ok(())
    } else {
        Err(json_response(
            StatusCode(401),
            &ErrorResponse {
                error: "Unauthorized capture request".into(),
            },
        ))
    }
}

fn handle_vault(state: &VaultState) -> Response<std::io::Cursor<Vec<u8>>> {
    match root_of(state) {
        Ok(path) => json_response(
            StatusCode(200),
            &VaultResponse {
                path: path.to_string_lossy().to_string(),
            },
        ),
        Err(err) => json_response(StatusCode(500), &ErrorResponse { error: err }),
    }
}

fn handle_capture(
    state: &VaultState,
    request: &mut tiny_http::Request,
) -> Response<std::io::Cursor<Vec<u8>>> {
    let mut body = String::new();
    if let Err(err) = request.as_reader().read_to_string(&mut body) {
        return json_response(
            StatusCode(400),
            &ErrorResponse {
                error: err.to_string(),
            },
        );
    }

    let parsed: CaptureBody = match serde_json::from_str(&body) {
        Ok(v) => v,
        Err(err) => {
            return json_response(
                StatusCode(400),
                &ErrorResponse {
                    error: err.to_string(),
                },
            );
        }
    };

    if parsed.content.trim().is_empty() {
        return json_response(
            StatusCode(400),
            &ErrorResponse {
                error: "content is required".into(),
            },
        );
    }

    match write_capture(state, parsed) {
        Ok(result) => json_response(StatusCode(200), &result),
        Err(err) => json_response(StatusCode(400), &ErrorResponse { error: err }),
    }
}

fn write_capture(state: &VaultState, body: CaptureBody) -> Result<CaptureResult, String> {
    let root = root_of(state)?;
    let folder = body
        .folder
        .unwrap_or_else(|| "captures".into())
        .replace('\\', "/")
        .trim_matches('/')
        .to_string();

    let language_id = body
        .language_id
        .unwrap_or_default()
        .trim()
        .to_lowercase();

    let ext = body
        .extension
        .map(|e| e.trim_start_matches('.').to_string())
        .filter(|e| !e.is_empty())
        .or_else(|| lang_to_ext(&language_id))
        .unwrap_or_else(|| "md".into());

    let stem = slugify(
        body.title
            .as_deref()
            .filter(|t| !t.trim().is_empty())
            .unwrap_or("capture"),
    );

    let rel_path = unique_path(&root, &folder, &stem, &ext)?;
    let abs = resolve_safe(&root, &rel_path)?;

    if let Some(parent) = abs.parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }

    let mut content = body.content;
    if !content.ends_with('\n') {
        content.push('\n');
    }
    std::fs::write(&abs, content).map_err(|e| e.to_string())?;

    Ok(CaptureResult {
        path: rel_path,
        vault_path: root.to_string_lossy().to_string(),
        created: true,
    })
}

fn slugify(input: &str) -> String {
    let mut out = String::new();
    let mut last_dash = false;
    for ch in input.trim().to_lowercase().chars() {
        if ch.is_ascii_alphanumeric() {
            out.push(ch);
            last_dash = false;
        } else if !last_dash {
            out.push('-');
            last_dash = true;
        }
    }
    let trimmed = out.trim_matches('-').chars().take(48).collect::<String>();
    if trimmed.is_empty() {
        "capture".into()
    } else {
        trimmed
    }
}

fn unique_path(root: &Path, folder: &str, stem: &str, ext: &str) -> Result<String, String> {
    let prefix = if folder.is_empty() {
        String::new()
    } else {
        format!("{folder}/")
    };
    let first = format!("{prefix}{stem}.{ext}");
    if !resolve_safe(root, &first)?.exists() {
        return Ok(first);
    }
    for i in 2..200 {
        let candidate = format!("{prefix}{stem}-{i}.{ext}");
        if !resolve_safe(root, &candidate)?.exists() {
            return Ok(candidate);
        }
    }
    Ok(format!(
        "{prefix}{stem}-{}.{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .map(|d| d.as_millis())
            .unwrap_or(0),
        ext
    ))
}

fn lang_to_ext(language_id: &str) -> Option<String> {
    let ext = match language_id {
        "typescript" => "ts",
        "typescriptreact" => "tsx",
        "javascript" => "js",
        "javascriptreact" => "jsx",
        "python" => "py",
        "sql" => "sql",
        "html" => "html",
        "css" => "css",
        "json" => "json",
        "markdown" => "md",
        "shellscript" => "sh",
        "yaml" => "yaml",
        "rust" => "rs",
        "go" => "go",
        "java" => "java",
        "php" => "php",
        "ruby" => "rb",
        "csharp" => "cs",
        "c" => "c",
        "cpp" => "cpp",
        "plaintext" => "txt",
        _ => return None,
    };
    Some(ext.into())
}

fn json_response<T: Serialize>(
    status: StatusCode,
    value: &T,
) -> Response<std::io::Cursor<Vec<u8>>> {
    match serde_json::to_vec(value) {
        Ok(bytes) => {
            let mut response = Response::from_data(bytes).with_status_code(status);
            response.add_header(Header::from_bytes("Content-Type", "application/json").unwrap());
            response
        }
        Err(err) => Response::from_string(format!("{{\"error\":\"{err}\"}}"))
            .with_status_code(StatusCode(500)),
    }
}
