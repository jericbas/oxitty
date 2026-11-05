use axum::{
    extract::{
        ws::{Message, WebSocket},
        State, WebSocketUpgrade,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use oxyd_core::Session;
use oxyd_protocol::{ClientConfig, ClientMessage, ServerMessage};
use std::sync::Arc;
use crate::cli::CliArgs;

#[derive(Clone)]
pub struct AppState {
    pub cli: Arc<CliArgs>,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state))
}

async fn handle_socket(socket: WebSocket, state: AppState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let command = state.cli.resolved_command();

    let session_result = Session::new(&command, &state.cli.args, 80, 24);
    let (session, mut pty_rx) = match session_result {
        Ok(res) => res,
        Err(err) => {
            let err_msg = ServerMessage::Error(format!("Failed to spawn PTY: {}", err));
            if let Ok(json) = serde_json::to_string(&err_msg) {
                let _ = ws_sender.send(Message::Text(json.into())).await;
            }
            return;
        }
    };

    let session = Arc::new(session);

    // Initial handshake
    let init_msg = ServerMessage::Init(ClientConfig {
        session_id: session.id.clone(),
        title: state.cli.title.clone(),
        read_only: state.cli.readonly,
        font_family: "JetBrains Mono, Menlo, monospace".to_string(),
        font_size: 14,
        cursor_blink: true,
    });

    if let Ok(json) = serde_json::to_string(&init_msg) {
        let _ = ws_sender.send(Message::Text(json.into())).await;
    }

    // Bi-directional event loop
    loop {
        tokio::select! {
            // Forward PTY output to client
            Some(output_bytes) = pty_rx.recv() => {
                let text = String::from_utf8_lossy(&output_bytes).to_string();
                let msg = ServerMessage::Output(text);
                if let Ok(json) = serde_json::to_string(&msg) {
                    if ws_sender.send(Message::Text(json.into())).await.is_err() {
                        break;
                    }
                }
            }
            // Receive commands/input from client
            Some(Ok(ws_msg)) = ws_receiver.next() => {
                match ws_msg {
                    Message::Text(payload) => {
                        if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&payload) {
                            match client_msg {
                                ClientMessage::Input(input_data) => {
                                    if !state.cli.readonly {
                                        let _ = session.write_input(input_data.as_bytes()).await;
                                    }
                                }
                                ClientMessage::Resize(resize) => {
                                    let _ = session.resize(resize.cols, resize.rows).await;
                                }
                                ClientMessage::Ping => {
                                    let pong = ServerMessage::Pong;
                                    if let Ok(json) = serde_json::to_string(&pong) {
                                        let _ = ws_sender.send(Message::Text(json.into())).await;
                                    }
                                }
                                _ => {}
                            }
                        }
                    }
                    Message::Close(_) => break,
                    _ => {}
                }
            }
            else => break,
        }
    }

    tracing::info!("Client disconnected session {}", session.id);
}
