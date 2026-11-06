pub mod config;
pub use config::*;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Terminal window resize request payload.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, TS)]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
pub struct ResizePayload {
    pub cols: u16,
    pub rows: u16,
}

/// Initial handshake configuration sent from backend to frontend.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
pub struct ClientConfig {
    pub session_id: String,
    pub title: String,
    pub read_only: bool,
    pub font_family: String,
    pub font_size: u16,
    pub cursor_blink: bool,
    #[ts(optional)]
    pub theme: Option<String>,
    #[ts(optional)]
    pub custom_colors: Option<CustomColors>,
    #[ts(optional)]
    pub keybindings: Option<KeybindingsConfig>,
}

/// Messages sent from the browser client to the Rust server.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[serde(tag = "type", content = "payload")]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
pub enum ClientMessage {
    /// Raw terminal input data (keystrokes / paste).
    Input(String),
    /// Resize terminal dimensions.
    Resize(ResizePayload),
    /// Client keepalive heartbeat ping.
    Ping,
    /// Pause output flow from PTY.
    Pause,
    /// Resume output flow from PTY.
    Resume,
}

/// Messages sent from the Rust server to the browser client.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, TS)]
#[serde(tag = "type", content = "payload")]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
pub enum ServerMessage {
    /// Initial session handshake and terminal configuration.
    Init(Box<ClientConfig>),
    /// Raw terminal output bytes encoded as UTF-8 string.
    Output(String),
    /// Set window title update.
    SetTitle(String),
    /// Process exit notification with optional exit code.
    ProcessExited(Option<i32>),
    /// Keepalive response pong.
    Pong,
    /// Server error notification.
    Error(String),
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn generate_typescript_bindings() {
        ResizePayload::export().expect("failed to export ResizePayload");
        ClientConfig::export().expect("failed to export ClientConfig");
        ClientMessage::export().expect("failed to export ClientMessage");
        ServerMessage::export().expect("failed to export ServerMessage");
        CustomColors::export().expect("failed to export CustomColors");
        KeybindingsConfig::export().expect("failed to export KeybindingsConfig");
    }

    #[test]
    fn test_serialization() {
        let resize = ClientMessage::Resize(ResizePayload { cols: 80, rows: 24 });
        let json = serde_json::to_string(&resize).expect("failed to serialize");
        let decoded: ClientMessage = serde_json::from_str(&json).expect("failed to deserialize");
        assert_eq!(resize, decoded);
    }
}
