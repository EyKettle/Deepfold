use std::collections::HashMap;

use serde::{ Deserialize, Serialize };
use serde_json::Value;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MessageRole {
    #[serde(rename = "user")]
    User,
    #[serde(rename = "assistant")]
    Assistant,
    #[serde(rename = "system")]
    System,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Message {
    pub role: MessageRole,
    pub content: String,
}

#[derive(Debug, Serialize)]
pub struct RequestBody {
    pub model: String,
    pub messages: Vec<Message>,
    pub stream: Option<bool>,
    pub max_tokens: Option<u16>,
    pub stop: Option<Vec<String>>,
    pub temperature: Option<f32>,
    pub top_p: Option<f32>,
    pub top_k: Option<u32>,
    pub frequency_penalty: Option<f32>,
    pub n: Option<u32>,
    pub response_format: Option<ResponseFormat>,
    pub tools: Option<Vec<Tool>>,
}

#[derive(Debug, Serialize)]
pub struct ResponseFormat {
    #[serde(rename = "type")]
    pub response_type: String,
}

#[derive(Debug, Serialize)]
pub struct Tool {
    #[serde(rename = "type")]
    tool_type: String,
}

#[derive(Debug, Serialize)]
struct FunctionDefinition {
    description: String,
    name: String,
    parameters: HashMap<String, serde_json::Value>,
    strict: bool,
}

#[derive(Debug, Deserialize)]
pub struct AiResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<Choice>,
    pub usage: Usage,
}

#[derive(Debug, Deserialize)]
pub struct Choice {
    pub index: u32,
    pub message: Message,
    pub finish_reason: String,
}

#[derive(Debug, Deserialize)]
struct Usage {
    prompt_tokens: u32,
    completion_tokens: u32,
    total_tokens: u32,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StreamResponse {
    pub id: String,
    pub object: String,
    pub created: u64,
    pub model: String,
    pub choices: Vec<StreamChoice>,
    pub system_fingerprint: Option<String>,
    pub usage: Option<Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StreamChoice {
    pub delta: StreamDelta,
    pub index: u32,
    pub finish_reason: Option<String>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct StreamDelta {
    pub content: Option<String>,
    pub role: Option<String>,
    pub reasoning_content: Option<String>,
}
