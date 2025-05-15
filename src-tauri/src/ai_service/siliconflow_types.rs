use serde::{ Deserialize, Serialize };
use serde_json::Value;

use super::openai_types::{ self, AiResponse };

pub type MessageRole = openai_types::MessageRole;
pub type Message = openai_types::Message;
pub type Tool = openai_types::Tool;
pub type ToolCall = openai_types::ToolCall;
pub type CallFunction = openai_types::CallFunction;

#[derive(Debug, Serialize)]
pub struct RequestBody {
    pub model: String,
    pub messages: Vec<Message>,
    pub stream: Option<bool>,
    pub tools: Option<Vec<Tool>>,
    pub max_tokens: Option<u16>,
    pub stop: Option<Vec<String>>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub top_k: Option<u32>,
    pub frequency_penalty: Option<f32>,
    pub n: Option<u32>,
    pub response_format: Option<ResponseFormat>,
}

impl RequestBody {
    pub fn new(model: String, messages: Vec<Message>, stream: Option<bool>) -> Self {
        Self {
            model,
            messages,
            stream,
            tools: None,
            max_tokens: None,
            stop: None,
            temperature: None,
            top_p: None,
            top_k: None,
            frequency_penalty: None,
            n: None,
            response_format: None,
        }
    }
    pub fn with_tools(mut self, tools: Vec<Tool>) -> Self {
        self.tools = Some(tools);
        self
    }
}

#[derive(Debug, Serialize)]
pub struct ResponseFormat {
    #[serde(rename = "type")]
    pub response_type: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<StreamChoice>,
    pub usage: Option<Value>,
    pub system_fingerprint: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamChoice {
    pub delta: StreamDelta,
    pub index: u32,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamDelta {
    pub content: Option<String>,
    pub reasoning_content: Option<String>,
    pub role: Option<String>,
    pub tool_calls: Option<Vec<ToolCall>>,
}

pub fn _extract_content(response: AiResponse) -> Option<String> {
    response.choices
        .into_iter()
        .next()
        .map(|choice| choice.message.content)
}
pub fn _extract_stream_reason(response: StreamResponse) -> Option<String> {
    response.choices
        .into_iter()
        .next()
        .map(|choice| choice.delta.reasoning_content)?
}
pub fn extract_stream_content(response: StreamResponse) -> Option<String> {
    response.choices
        .into_iter()
        .next()
        .map(|choice| choice.delta.content)?
}

pub fn get_tool_calls(response: StreamResponse) -> Result<Vec<ToolCall>, ()> {
    let calls = response.choices
        .into_iter()
        .next()
        .map(|choice| choice.delta.tool_calls);
    if let Some(Some(calls)) = calls {
        Ok(calls)
    } else {
        Err(())
    }
}
