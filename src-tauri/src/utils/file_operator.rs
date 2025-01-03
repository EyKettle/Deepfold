use std::{fs::File, io::Read};

#[tauri::command]
pub fn read_path(path: &str) -> String {
    let mut file = File::open(path).unwrap();
    let mut contents = String::new();
    file.read_to_string(&mut contents).unwrap();
    contents
}
