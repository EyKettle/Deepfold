use thiserror::Error;

#[derive(Debug)]
pub enum Parameter {
    Endpoint,
    APIKey,
    ModelName,
}

#[derive(Debug, Error)]
pub enum Error {
    #[error("No AppHandle")]
    NoAppHandle,
    #[error("Unexpected streaming")]
    UnexpectedStream,
    #[error("Empty Parameter: {0:?}")]
    EmptyParameter(Parameter),
    #[error("Fail to emit event: {0}")]
    EmitFailed(tauri::Error),
    #[error("Eventsource Error: {0}")]
    Eventsource(reqwest_eventsource::Error),
    #[error("Reqwest Error: {0}")]
    Reqwest(reqwest_eventsource::CannotCloneRequestError),
}
