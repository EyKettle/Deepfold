use std::{ error::Error, fmt };

#[derive(Debug)]
pub enum AiServiceErrors {
    NotInitialized,
    OpenAIError(String),
    APIError(String),
    ContentError(String),
}

impl fmt::Display for AiServiceErrors {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            AiServiceErrors::NotInitialized => write!(f, "Not initialized"),
            AiServiceErrors::OpenAIError(e) => write!(f, "OpenAI Error: {}", e),
            AiServiceErrors::APIError(e) => write!(f, "API Error: {}", e),
            AiServiceErrors::ContentError(e) => write!(f, "Content Error: {}", e),
        }
    }
}

impl Error for AiServiceErrors {}
