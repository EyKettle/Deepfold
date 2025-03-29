use chrono::{ FixedOffset, Utc };
use futures::StreamExt;
use reqwest::{ header::{ AUTHORIZATION, CONTENT_TYPE }, Client };
use tauri::Emitter;

use super::siliconflow_types::{
    AiResponse,
    Message,
    MessageRole,
    RequestBody,
    ResponseFormat,
    StreamResponse,
};

pub struct AiService {
    app_handle: tauri::AppHandle,
    endpoint: String,
    api_key: String,
    model_name: String,
    messages: Vec<Message>,
}

impl AiService {
    pub fn new(
        app_handle: tauri::AppHandle,
        endpoint: String,
        api_key: String,
        model_name: String
    ) -> Self {
        Self {
            app_handle,
            endpoint,
            api_key,
            model_name,
            messages: Vec::new(),
        }
    }
    fn extract_content(response: AiResponse) -> Option<String> {
        response.choices
            .into_iter()
            .next()
            .map(|choice| choice.message.content)
    }
    fn extract_stream_reason(response: StreamResponse) -> Option<String> {
        response.choices
            .into_iter()
            .next()
            .map(|choice| choice.delta.reasoning_content)?
    }
    fn extract_stream_content(response: StreamResponse) -> Option<String> {
        response.choices
            .into_iter()
            .next()
            .map(|choice| choice.delta.content)?
    }
    pub async fn send(&mut self, content: String, hook_id: String) -> Result<(), String> {
        self.messages.push(Message { role: MessageRole::User, content });
        let request_body = RequestBody {
            model: self.model_name.clone(),
            messages: self.messages.clone(),
            stream: Some(true),
            max_tokens: None,
            stop: None,
            temperature: None,
            top_p: None,
            top_k: None,
            frequency_penalty: None,
            n: None,
            response_format: None,
            tools: None,
        };

        let client = Client::new();
        let response = client
            .post(&self.endpoint)
            .header(AUTHORIZATION, format!("Bearer {}", &self.api_key))
            .header(CONTENT_TYPE, "application/json")
            .json(&request_body)
            .send().await
            .map_err(|e| format!("Failed to send request: {e}"))?;

        if response.status().is_success() {
            let mut stream = response.bytes_stream();
            let mut full_text = String::new();
            while let Some(chunk_result) = stream.next().await {
                match chunk_result {
                    Ok(chunk) => {
                        if let Ok(text) = String::from_utf8(chunk.to_vec()) {
                            let actual_text = if &text[..5] == "data:" {
                                &text[6..]
                            } else {
                                &text
                            };
                            match serde_json::from_str::<StreamResponse>(actual_text) {
                                Ok(response) => {
                                    let mut emit_id = hook_id.clone();
                                    let mut content = AiService::extract_stream_content(
                                        response.clone()
                                    ).unwrap_or_default();
                                    if content.is_empty() {
                                        content =
                                            AiService::extract_stream_reason(
                                                response
                                            ).unwrap_or_default();
                                        if !content.trim().is_empty() {
                                            emit_id = format!("{hook_id}_reason");
                                        }
                                    }
                                    full_text += content.as_str();
                                    if !content.is_empty() {
                                        self.app_handle
                                            .emit(&emit_id, content)
                                            .map_err(|e| format!("Failed to emit event: {e}"))?;
                                    }
                                }
                                Err(_) => {
                                    continue;
                                }
                            }
                        } else {
                            return Err(String::from("Received non-UTF-8 chunk"));
                        }
                    }
                    Err(e) => {
                        self.app_handle
                            .emit(&format!("{hook_id}_error"), e.to_string())
                            .map_err(|e| format!("Failed to emit event: {e}"))?;
                        return Err(format!("Error receiving chunk: {e}"));
                    }
                }
            }
            self.messages.push(Message { role: MessageRole::Assistant, content: full_text });
            self.app_handle
                .emit(&format!("{hook_id}_end"), ())
                .map_err(|e| format!("Failed to emit event: {e}"))?;
            Ok(())
        } else {
            Err(format!("Error: {:?}", response))
        }
    }
    pub async fn test(&self) -> Result<String, String> {
        let current_time = Utc::now().with_timezone(&FixedOffset::east_opt(8 * 3600).unwrap());
        let format_time = current_time.format("%Y-%m-%d %H:%M").to_string();

        let request_body = RequestBody {
            model: self.model_name.clone(),
            messages: vec![Message {
                role: MessageRole::User,
                content: format!(
                    "This test message send at {format_time}, please send back something for further test."
                ),
            }],
            stream: None,
            max_tokens: None,
            stop: None,
            temperature: None,
            top_p: None,
            top_k: None,
            frequency_penalty: None,
            n: None,
            response_format: Some(ResponseFormat {
                response_type: String::from("text"),
            }),
            tools: None,
        };

        let client = Client::new();
        let response = client
            .post(&self.endpoint)
            .header(AUTHORIZATION, format!("Bearer {}", &self.api_key))
            .header(CONTENT_TYPE, "application/json")
            .json(&request_body)
            .send().await
            .map_err(|e| format!("Failed to send request: {e}"))?;

        if response.status().is_success() {
            let response_body: AiResponse = response
                .json().await
                .map_err(|e| format!("Failed to parse response body as JSON: {e}"))?;
            Ok(AiService::extract_content(response_body).unwrap_or_default())
        } else {
            Err(format!("Error: {:?}", response))
        }
    }
    pub fn clear_history(&mut self) {
        self.messages.clear();
    }
}
