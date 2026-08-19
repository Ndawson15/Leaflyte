use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
}

#[derive(Deserialize)]
struct AnthropicResponse {
    content: Option<Vec<AnthropicBlock>>,
}

#[derive(Deserialize)]
struct AnthropicBlock {
    #[serde(rename = "type")]
    block_type: String,
    text: Option<String>,
}

#[derive(Deserialize)]
struct OpenAiResponse {
    choices: Option<Vec<OpenAiChoice>>,
}

#[derive(Deserialize)]
struct OpenAiChoice {
    message: Option<OpenAiMessage>,
}

#[derive(Deserialize)]
struct OpenAiMessage {
    content: Option<String>,
}

#[derive(Deserialize)]
struct ApiError {
    error: ApiErrorBody,
}

#[derive(Deserialize)]
struct ApiErrorBody {
    message: String,
}

fn normalize_base_url(url: &str) -> String {
    let trimmed = url.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        return String::new();
    }
    if trimmed.to_lowercase().ends_with("/v1") {
        trimmed.to_string()
    } else {
        format!("{trimmed}/v1")
    }
}

async fn anthropic_chat(
    api_key: &str,
    model: &str,
    system: &str,
    messages: &[ChatMessage],
) -> Result<String, String> {
    let client = reqwest::Client::new();
    let res = client
        .post("https://api.anthropic.com/v1/messages")
        .header("x-api-key", api_key)
        .header("anthropic-version", "2023-06-01")
        .json(&serde_json::json!({
            "model": model,
            "max_tokens": 4096,
            "system": system,
            "messages": messages,
        }))
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let status = res.status();
    let body = res.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        if let Ok(err) = serde_json::from_str::<ApiError>(&body) {
            return Err(err.error.message);
        }
        return Err(body);
    }

    let parsed: AnthropicResponse = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    Ok(parsed
        .content
        .unwrap_or_default()
        .into_iter()
        .filter(|b| b.block_type == "text")
        .filter_map(|b| b.text)
        .collect::<Vec<_>>()
        .join(""))
}

async fn openai_compatible_chat(
    api_key: &str,
    model: &str,
    system: &str,
    messages: &[ChatMessage],
    base_url: &str,
) -> Result<String, String> {
    let root = normalize_base_url(base_url);
    if root.is_empty() {
        return Err("Base URL is required".into());
    }
    if model.trim().is_empty() {
        return Err("Model is required".into());
    }

    let mut api_messages = vec![serde_json::json!({ "role": "system", "content": system })];
    for m in messages {
        api_messages.push(serde_json::json!({ "role": m.role, "content": m.content }));
    }

    let client = reqwest::Client::new();
    let mut req = client
        .post(format!("{root}/chat/completions"))
        .json(&serde_json::json!({
            "model": model,
            "max_tokens": 4096,
            "messages": api_messages,
        }));

    if !api_key.trim().is_empty() {
        req = req.bearer_auth(api_key.trim());
    }

    let res = req.send().await.map_err(|e| e.to_string())?;

    let status = res.status();
    let body = res.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        if let Ok(err) = serde_json::from_str::<ApiError>(&body) {
            return Err(err.error.message);
        }
        return Err(body);
    }

    let parsed: OpenAiResponse = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    Ok(parsed
        .choices
        .and_then(|c| c.into_iter().next())
        .and_then(|c| c.message)
        .and_then(|m| m.content)
        .unwrap_or_default())
}

#[derive(Serialize)]
pub struct AiModelOption {
    pub id: String,
    pub label: String,
}

#[derive(Deserialize)]
struct ModelsListResponse {
    data: Option<Vec<ModelEntry>>,
    has_more: Option<bool>,
    last_id: Option<String>,
}

#[derive(Deserialize)]
struct ModelEntry {
    id: String,
    display_name: Option<String>,
}

fn is_openai_chat_model(id: &str) -> bool {
    let lower = id.to_lowercase();
    if lower.contains("dall-e")
        || lower.contains("whisper")
        || lower.contains("tts")
        || lower.contains("embedding")
        || lower.contains("moderation")
        || lower.contains("davinci")
        || lower.contains("babbage")
        || lower.contains("realtime")
        || lower.contains("transcribe")
        || lower.contains("audio")
        || lower.contains("search")
        || lower.contains("sora")
        || lower.contains("codex")
    {
        return false;
    }
    id.starts_with("gpt-")
        || id.starts_with("chatgpt-")
        || id.starts_with('o') && id.chars().nth(1).is_some_and(|c| c.is_ascii_digit())
}

async fn anthropic_models(api_key: &str) -> Result<Vec<AiModelOption>, String> {
    let client = reqwest::Client::new();
    let mut models = Vec::new();
    let mut after_id: Option<String> = None;

    loop {
        let mut url = reqwest::Url::parse("https://api.anthropic.com/v1/models")
            .map_err(|e| e.to_string())?;
        url.query_pairs_mut().append_pair("limit", "100");
        if let Some(ref id) = after_id {
            url.query_pairs_mut().append_pair("after_id", id);
        }

        let res = client
            .get(url)
            .header("x-api-key", api_key)
            .header("anthropic-version", "2023-06-01")
            .send()
            .await
            .map_err(|e| e.to_string())?;

        let status = res.status();
        let body = res.text().await.map_err(|e| e.to_string())?;
        if !status.is_success() {
            if let Ok(err) = serde_json::from_str::<ApiError>(&body) {
                return Err(err.error.message);
            }
            return Err(body);
        }

        let parsed: ModelsListResponse = serde_json::from_str(&body).map_err(|e| e.to_string())?;
        for entry in parsed.data.unwrap_or_default() {
            let label = entry
                .display_name
                .filter(|s| !s.trim().is_empty())
                .unwrap_or_else(|| entry.id.clone());
            models.push(AiModelOption {
                id: entry.id,
                label,
            });
        }

        if !parsed.has_more.unwrap_or(false) {
            break;
        }
        after_id = parsed.last_id;
        if after_id.is_none() {
            break;
        }
    }

    Ok(models)
}

async fn openai_compatible_models(
    api_key: &str,
    base_url: &str,
) -> Result<Vec<AiModelOption>, String> {
    let root = normalize_base_url(base_url);
    if root.is_empty() {
        return Err("Base URL is required".into());
    }

    let client = reqwest::Client::new();
    let mut req = client.get(format!("{root}/models"));
    if !api_key.trim().is_empty() {
        req = req.bearer_auth(api_key.trim());
    }

    let res = req.send().await.map_err(|e| e.to_string())?;

    let status = res.status();
    let body = res.text().await.map_err(|e| e.to_string())?;
    if !status.is_success() {
        if let Ok(err) = serde_json::from_str::<ApiError>(&body) {
            return Err(err.error.message);
        }
        return Err(body);
    }

    let parsed: ModelsListResponse = serde_json::from_str(&body).map_err(|e| e.to_string())?;
    let mut models: Vec<AiModelOption> = parsed
        .data
        .unwrap_or_default()
        .into_iter()
        .map(|m| AiModelOption {
            id: m.id.clone(),
            label: m.id,
        })
        .collect();
    models.sort_by(|a, b| a.id.cmp(&b.id));
    Ok(models)
}

async fn openai_models(api_key: &str) -> Result<Vec<AiModelOption>, String> {
    let mut models = openai_compatible_models(api_key, "https://api.openai.com/v1").await?;
    models.retain(|m| is_openai_chat_model(&m.id));
    models.sort_by(|a, b| b.id.cmp(&a.id));
    Ok(models)
}

#[tauri::command]
pub async fn list_ai_models(
    provider: String,
    api_key: String,
    base_url: Option<String>,
) -> Result<Vec<AiModelOption>, String> {
    match provider.as_str() {
        "anthropic" => {
            if api_key.trim().is_empty() {
                return Err("API key is required".into());
            }
            anthropic_models(&api_key).await
        }
        "openai" => {
            if api_key.trim().is_empty() {
                return Err("API key is required".into());
            }
            openai_models(&api_key).await
        }
        "openai-compatible" => {
            openai_compatible_models(&api_key, base_url.as_deref().unwrap_or("")).await
        }
        _ => Err("Unknown AI provider".into()),
    }
}

#[tauri::command]
pub async fn ai_chat(
    provider: String,
    api_key: String,
    model: String,
    system: String,
    messages: Vec<ChatMessage>,
    base_url: Option<String>,
) -> Result<String, String> {
    match provider.as_str() {
        "anthropic" => {
            if api_key.trim().is_empty() {
                return Err("API key is required".into());
            }
            anthropic_chat(&api_key, &model, &system, &messages).await
        }
        "openai" => {
            if api_key.trim().is_empty() {
                return Err("API key is required".into());
            }
            openai_compatible_chat(
                &api_key,
                &model,
                &system,
                &messages,
                "https://api.openai.com/v1",
            )
            .await
        }
        "openai-compatible" => {
            openai_compatible_chat(
                &api_key,
                &model,
                &system,
                &messages,
                base_url.as_deref().unwrap_or(""),
            )
            .await
        }
        _ => Err("Unknown AI provider".into()),
    }
}
