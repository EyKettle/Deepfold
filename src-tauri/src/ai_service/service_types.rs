use chrono::Local;
use serde::Serialize;

use super::{ errors::Parameter, siliconflow_types::Message };

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
    Push(String),
    Tool {
        name: String,
        state: String,
    },
    End {
        interrupted: bool,
        messages: Vec<Message>,
    },
    #[serde(rename_all = "camelCase")] Error(StreamError),
}

#[derive(Debug, Clone, Serialize)]
#[serde(into = "String")]
pub enum AiFeedbackMessage {
    Interrupted,
    InvalidStatusCode(String),
    TransportError(String),
    ToolCall(String, String),
}

impl From<AiFeedbackMessage> for String {
    fn from(val: AiFeedbackMessage) -> Self {
        match val {
            AiFeedbackMessage::Interrupted =>
                "[INTERRUPTED] Assistant message is interrupted by user's next message".to_string(),
            AiFeedbackMessage::InvalidStatusCode(e) =>
                format!(
                    "[ERROR] Time:{}; Type:StatusCode; Source:UserClient; Desc:\"User sending last message failed\" Details:\n{e}\n[ATTENTION] You can use this info in after user chatting.",
                    Local::now().format("%Y-%m-%d %H:%M:%S%.3f %Z")
                ),
            AiFeedbackMessage::TransportError(e) =>
                format!(
                    "[ERROR] Time:{}; Type:Transport; Source:UserClient; Desc:\"User sending last message failed\" Details:\n{e}\n[ATTENTION] You can use this info in after user chatting.",
                    Local::now().format("%Y-%m-%d %H:%M:%S%.3f %Z")
                ),
            AiFeedbackMessage::ToolCall(name, state) =>
                format!(
                    "[INFO] Time:{} CalledTool:{name}; Source:Assistant; Args:\"{state}\"",
                    Local::now().format("%Y-%m-%d %H:%M:%S%.3f %Z")
                ),
        }
    }
}
