use schemars::{ schema_for, JsonSchema, SchemaGenerator };
use serde::{ Deserialize, Serialize };

use super::openai_types::Tool;

#[derive(Debug, Clone)]
pub enum ToolName {
    TestCall,
    ProgramSendMessage,
}

impl ToolName {
    pub fn as_str(&self) -> &str {
        match self {
            Self::TestCall => "test_call",
            Self::ProgramSendMessage => "program_send_message",
        }
    }
    pub fn parse(name: &str) -> Result<Self, ()> {
        match name {
            "test_call" => Ok(Self::TestCall),
            "program_send_message" => Ok(Self::ProgramSendMessage),
            _ => Err(()),
        }
    }
}

pub fn get_tools() -> Vec<Tool> {
    let schema_generator = SchemaGenerator::default()
        .settings()
        .clone()
        .with(|s| {
            s.inline_subschemas = true;
            s.option_add_null_type = false;
            s.option_nullable = true;
        })
        .into_generator();

    let test_toolcall = Tool::new(
        ToolName::TestCall.as_str(),
        "Test if user's program support tool call.",
        None
    );
    let test_message = Tool::new(
        ToolName::ProgramSendMessage.as_str(),
        "Send a fallback message to user's program. Only use it in which scene it refers **User's Program** confirmly.",
        Some(schema_generator.into_root_schema_for::<SendMessageParams>().schema)
    );
    Vec::from([test_toolcall, test_message])
}

#[derive(Debug, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub struct SendMessageParams {
    #[schemars(description = "What message you want to send to user's program")]
    pub message_content: String,
    #[schemars(description = "What's the emergency level of your message. Empty for `info`.")]
    pub message_level: Option<EmergencyLevel>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, JsonSchema)]
#[serde(rename_all = "camelCase")]
pub enum EmergencyLevel {
    #[default]
    Info,
    Warn,
    Error,
}

impl EmergencyLevel {
    pub fn as_str(&self) -> &str {
        match self {
            Self::Info => "info",
            Self::Warn => "warn",
            Self::Error => "error",
        }
    }
}
