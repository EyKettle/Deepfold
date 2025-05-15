use ai_calling::{ AiConfig, AiService };
use debug_service::DebugService;
use service_types::StreamEvent;
use siliconflow_types::Message;
use tauri::{ async_runtime::spawn, ipc::Channel, Manager };

use crate::utils::{ ErrorInfo, ErrorType };

pub mod ai_calling;
pub mod debug_service;
mod tool_calls;
mod errors;
mod service_types;
pub mod siliconflow_types;
pub mod openai_types;

#[tauri::command]
pub async fn ai_service_init(
    endpoint: String,
    api_key: String,
    model_name: String,
    ai_service: tauri::State<'_, AiService>
) -> Result<(), ErrorInfo> {
    ai_service.reset(Some(endpoint), Some(api_key), Some(model_name)).await.map_err(|e| ErrorInfo {
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
    ai_service: tauri::State<'_, AiService>
) -> Result<(), ErrorInfo> {
    ai_service.reset(Some(endpoint), Some(api_key), Some(model_name)).await.map_err(|e| ErrorInfo {
        error_type: ErrorType::Error,
        message: e.to_string(),
    })?;
    Ok(())
}

#[tauri::command]
pub fn ai_service_send(content: String, channel: Channel<StreamEvent>, app: tauri::AppHandle) {
    spawn(async move {
        let ai_service = app.state::<AiService>();
        if let Err(err) = ai_service.send(content, channel).await {
            println!("[ERROR] [AI Service] Failed to send message:\n{err}\n——————\n");
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
    ai_service: tauri::State<'_, AiService>
) -> Result<Vec<Message>, ErrorInfo> {
    let messages = ai_service.get_history().await;
    Ok(messages)
}

#[tauri::command]
pub async fn ai_service_clear(ai_service: tauri::State<'_, AiService>) -> Result<(), ()> {
    ai_service.clear_history().await;
    Ok(())
}

#[tauri::command]
pub async fn ai_service_get_logs(
    ai_service: tauri::State<'_, AiService>
) -> Result<Vec<String>, ErrorInfo> {
    ai_service
        .get_logs().await
        .map_err(|e| ErrorInfo { error_type: ErrorType::Error, message: e.to_string() })
}

#[tauri::command]
pub fn debug_request(json: String, channel: Channel<StreamEvent>, app: tauri::AppHandle) {
    spawn(async move {
        let AiConfig { endpoint, api_key, .. } = app.state::<AiService>().get_props().await;
        let debug_service = app.state::<DebugService>();
        if let Err(err) = debug_service.send_json(endpoint, api_key, json, channel).await {
            println!("[ERROR] [DEBUG] Failed to execute send request:\n{err}\n——————\n");
        }
    });
}
