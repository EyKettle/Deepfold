use std::{ collections::BTreeMap, sync::Arc };
use futures::{ FutureExt, StreamExt };
use reqwest::{ header::{ AUTHORIZATION, CONTENT_TYPE }, Client };
use reqwest_eventsource::{ Event, EventSource };
use tauri::{ async_runtime::{ spawn, Mutex }, ipc::Channel };
use tokio::{ pin, select, sync::{ oneshot::{ self, Receiver, Sender }, RwLock } };

use crate::{
    ai_service::{
        service_types::{ StreamError, StreamErrorDetail, StreamErrorType },
        siliconflow_types::{ self, CallFunction, StreamResponse },
        tool_calls::{ self, ToolName },
    },
    utils::EmptyResult,
};

use super::{ errors::DebugError, service_types::StreamEvent };

type Result<T> = core::result::Result<T, DebugError>;

pub struct DebugService {
    request_client: Client,
    stop_sender: Arc<Mutex<Option<Sender<()>>>>,
    logs: Arc<RwLock<Vec<String>>>,
}

impl DebugService {
    pub fn new() -> Self {
        Self {
            request_client: Client::new(),
            stop_sender: Arc::new(Mutex::new(None)),
            logs: Arc::new(RwLock::new(Vec::new())),
        }
    }
    pub async fn stop(&self) -> Result<()> {
        if let Some(stop) = self.stop_sender.lock().await.take() {
            let _ = stop.send(());
        }
        Ok(())
    }
    pub async fn send_json(
        &self,
        url: String,
        api_key: String,
        json: String,
        channel: Channel<StreamEvent>
    ) -> Result<()> {
        self.stop().await?;
        let builder = self.request_client
            .post(url)
            .header(AUTHORIZATION, format!("Bearer {api_key}"))
            .header(CONTENT_TYPE, "application/json")
            .body(json);
        let eventsource = EventSource::new(builder).map_err(DebugError::Reqwest)?;

        let mut stop = self.stop_sender.lock().await;
        if stop.is_some() {
            return Err(DebugError::UnexpectedStream);
        }
        let (tx_stop, rx_stop) = oneshot::channel();
        *stop = Some(tx_stop);
        let logs = self.logs.clone();

        spawn(DebugService::parse_siliconflow(channel, eventsource, rx_stop, logs));
        Ok(())
    }
    pub async fn parse_siliconflow(
        channel: Channel<StreamEvent>,
        mut eventsource: EventSource,
        rx_stop: Receiver<()>,
        logs: Arc<RwLock<Vec<String>>>
    ) -> EmptyResult {
        let mut full_text = String::new();
        let mut current_calls: BTreeMap<String, CallFunction> = BTreeMap::new();
        let mut interrupted = false;
        let rx_stop = rx_stop.fuse();
        pin!(rx_stop);

        logs.write().await.clear();
        loop {
            select! {
                event = eventsource.next() => {
                    match event {
                        Some(Ok(Event::Message(message))) => {
                            if !message.data.trim().is_empty() && message.data != "[DONE]" {
                                logs.write().await.push(serde_json::to_string_pretty(&serde_json::from_str::<serde_json::Value>(&message.data.clone()).unwrap_or_default()).unwrap_or_default());
                                match serde_json::from_str::<StreamResponse>(&message.data) {
                                    Ok(response) => {
                                        let content =
                                            siliconflow_types::extract_stream_content(response.clone())
                                                .unwrap_or_default();
                                        full_text += content.as_str();
                                        if !content.is_empty() {
                                            let _ = channel.send(StreamEvent::Push(content));
                                        }
                                        if let Ok(tool_calls) = siliconflow_types::get_tool_calls(response.clone()) {
                                            tool_calls.iter().for_each(|call| {
                                                let value = if let Some(id) = call.id.clone() {
                                                    Some(current_calls.entry(id).or_insert_with(||{CallFunction { name: None, arguments: None }}))
                                                } else {
                                                    current_calls.last_entry().map(|entry| entry.into_mut())
                                                };
                                                if let Some(value) = value {
                                                    if let Some(name) = call.function.name.clone() {
                                                        value.name = Some(name);
                                                    }
                                                    if let Some(arg) = call.function.arguments.clone() {
                                                        match &mut value.arguments {
                                                            Some(existing_string) => {
                                                                existing_string.push_str(&arg);
                                                            }
                                                            None => {
                                                                value.arguments = Some(arg);
                                                            }
                                                        }
                                                    }
                                                }
                                            });
                                        }
                                    }
                                    Err(e) => {
                                        println!("---\n[ERROR] [Serde] cannot parse\n - Origin message:\n{}\n - Actual error:\n{}\n---\n", message.data, e);
                                        let _ = channel.send(StreamEvent::Error(StreamError {
                                            error_type: StreamErrorType::Serialize,
                                            detail: StreamErrorDetail::String(e.to_string()),
                                        }));
                                        continue;
                                    }
                                }
                            }
                        }
                        Some(Err(e)) => match e {
                            reqwest_eventsource::Error::StreamEnded => break,
                            reqwest_eventsource::Error::InvalidStatusCode(s,e) => {
                                let e = reqwest_eventsource::Error::InvalidStatusCode(s, e).to_string();
                                let _ = channel.send(StreamEvent::Error(StreamError {
                                    error_type: StreamErrorType::RequestSending,
                                    detail: StreamErrorDetail::String(e.clone()),
                                }));
                                return Err(());
                            }
                            reqwest_eventsource::Error::Transport(e) => {
                                if e.is_request() {
                                    let e = reqwest_eventsource::Error::Transport(e).to_string();
                                    let _ = channel.send(StreamEvent::Error(StreamError {
                                        error_type: StreamErrorType::RequestSending,
                                        detail: StreamErrorDetail::String(e.clone()),
                                    }));
                                    return Err(());
                                } else {
                                    return Err(());
                                }
                            }
                            _ => {}
                        },
                        _ => {}
                    }
                },
                _ = (&mut rx_stop) => {
                    eventsource.close();
                    interrupted = true;
                    break;
                }
            }
        }
        for (_, call) in current_calls.into_iter() {
            if let Some(raw_arg) = call.arguments {
                if let Some(name) = call.name {
                    if let Ok(tool) = ToolName::parse(&name) {
                        match tool {
                            ToolName::ProgramSendMessage => if
                                let Ok(arg) = serde_json::from_str::<tool_calls::SendMessageParams>(
                                    &raw_arg
                                )
                            {
                                let msg = format!(
                                    "[{}] {}",
                                    arg.message_level.unwrap_or_default().as_str().to_uppercase(),
                                    arg.message_content
                                );
                                println!("{msg}");
                                let _ = channel.send(StreamEvent::Tool {
                                    name,
                                    state: msg,
                                });
                            }
                            ToolName::TestCall => println!("[INFO] ToolCall Test"),
                        }
                    }
                }
            }
        }
        if full_text.trim().is_empty() {
            let _ = channel.send(StreamEvent::End {
                interrupted,
                messages: Vec::new(),
            });
            return Err(());
        }
        let _ = channel.send(StreamEvent::End {
            interrupted,
            messages: Vec::new(),
        });
        Ok(())
    }
}
