use std::{ fs::{self, File}, io::{ Read, Write } };

#[tauri::command]
pub fn read_path(path: &str) -> String {
    let mut file = File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    contents
}

#[tauri::command]
pub async fn create_file(file_path: &str, content: &str) -> Result<(), String> {
    if fs::metadata(file_path).is_ok() {
        return Err(format!("File already exists: {}", file_path));
    }
    let mut file = match File::create(file_path) {
        Ok(file) => file,
        Err(e) => {
            return Err(e.to_string());
        }
    };
    match file.write_all(content.as_bytes()) {
        Ok(_) => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}
