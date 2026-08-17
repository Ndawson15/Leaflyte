mod ai;
mod menu;
mod vault;
mod watcher;

use vault::VaultState;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .manage(VaultState::new())
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
        .setup(|app| {
            menu::install_app_menu(app)?;
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            watcher::start(app.handle().clone());
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
