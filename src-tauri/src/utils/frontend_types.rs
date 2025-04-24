use serde::{Deserialize, Serialize};

use crate::ai_service::siliconflow_types::Message;

#[derive(Debug, Clone, Deserialize, Serialize)]
pub enum MessageErrorType {
    RequestSending,
    EmptyParameter,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct MessageError<T> {
    #[serde(rename = "type")]
    pub error_type: MessageErrorType,
    pub detail: T,
}

#[derive(Debug, Clone, Deserialize, Serialize)]
pub struct StreamEndMessage {
    pub interrupted: bool,
    pub messages: Vec<Message>,
}
