use serde::Serialize;
use std::fs;
use std::path::{Component, Path, PathBuf};
use std::sync::{Arc, Mutex};

const IGNORE: &[&str] = &[".git", "node_modules", ".DS_Store", ".leaflyte-index"];
const APP_CONFIG_DIR: &str = "com.leaflyte.desktop";

#[derive(Serialize, Clone)]
pub struct TreeNode {
    pub name: String,
    pub path: String,
    #[serde(rename = "type")]
    pub node_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub children: Option<Vec<TreeNode>>,
}

#[derive(Serialize)]
pub struct WriteResult {
    pub created: bool,
}

pub struct VaultState {
    pub root: Mutex<PathBuf>,
}

impl VaultState {
    pub fn new() -> Self {
        Self {
            root: Mutex::new(initial_root()),
        }
    }
}

pub fn app_config_dir() -> Option<PathBuf> {
    dirs::data_dir().map(|dir| dir.join(APP_CONFIG_DIR))
}

fn config_dir() -> Option<PathBuf> {
    app_config_dir()
}

fn persisted_vault_config_path() -> Option<PathBuf> {
    config_dir().map(|dir| dir.join("vault-path.txt"))
}

fn load_persisted_vault_path() -> Option<PathBuf> {
    let file = persisted_vault_config_path()?;
    let raw = fs::read_to_string(file).ok()?;
    let trimmed = raw.trim();
    if trimmed.is_empty() {
        return None;
    }
    let path = PathBuf::from(trimmed);
    if path.is_dir() { Some(path) } else { None }
}

fn save_persisted_vault_path(path: &Path) -> Result<(), String> {
    let dir = config_dir().ok_or("Could not resolve app config directory")?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    fs::write(
        dir.join("vault-path.txt"),
        path.to_string_lossy().as_bytes(),
    )
    .map_err(|e| e.to_string())
}

#[cfg(unix)]
fn same_path(a: &Path, b: &Path) -> bool {
    use std::os::unix::fs::MetadataExt;
    match (fs::metadata(a), fs::metadata(b)) {
        (Ok(left), Ok(right)) => left.dev() == right.dev() && left.ino() == right.ino(),
        _ => false,
    }
}

#[cfg(not(unix))]
fn same_path(a: &Path, b: &Path) -> bool {
    a == b
}

fn initial_root() -> PathBuf {
    if cfg!(debug_assertions) {
        return default_dev_root();
    }
    if let Some(persisted) = load_persisted_vault_path() {
        return persisted;
    }
    default_documents_root()
}

fn default_dev_root() -> PathBuf {
    let p = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../vault");
    let _ = fs::create_dir_all(&p);
    fs::canonicalize(&p).unwrap_or(p)
}

fn default_documents_root() -> PathBuf {
    let base = dirs::document_dir()
        .or_else(dirs::home_dir)
        .unwrap_or_else(|| PathBuf::from("."));
    let p = base.join("Leaflyte");
    let _ = fs::create_dir_all(&p);
    fs::canonicalize(&p).unwrap_or(p)
}

pub fn root_of(state: &VaultState) -> Result<PathBuf, String> {
    Ok(state.root.lock().map_err(|e| e.to_string())?.clone())
}

fn set_root(state: &VaultState, path: PathBuf) -> Result<(), String> {
    *state.root.lock().map_err(|e| e.to_string())? = path;
    Ok(())
}

fn is_ignored(name: &str) -> bool {
    name.starts_with('.') || IGNORE.contains(&name)
}

fn load_gitignore(root: &Path) -> Vec<String> {
    let path = root.join(".gitignore");
    let Ok(raw) = fs::read_to_string(path) else {
        return Vec::new();
    };
    raw.lines()
        .map(str::trim)
        .filter(|l| !l.is_empty() && !l.starts_with('#'))
        .map(|l| l.trim_start_matches('/').to_string())
        .collect()
}

fn gitignore_match(rel: &str, pattern: &str) -> bool {
    let rel = rel.trim_start_matches('/');
    if pattern.contains('*') {
        if let Some(suffix) = pattern.strip_prefix('*') {
            return rel.ends_with(suffix);
        }
        if let Some(prefix) = pattern.strip_suffix('*') {
            return rel.starts_with(prefix);
        }
    }
    if rel == pattern || rel.ends_with(&format!("/{pattern}")) {
        return true;
    }
    rel.split('/').any(|seg| seg == pattern)
}

fn is_gitignored(rel: &str, patterns: &[String]) -> bool {
    patterns.iter().any(|p| gitignore_match(rel, p))
}

fn normalize(path: &Path) -> PathBuf {
    let mut out = PathBuf::new();
    for comp in path.components() {
        match comp {
            Component::ParentDir => {
                out.pop();
            }
            Component::CurDir => {}
            other => out.push(other.as_os_str()),
        }
    }
    out
}

pub fn resolve_safe(root: &Path, rel: &str) -> Result<PathBuf, String> {
    let cleaned = rel.replace('\\', "/");
    let cleaned = cleaned.trim_start_matches('/');
    let abs = normalize(&root.join(cleaned));
    let root_n = normalize(root);
    if abs != root_n && !abs.starts_with(&root_n) {
        return Err("Path escapes vault directory".into());
    }
    Ok(abs)
}

fn rel_posix(root: &Path, abs: &Path) -> String {
    abs.strip_prefix(root)
        .unwrap_or(abs)
        .to_string_lossy()
        .replace('\\', "/")
}

fn list_tree_at(root: &Path, dir: &Path, gitignore: &[String]) -> Result<Vec<TreeNode>, String> {
    let mut nodes = Vec::new();
    let mut entries: Vec<_> = fs::read_dir(dir)
        .map_err(|e| e.to_string())?
        .filter_map(|e| e.ok())
        .collect();
    entries.sort_by_key(|e| e.file_name());

    for entry in entries {
        let name = entry.file_name().to_string_lossy().to_string();
        if is_ignored(&name) {
            continue;
        }
        let abs = entry.path();
        let rel = rel_posix(root, &abs);
        if is_gitignored(&rel, gitignore) {
            continue;
        }
        let ft = entry.file_type().map_err(|e| e.to_string())?;
        if ft.is_dir() {
            nodes.push(TreeNode {
                name,
                path: rel,
                node_type: "folder".into(),
                children: Some(list_tree_at(root, &abs, gitignore)?),
            });
        } else {
            nodes.push(TreeNode {
                name,
                path: rel,
                node_type: "file".into(),
                children: None,
            });
        }
    }

    nodes.sort_by(|a, b| match (a.node_type.as_str(), b.node_type.as_str()) {
        ("folder", "file") => std::cmp::Ordering::Less,
        ("file", "folder") => std::cmp::Ordering::Greater,
        _ => a.name.to_lowercase().cmp(&b.name.to_lowercase()),
    });
    Ok(nodes)
}

fn list_files_at(
    root: &Path,
    dir: &Path,
    gitignore: &[String],
    out: &mut Vec<String>,
) -> Result<(), String> {
    for entry in fs::read_dir(dir).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let name = entry.file_name().to_string_lossy().to_string();
        if is_ignored(&name) {
            continue;
        }
        let abs = entry.path();
        let rel = rel_posix(root, &abs);
        if is_gitignored(&rel, gitignore) {
            continue;
        }
        let ft = entry.file_type().map_err(|e| e.to_string())?;
        if ft.is_dir() {
            list_files_at(root, &abs, gitignore, out)?;
        } else {
            out.push(rel);
        }
    }
    Ok(())
}

#[tauri::command]
pub fn get_vault_path(state: tauri::State<'_, Arc<VaultState>>) -> Result<String, String> {
    Ok(root_of(&state)?.to_string_lossy().to_string())
}

#[tauri::command]
pub fn set_vault_path(state: tauri::State<'_, Arc<VaultState>>, path: String) -> Result<String, String> {
    let requested = PathBuf::from(path.trim());
    if !requested.is_dir() {
        return Err("That folder does not exist".into());
    }

    let current = root_of(&state)?;
    if same_path(&requested, &current) {
        return Ok(current.to_string_lossy().to_string());
    }

    let canonical = fs::canonicalize(&requested).map_err(|e| e.to_string())?;
    if canonical == current {
        return Ok(current.to_string_lossy().to_string());
    }

    set_root(&state, canonical.clone())?;
    save_persisted_vault_path(&canonical)?;
    Ok(canonical.to_string_lossy().to_string())
}

#[tauri::command]
pub fn abs_path(state: tauri::State<'_, Arc<VaultState>>, path: String) -> Result<String, String> {
    let root = root_of(&state)?;
    let abs = resolve_safe(&root, &path)?;
    Ok(abs.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn pick_vault_folder() -> Result<Option<String>, String> {
    Ok(rfd::AsyncFileDialog::new()
        .set_title("Choose vault folder")
        .pick_folder()
        .await
        .map(|p| p.path().to_string_lossy().to_string()))
}

#[tauri::command]
pub fn reveal_path(state: tauri::State<'_, Arc<VaultState>>, path: String) -> Result<(), String> {
    let root = root_of(&state)?;
    let abs = resolve_safe(&root, &path)?;
    if !abs.exists() {
        return Err("Path not found".into());
    }
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("-R")
            .arg(&abs)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "windows")]
    {
        std::process::Command::new("explorer")
            .arg(format!("/select,{}", abs.display()))
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    #[cfg(target_os = "linux")]
    {
        let parent = abs.parent().unwrap_or(&abs);
        std::process::Command::new("xdg-open")
            .arg(parent)
            .spawn()
            .map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn list_tree(state: tauri::State<'_, Arc<VaultState>>) -> Result<Vec<TreeNode>, String> {
    let root = root_of(&state)?;
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    let gitignore = load_gitignore(&root);
    list_tree_at(&root, &root, &gitignore)
}

#[tauri::command]
pub fn list_files(state: tauri::State<'_, Arc<VaultState>>) -> Result<Vec<String>, String> {
    let root = root_of(&state)?;
    fs::create_dir_all(&root).map_err(|e| e.to_string())?;
    let gitignore = load_gitignore(&root);
    let mut out = Vec::new();
    list_files_at(&root, &root, &gitignore, &mut out)?;
    Ok(out)
}

#[tauri::command]
pub fn read_file(state: tauri::State<'_, Arc<VaultState>>, path: String) -> Result<String, String> {
    let root = root_of(&state)?;
    let abs = resolve_safe(&root, &path)?;
    fs::read_to_string(abs).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_file(
    state: tauri::State<'_, Arc<VaultState>>,
    path: String,
    content: String,
) -> Result<WriteResult, String> {
    let root = root_of(&state)?;
    let abs = resolve_safe(&root, &path)?;
    let created = !abs.exists();
    if let Some(parent) = abs.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    fs::write(&abs, content).map_err(|e| e.to_string())?;
    Ok(WriteResult { created })
}

#[tauri::command]
pub fn delete_path(state: tauri::State<'_, Arc<VaultState>>, path: String) -> Result<(), String> {
    let root = root_of(&state)?;
    let abs = resolve_safe(&root, &path)?;
    let meta = fs::metadata(&abs).map_err(|e| e.to_string())?;
    if meta.is_dir() {
        fs::remove_dir_all(abs).map_err(|e| e.to_string())
    } else {
        fs::remove_file(abs).map_err(|e| e.to_string())
    }
}

#[tauri::command]
pub fn move_path(
    state: tauri::State<'_, Arc<VaultState>>,
    from: String,
    to: String,
) -> Result<String, String> {
    let from = from.trim_start_matches('/').replace('\\', "/");
    let to = to.trim_start_matches('/').replace('\\', "/");
    if from.is_empty() || to.is_empty() {
        return Err("from and to are required".into());
    }
    if from == to {
        return Ok(to);
    }

    let root = root_of(&state)?;
    let from_abs = resolve_safe(&root, &from)?;
    let to_abs = resolve_safe(&root, &to)?;

    if !from_abs.exists() {
        return Err("Source not found".into());
    }
    if to_abs.exists() {
        return Err("A file or folder already exists at the destination".into());
    }
    if to_abs == from_abs || to_abs.starts_with(&from_abs) {
        return Err("Cannot move a folder into itself".into());
    }
    if let Some(parent) = to_abs.parent() {
        fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    if from_abs.is_dir() {
        move_dir(&from_abs, &to_abs)?;
    } else {
        fs::rename(&from_abs, &to_abs).map_err(|e| e.to_string())?;
    }
    Ok(to)
}

fn move_dir(from: &Path, to: &Path) -> Result<(), String> {
    if fs::rename(from, to).is_ok() {
        return Ok(());
    }
    copy_dir_all(from, to)?;
    fs::remove_dir_all(from).map_err(|e| e.to_string())
}

fn copy_dir_all(from: &Path, to: &Path) -> Result<(), String> {
    fs::create_dir_all(to).map_err(|e| e.to_string())?;
    for entry in fs::read_dir(from).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let src = entry.path();
        let dest = to.join(entry.file_name());
        if entry.file_type().map_err(|e| e.to_string())?.is_dir() {
            copy_dir_all(&src, &dest)?;
        } else {
            fs::copy(&src, &dest).map_err(|e| e.to_string())?;
        }
    }
    Ok(())
}
