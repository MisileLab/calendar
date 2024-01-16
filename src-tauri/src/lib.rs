// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri_plugin_fs;
use tauri_plugin_dialog;

pub fn run() {
    let ctx = tauri::generate_context!();
    tauri::Builder::default()
    .plugin(tauri_plugin_dialog::init())
    .plugin(tauri_plugin_fs::init())
    .run(ctx).expect("build while running tauri application");
}
