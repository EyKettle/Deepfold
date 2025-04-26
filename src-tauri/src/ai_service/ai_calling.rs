use std::sync::Arc;

use futures::{FutureExt, StreamExt};
use reqwest::{
    header::{AUTHORIZATION, CONTENT_TYPE},
    Client,
};
use reqwest_eventsource::{Event, EventSource};
use tauri::{
    async_runtime::{spawn, Mutex},
    ipc::Channel,
};
use tokio::{
    pin, select,
    sync::{
        oneshot::{self, Receiver, Sender},
        RwLock,
    },
};

use crate::ai_service::service_types::{StreamError, StreamErrorDetail, StreamErrorType};

use super::{
    errors::{Error, Parameter},
    service_types::StreamEvent,
    siliconflow_types::{AiResponse, Message, MessageRole, RequestBody, StreamResponse},
};

pub struct AiService {
    endpoint: RwLock<String>,
    api_key: RwLock<String>,
    model_name: RwLock<String>,
    messages: Arc<RwLock<Vec<Message>>>,
    stop_sender: Arc<Mutex<Option<Sender<()>>>>,
}

impl AiService {
    pub fn new(endpoint: String, api_key: String, model_name: String) -> Self {
        Self {
            endpoint: RwLock::new(endpoint),
            api_key: RwLock::new(api_key),
            model_name: RwLock::new(model_name),
            messages: Arc::new(RwLock::new(Vec::new())),
            stop_sender: Arc::new(Mutex::new(None)),
        }
    }
    pub async fn reset(
        &self,
        endpoint: Option<String>,
        api_key: Option<String>,
        model_name: Option<String>,
    ) -> Result<(), Error> {
        if let Some(ep) = endpoint {
            *self.endpoint.write().await = ep;
        }
        if let Some(key) = api_key {
            *self.api_key.write().await = key;
        }
        if let Some(model) = model_name {
            *self.model_name.write().await = model;
        }
        self.stop().await?;
        Ok(())
    }
    async fn parse_siliconflow(
        channel: Channel<StreamEvent>,
        mut eventsource: EventSource,
        messages: Arc<RwLock<Vec<Message>>>,
        rx_stop: Receiver<()>,
    ) -> Result<(), Error> {
        let mut msg_list = messages.write().await;
        let mut full_text = String::new();
        let mut interrupted = false;
        let rx_stop = rx_stop.fuse();
        pin!(rx_stop);

        loop {
            select! {
                event = eventsource.next() => {
                    match event {
                        Some(Ok(Event::Message(message))) => {
                            if !message.data.trim().is_empty() && message.data != "[DONE]" {
                                match serde_json::from_str::<StreamResponse>(&message.data) {
                                    Ok(response) => {
                                        // TODO: reasoning support
                                        // let mut emit_id = hook_id.clone();
                                        let content =
                                            AiService::extract_stream_content(response.clone())
                                                .unwrap_or_default();
                                        // if content.is_empty() {
                                        //     content = AiService::extract_stream_reason(response)
                                        //         .unwrap_or_default();
                                        //     if !content.trim().is_empty() {
                                        //         emit_id = format!("{hook_id}_reason");
                                        //     }
                                        // }
                                        full_text += content.as_str();
                                        if !content.is_empty() {
                                            channel.send(StreamEvent::Push(content)).map_err(Error::StreamChannel)?;
                                        }
                                    }
                                    Err(e) => {
                                        println!("---\n[ERROR] [Serde] cannot parse\n - Origin message:\n{}\n - Actual error:\n{}\n---\n", message.data, e);
                                        channel.send(StreamEvent::Error(StreamError {
                                            error_type: StreamErrorType::Serialize,
                                            detail: StreamErrorDetail::String(e.to_string()),
                                        })).map_err(Error::StreamChannel)?;
                                        msg_list.push(Message {
                                            role: MessageRole::System,
                                            content: e.to_string(),
                                        });
                                        continue;
                                    }
                                }
                            }
                        }
                        Some(Err(e)) => match e {
                            reqwest_eventsource::Error::StreamEnded => break,
                            reqwest_eventsource::Error::InvalidStatusCode(s,e) => {
                                let error_msg = reqwest_eventsource::Error::InvalidStatusCode(s, e).to_string();
                                channel.send(StreamEvent::Error(StreamError {
                                    error_type: StreamErrorType::RequestSending,
                                    detail: StreamErrorDetail::String(error_msg.clone()),
                                })).map_err(Error::StreamChannel)?;
                                msg_list.push(Message {
                                    role: MessageRole::System,
                                    content: error_msg,
                                });
                                return Err(Error::InterceptedEventsource);
                            }
                            reqwest_eventsource::Error::Transport(e) => {
                                if e.is_request() {
                                    let error_msg = reqwest_eventsource::Error::Transport(e).to_string();
                                    channel.send(StreamEvent::Error(StreamError {
                                        error_type: StreamErrorType::RequestSending,
                                        detail: StreamErrorDetail::String(error_msg.clone()),
                                    })).map_err(Error::StreamChannel)?;
                                    msg_list.push(Message {
                                        role: MessageRole::System,
                                        content: error_msg,
                                    });
                                    return Err(Error::InterceptedEventsource);
                                } else {
                                    return Err(Error::Eventsource(reqwest_eventsource::Error::Transport(e)));
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
        if full_text.trim().is_empty() {
            channel
                .send(StreamEvent::End {
                    interrupted,
                    messages: Vec::new(),
                })
                .map_err(Error::StreamChannel)?;
            return Ok(());
        }
        msg_list.push(Message {
            role: MessageRole::Assistant,
            content: full_text,
        });
        if interrupted {
            msg_list.push(Message {
                role: MessageRole::System,
                content: "[Assistant message is interrupted by user's next message]".to_string(),
            });
        }
        drop(msg_list);
        channel
            .send(StreamEvent::End {
                interrupted,
                messages: messages.read().await.to_vec(),
            })
            .map_err(Error::StreamChannel)?;
        Ok(())
    }
    fn _extract_content(response: AiResponse) -> Option<String> {
        response
            .choices
            .into_iter()
            .next()
            .map(|choice| choice.message.content)
    }
    // fn extract_stream_reason(response: StreamResponse) -> Option<String> {
    //     response
    //         .choices
    //         .into_iter()
    //         .next()
    //         .map(|choice| choice.delta.reasoning_content)?
    // }
    fn extract_stream_content(response: StreamResponse) -> Option<String> {
        response
            .choices
            .into_iter()
            .next()
            .map(|choice| choice.delta.content)?
    }
    async fn check_props(&self, channel: Option<Channel<StreamEvent>>) -> Result<(), Error> {
        let mut empty_items = Vec::new();
        if self.endpoint.read().await.is_empty() {
            empty_items.push(Parameter::Endpoint);
        }
        if self.api_key.read().await.is_empty() {
            empty_items.push(Parameter::APIKey);
        }
        if self.model_name.read().await.is_empty() {
            empty_items.push(Parameter::ModelName);
        }
        if empty_items.is_empty() {
            Ok(())
        } else {
            if let Some(channel) = channel {
                let _ = channel.send(StreamEvent::Error(StreamError {
                    error_type: StreamErrorType::EmptyParameter,
                    detail: StreamErrorDetail::Parameter(empty_items.clone()),
                }));
            }
            Err(Error::EmptyParameter(empty_items))
        }
    }
    pub async fn send(&self, content: String, channel: Channel<StreamEvent>) -> Result<(), Error> {
        self.check_props(Some(channel.clone())).await?;
        self.stop().await?;
        self.messages.write().await.push(Message {
            role: MessageRole::User,
            content,
        });
        let request_body = RequestBody {
            model: self.model_name.read().await.to_string(),
            messages: self.messages.read().await.to_vec(),
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
        let request_builder = client
            .post(self.endpoint.read().await.to_string())
            .header(
                AUTHORIZATION,
                format!("Bearer {}", self.api_key.read().await),
            )
            .header(CONTENT_TYPE, "application/json")
            .json(&request_body);
        let eventsource = EventSource::new(request_builder).map_err(Error::Reqwest)?;

        let mut stop = self.stop_sender.lock().await;
        if stop.is_some() {
            return Err(Error::UnexpectedStream);
        }
        let (tx_stop, rx_stop) = oneshot::channel();
        *stop = Some(tx_stop);
        let messages = self.messages.clone();

        spawn(AiService::parse_siliconflow(
            channel,
            eventsource,
            messages,
            rx_stop,
        ));
        Ok(())
    }
    pub async fn stop(&self) -> Result<(), Error> {
        self.check_props(None).await?;
        if let Some(stop) = self.stop_sender.lock().await.take() {
            let _ = stop.send(());
        }
        Ok(())
    }
    pub async fn get_history(&self) -> Vec<Message> {
        self.messages.read().await.to_vec()
    }
    pub async fn clear_history(&self) {
        let _ = self.stop().await;
        self.messages.write().await.clear();
    }
}
