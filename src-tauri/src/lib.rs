use tauri::{async_runtime::spawn, Manager, Theme};

mod ai_service;
mod utils;

use ai_service::{
    ai_calling::AiService, ai_service_clear, ai_service_history, ai_service_init, ai_service_reset,
    ai_service_send, ai_service_stop,
};
use tauri_plugin_opener::open_url;
use utils::{
    config_load, config_read, config_save, config_set,
    local_data::{self, LocalData},
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
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(
            tauri::plugin::Builder::<tauri::Wry, ()>::new("ProperNavigation")
                .on_navigation(|_, url| {
                    // allow the production URL or localhost on dev
                    if url.scheme() == "tauri"
                        || (cfg!(dev) && url.host_str() == Some("localhost"))
                    {
                        true
                    } else {
                        let _ = open_url(url, None::<String>);
                        false
                    }
                })
                .build(),
        )
        .setup(|app| {
            if let Ok(config_dir) = app.path().app_config_dir() {
                app.manage(LocalData::new(config_dir.join("core.toml")));
            }
            app.manage(AiService::new(String::new(), String::new(), String::new()));
            let app_handle = app.handle().clone();
            spawn(async move {
                let _ = config_load(app_handle.state::<LocalData>()).await;
                let data = app_handle.state::<LocalData>();
                match data.read().await.theme {
                    local_data::Theme::Dark => {
                        app_handle.set_theme(Some(Theme::Dark));
                    }
                    local_data::Theme::Light => {
                        app_handle.set_theme(Some(Theme::Light));
                    }
                    _ => {}
                }
            });

            let window = app.get_webview_window("main").unwrap();
            window
                .show()
                .expect("Initialized failed because of show window failed.");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_version,
            switch_theme,
            config_set,
            config_load,
            config_save,
            config_read,
            ai_service_init,
            ai_service_reset,
            ai_service_send,
            ai_service_stop,
            ai_service_history,
            ai_service_clear,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
