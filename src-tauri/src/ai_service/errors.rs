use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum Parameter {
    Endpoint,
    APIKey,
    ModelName,
}

#[derive(Debug, Error)]
pub enum Error {
    #[error("Unexpected streaming")]
    UnexpectedStream,
    #[error("Empty Parameter: {0:?}")] EmptyParameter(Vec<Parameter>),
    #[error("Fail to emit event: {0}")] StreamChannel(tauri::Error),
    #[error("Eventsource Error: {0}")] Eventsource(reqwest_eventsource::Error),
    #[error("An eventsource error occurred which been intercepted")]
    InterceptedEventsource,
    #[error("Reqwest Error: {0}")] Reqwest(reqwest_eventsource::CannotCloneRequestError),
}
