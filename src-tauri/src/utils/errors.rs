use std::io;

use thiserror::Error;

#[derive(Debug, Error)]
pub enum Error {
    #[error("Read failed: {0}")]
    Read(io::Error),
    #[error("Write failed: {0}")]
    Write(io::Error),
    #[error("Toml format failed: {0}")]
    Format(toml::ser::Error),
    #[error("Toml parse failed: {0}")]
    Parse(toml::de::Error),
}
