use futures::TryFutureExt;
use local_data::{CoreData, LocalData};
use serde::Serialize;
use tauri::State;

pub mod errors;
pub mod frontend_types;
pub mod local_data;

#[derive(Debug, Serialize)]
pub enum ErrorType {
    Warn,
    Error,
}

#[derive(Debug, Serialize)]
pub struct ErrorInfo {
    #[serde(rename = "type")]
    pub error_type: ErrorType,
    pub message: String,
}

#[tauri::command]
pub async fn config_set(
    endpoint: Option<String>,
    api_key: Option<String>,
    model_name: Option<String>,
    state: State<'_, LocalData>,
) -> Result<(), ()> {
    state.set(endpoint, api_key, model_name).await;
    Ok(())
}

#[tauri::command]
pub async fn config_load(state: State<'_, LocalData>) -> Result<CoreData, ErrorInfo> {
    state.load().await.map_err(|e| ErrorInfo {
        error_type: ErrorType::Error,
        message: e.to_string(),
    })?;
    let data = state.read().await;
    Ok(data)
}
#[tauri::command]
pub async fn config_save(state: State<'_, LocalData>) -> Result<(), ErrorInfo> {
    state
        .save()
        .map_err(|e| ErrorInfo {
            error_type: ErrorType::Error,
            message: e.to_string(),
        })
        .await?;
    Ok(())
}
