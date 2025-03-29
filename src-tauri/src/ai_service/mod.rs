use std::sync::{ Arc, OnceLock };

use ai_calling::AiService;
use futures::TryFutureExt;
use serde::Serialize;
use tauri::async_runtime::Mutex;

mod siliconflow_types;
mod ai_calling;
mod errors;

struct MsgTip {
    icon: String,
    title: String,
    description: Option<String>,
    buttons: Option<Vec<String>>,
    functions: Option<Vec<String>>,
}

#[derive(Debug, Serialize)]
pub enum ErrorType {
    Warn,
    Error,
}

#[derive(Debug, Serialize)]
pub struct ErrorInfo {
    error_type: ErrorType,
    message: String,
}

static AI_SERVICE: OnceLock<Arc<Mutex<AiService>>> = OnceLock::new();

fn get_ai_service() -> Result<&'static Arc<Mutex<AiService>>, ErrorInfo> {
    if let Some(ai_service) = AI_SERVICE.get() {
        Ok(ai_service)
    } else {
        println!("[WARN] [AI service] Not initialized.");
        Err(ErrorInfo {
            error_type: ErrorType::Error,
            message: String::from("AI service not initialized."),
        })
    }
}

#[tauri::command]
pub async fn ai_service_init(
    app: tauri::AppHandle,
    endpoint: String,
    api_key: String,
    model_name: String
    // stream: Option<bool>
) -> Result<(), ErrorInfo> {
    // if hooks.len() < 3 {
    //     println!("[ERROR] [AI service] Invalid hooks.");
    //     return Err(ErrorInfo {
    //         kind: ErrorType::Error,
    //         message: String::from("Invalid hooks."),
    //     });
    // }
    // let hooks_struct = Hooks {
    //     send_msg: hooks[0].clone(),
    //     push_str: hooks[1].clone(),
    //     tip_pop: hooks[2].clone(),
    // };
    let ai_service = AiService::new(
        app,
        endpoint,
        api_key,
        model_name
        // hooks_struct,
        // stream.unwrap_or(true)
    );
    let ai_service_mutex = Arc::new(Mutex::new(ai_service));
    AI_SERVICE.set(ai_service_mutex).map_err(|_| {
        println!("[WARN] [AI service] Already initialized.");
        ErrorInfo {
            error_type: ErrorType::Warn,
            message: String::from("Already initialized."),
        }
    })?;
    Ok(())
}

#[tauri::command]
pub async fn ai_service_test() -> Result<String, ErrorInfo> {
    let ai_service = get_ai_service()?;
    let guard = ai_service.lock().await;
    guard.test().await.map_err(|e| ErrorInfo { error_type: ErrorType::Error, message: e })
}

#[tauri::command]
pub async fn ai_service_reset(
    app: tauri::AppHandle,
    endpoint: String,
    api_key: String,
    model_name: String
) -> Result<(), ErrorInfo> {
    let ai_service = get_ai_service()?;
    let mut guard = ai_service.lock().await;
    let new_service = AiService::new(app, endpoint, api_key, model_name);
    *guard = new_service;
    Ok(())
}

#[tauri::command]
pub async fn ai_service_send(content: String, hook_id: String) -> Result<(), ErrorInfo> {
    let ai_service = get_ai_service()?;
    let mut guard = ai_service.lock().await;
    guard
        .send(content, hook_id).await
        .map_err(|e| ErrorInfo { error_type: ErrorType::Error, message: e })
}

// #[tauri::command]
// pub async fn ai_send_message(message: String) -> Result<(), ErrorInfo> {
//     let ai_service = get_ai_service().await?;
//     let mut guard = ai_service.lock().await;
//     guard.send(message).await.map_err(|e| {
//         println!("[ERROR] [AI service] Cannot send message.\n\tError Info: {}", e);
//         ErrorInfo {
//             kind: ErrorType::Error,
//             message: e.to_string(),
//         }
//     })
// }

#[tauri::command]
pub async fn ai_service_clear() -> Result<(), ErrorInfo> {
    let ai_service = get_ai_service()?;
    let mut guard = ai_service.lock().await;
    guard.clear_history();
    Ok(())
}
