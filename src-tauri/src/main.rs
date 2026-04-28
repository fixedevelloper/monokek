#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

// Cette ligne dit à Rust : "Va chercher le fichier lib.rs dans le même dossier"
mod lib;

fn main() {
    // Appelle la fonction run() qui est dans lib.rs
    lib::run();
}
