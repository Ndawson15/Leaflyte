mod ai;
mod capture;
mod menu;
mod vault;
mod watcher;

use std::sync::Arc;
use vault::VaultState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let vault_state = Arc::new(VaultState::new());

    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(vault_state.clone())
        .invoke_handler(tauri::generate_handler![
            vault::get_vault_path,
            vault::set_vault_path,
            vault::abs_path,
            vault::pick_vault_folder,
            vault::reveal_path,
            vault::list_tree,
            vault::list_files,
            vault::read_file,
            vault::write_file,
            vault::delete_path,
            vault::move_path,
            ai::ai_chat,
            ai::list_ai_models
        ])
        .setup(move |app| {
            menu::install_app_menu(app)?;
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            watcher::start(app.handle().clone());
            capture::start_if_needed(vault_state);
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
