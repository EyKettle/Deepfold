use serde::Serialize;

use super::{errors::Parameter, siliconflow_types::Message};

#[derive(Debug, Clone, Serialize)]
pub struct StreamEnd {
    pub interrupted: bool,
    pub messages: Vec<Message>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub enum StreamErrorType {
    EmptyParameter,
    RequestSending,
    Serialize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(untagged)]
pub enum StreamErrorDetail {
    String(String),
    Parameter(Vec<Parameter>),
}

#[derive(Debug, Clone, Serialize)]
pub struct StreamError {
    #[serde(rename = "type")]
    pub error_type: StreamErrorType,
    pub detail: StreamErrorDetail,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum StreamEvent {
    // Reason {},
    Push(String),
    End {
        interrupted: bool,
        messages: Vec<Message>,
    },
    #[serde(rename_all = "camelCase")]
    Error(StreamError),
}
