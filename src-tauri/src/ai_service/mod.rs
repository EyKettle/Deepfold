use ai_calling::AiService;
use siliconflow_types::Message;
use tauri::{async_runtime::spawn, Manager};

use crate::utils::{ErrorInfo, ErrorType};

pub mod ai_calling;
mod errors;
pub mod siliconflow_types;

#[tauri::command]
pub async fn ai_service_init(
    endpoint: String,
    api_key: String,
    model_name: String,
    ai_service: tauri::State<'_, AiService>,
) -> Result<(), ErrorInfo> {
    ai_service
        .reset(Some(endpoint), Some(api_key), Some(model_name))
        .await
        .map_err(|e| ErrorInfo {
            error_type: ErrorType::Warn,
            message: e.to_string(),
        })?;
    Ok(())
}

#[tauri::command]
pub async fn ai_service_reset(
    endpoint: String,
    api_key: String,
    model_name: String,
    ai_service: tauri::State<'_, AiService>,
) -> Result<(), ErrorInfo> {
    ai_service
        .reset(Some(endpoint), Some(api_key), Some(model_name))
        .await
        .map_err(|e| ErrorInfo {
            error_type: ErrorType::Error,
            message: e.to_string(),
        })?;
    Ok(())
}

#[tauri::command]
pub fn ai_service_send(content: String, hook_id: String, app: tauri::AppHandle) {
    spawn(async move {
        let ai_service = app.state::<AiService>();
        if let Err(err) = ai_service.send(content, hook_id.clone()).await {
            println!("[ERROR] [AI Service] Failed to send message: {err}");
        }
    });
}

#[tauri::command]
pub fn ai_service_stop(app: tauri::AppHandle) {
    spawn(async move {
        let ai_service = app.state::<AiService>();
        if let Err(err) = ai_service.stop().await {
            println!("[ERROR] [AI Service] Failed to stop generating: {err}")
        }
    });
}

#[tauri::command]
pub async fn ai_service_history(
    ai_service: tauri::State<'_, AiService>,
) -> Result<Vec<Message>, ErrorInfo> {
    let messages = ai_service.get_history().await;
    Ok(messages)
}

#[tauri::command]
pub async fn ai_service_clear(ai_service: tauri::State<'_, AiService>) -> Result<(), ErrorInfo> {
    ai_service.clear_history().await;
    Ok(())
}
