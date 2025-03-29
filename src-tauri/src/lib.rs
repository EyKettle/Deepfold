use tauri::{ Manager, Theme };

mod utils;
mod ai_service;

use utils::file_operator::{ read_path, create_file };
use ai_service::{
    ai_service_init,
    ai_service_reset,
    ai_service_test,
    ai_service_send,
    ai_service_clear,
};

#[tauri::command]
async fn get_version(app: tauri::AppHandle) -> Result<String, ()> {
    match &app.config().version {
        Some(ver) => Ok(ver.clone()),
        None => Err(()),
    }
}

#[tauri::command]
fn switch_theme(app: tauri::AppHandle, theme_mode: &str) {
    match theme_mode {
        "dark" => app.set_theme(Some(Theme::Dark)),
        "light" => app.set_theme(Some(Theme::Light)),
        _ => app.set_theme(None),
    }
}

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
        .invoke_handler(
            tauri::generate_handler![
                get_version,
                switch_theme,
                read_path,
                create_file,
                ai_service_init,
                ai_service_reset,
                ai_service_test,
                ai_service_send,
                ai_service_clear
            ]
        )
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
