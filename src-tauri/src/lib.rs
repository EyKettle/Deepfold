use tauri::Manager;
mod utils;
use utils::file_operator::read_path;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder
        ::default()
        .setup(|app| {
            let window = app.get_webview_window("main").unwrap();
            window.show().expect("Initialized failed because of show window failed.");
            Ok(())
        })
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![read_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
