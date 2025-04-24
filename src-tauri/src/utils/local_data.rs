use std::path::PathBuf;

use futures::TryFutureExt;
use serde::{Deserialize, Serialize};
use tokio::{
    fs::{read_to_string, write},
    sync::RwLock,
};

use super::errors::Error;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CoreData {
    endpoint: String,
    api_key: String,
    model_name: String,
}

pub struct LocalData {
    core_file: PathBuf,
    core_data: RwLock<CoreData>,
}

impl LocalData {
    pub fn new(core_file: PathBuf) -> Self {
        Self {
            core_file,
            core_data: RwLock::new(CoreData {
                endpoint: String::new(),
                api_key: String::new(),
                model_name: String::new(),
            }),
        }
    }
    pub async fn set(
        &self,
        endpoint: Option<String>,
        api_key: Option<String>,
        model_name: Option<String>,
    ) {
        let mut core_data = self.core_data.write().await;
        if let Some(ep) = endpoint {
            core_data.endpoint = ep
        }
        if let Some(k) = api_key {
            core_data.api_key = k
        }
        if let Some(n) = model_name {
            core_data.model_name = n
        }
    }
    pub async fn save(&self) -> Result<(), Error> {
        let data = self.core_data.read().await.clone();
        let contents = toml::to_string_pretty(&data).map_err(Error::Format)?;
        write(&self.core_file, contents)
            .map_err(Error::Write)
            .await?;
        Ok(())
    }
    pub async fn load(&self) -> Result<(), Error> {
        let contents = read_to_string(&self.core_file).map_err(Error::Read).await?;
        let data = toml::from_str::<CoreData>(&contents).map_err(Error::Parse)?;
        *self.core_data.write().await = data;
        Ok(())
    }
    pub async fn read(&self) -> CoreData {
        self.core_data.read().await.clone()
    }
}
