use serde::{Deserialize, Serialize};
use std::io::Write;
use std::net::TcpStream;
// --- STRUCTURES DE DONNÉES ---

#[derive(Debug, Serialize, Deserialize)]
pub struct PrintItem {
    name: String,
    qty: i32,
    price: Option<f64>,
    note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct OrderPayload {
    reference: String,
    customer_name: String,
    date: String,
    total: f64,
    items: Vec<PrintItem>,
    waiter_name: Option<String>, // Ajouté pour plus de détail
    table_name: Option<String>,  // Ajouté pour plus de détail
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PrinterConfig {
    ip: String,
    port: u16,
}

// --- COMMANDES TAURI ---

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
fn print_order(payload: OrderPayload) -> Result<String, String> {
    // <--- Vérifie le nom ici
    println!(
        "Impression commande {} sur {}:{}",
        payload.reference, payload.customer_name, payload.reference
    );
    Ok(format!("Ticket {} envoyé", payload.reference))
}

#[tauri::command]
async fn print_thermal_receipt(
    payload: OrderPayload,
    config: PrinterConfig,
) -> Result<String, String> {
    // Logique d'impression réelle ici
    println!(
        "Impression commande {} sur {}:{}",
        payload.reference, config.ip, config.port
    );
    Ok(format!("Ticket {} envoyé", payload.reference))
}

#[tauri::command]
async fn save_to_local_db(payload: serde_json::Value) -> Result<(), String> {
    // Logique pour sauvegarder dans SQLite ou un fichier JSON local
    println!("Sauvegarde locale de la commande effectuée");
    Ok(())
}

// --- POINT D'ENTRÉE ---

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_thermal_printer::init())
        .plugin(
            tauri_plugin_log::Builder::new()
                .level(log::LevelFilter::Debug) // Debug en dev, passer à Info en prod
                .build(),
        )
        .invoke_handler(tauri::generate_handler![
            greet,
            print_thermal_receipt,
            save_to_local_db,
            print_order
        ])
        .setup(|_app| {
            log::info!("Application démarrée — plugins chargés");
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
