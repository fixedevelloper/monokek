/**
 * Types de protocoles d'impression supportés
 */
export const PRINTER_TYPES = {
  ESCPOS: 'escpos',
  STAR: 'star',
  PDF: 'pdf_virtual', // Pour les tests ou factures numériques
} as const;

/**
 * Types de connexion physique (Reflet de ta migration 'printers')
 */
export const PRINTER_CONNECTIONS = {
  USB: 'usb',
  LAN: 'lan',
  BLUETOOTH: 'bt',
} as const;

/**
 * Tailles de papier standard pour les imprimantes thermiques
 */
export const PAPER_SIZES = {
  MM58: '58mm', // Petites imprimantes mobiles/momo
  MM80: '80mm', // Standard restaurant (Epson TM-T88, etc.)
} as const;

/**
 * Commandes ESC/POS standards (Hexadécimal pour Rust/Tauri)
 * Ces constantes aident à formater le ticket brut côté Rust.
 */
export const ESCPOS_COMMANDS = {
  CUT: '\x1d\x56\x41',        // Coupe complète
  CENTER: '\x1b\x61\x01',     // Alignement centre
  LEFT: '\x1b\x61\x00',       // Alignement gauche
  BOLD_ON: '\x1b\x45\x01',    // Gras activé
  BOLD_OFF: '\x1b\x45\x00',   // Gras désactivé
  INIT: '\x1b\x40',           // Initialisation
};

/**
 * Configuration par défaut pour les succursales
 */
export const DEFAULT_PRINTER_CONFIG = {
  type: PRINTER_TYPES.ESCPOS,
  connection: PRINTER_CONNECTIONS.LAN,
  port: 9100, // Port standard pour les imprimantes réseau
  charSet: 'PC850_MULTILINGUAL', // Important pour les caractères spéciaux
};