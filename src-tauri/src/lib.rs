use serde::{Deserialize, Serialize};
use std::net::TcpStream;
use std::io::Write;
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
    items: Vec<PrintItem>,
    total: f64,
    customer_name: Option<String>,
    date: String,
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
async fn print_thermal_receipt(payload: OrderPayload, config: PrinterConfig) -> Result<String, String> {
    // Logique d'impression réelle ici
    println!("Impression commande {} sur {}:{}", payload.reference, config.ip, config.port);
    Ok(format!("Ticket {} envoyé", payload.reference))
}
/* async fn print_thermal_receipt(payload: OrderPayload, config: PrinterConfig) -> Result<String, String> {
    // 1. Tentative de connexion à l'IP de l'imprimante (ex: 192.168.1.100:9100)
    let addr = format!("{}:{}", config.ip, config.port);
    
    let mut stream = TcpStream::connect(&addr)
        .map_err(|e| format!("Impossible de joindre l'imprimante à {}: {}", addr, e))?;

    // 2. Initialisation ESC/POS (Commandes standards)
    let mut command = Vec::new();
    command.extend_from_slice(b"\x1B\x40"); // Initialisation (ESC @)
    command.extend_from_slice(b"\x1B\x61\x01"); // Centrage
    command.extend_from_slice(format!("{}\n", "MONO-KEK RESTO").as_bytes());
    command.extend_from_slice(b"\x1B\x61\x00"); // Alignement gauche
    
    // 3. Boucle sur les articles
    for item in payload.items {
        let line = format!("{} x{} \n", item.name, item.qty);
        command.extend_from_slice(line.as_bytes());
    }

    command.extend_from_slice(b"\x1D\x56\x41\x03"); // Coupe du papier (Paper Cut)

    // 4. Envoi direct
    stream.write_all(&command)
        .map_err(|e| format!("Erreur d'envoi des données: {}", e))?;

    Ok("Impression réussie".into())
}
 */
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
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_notification::init()) // Note: .init() est souvent utilisé en v2
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            greet, 
            print_thermal_receipt, 
            save_to_local_db
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}