use crate::cli::CliArgs;
use crate::config::OxittyConfig;
use axum::{
    extract::{
        ws::{Message, WebSocket},
        Query, State, WebSocketUpgrade,
    },
    response::IntoResponse,
};
use futures::{SinkExt, StreamExt};
use oxitty_core::SessionManager;
use oxitty_protocol::{ClientConfig, ClientMessage, ServerMessage};
use std::sync::Arc;
use uuid::Uuid;

#[derive(Clone)]
pub struct AppState {
    pub cli: Arc<CliArgs>,
    pub config: Arc<OxittyConfig>,
    pub sessions: SessionManager,
}

#[derive(serde::Deserialize, Default, Debug)]
pub struct WsQuery {
    pub session: Option<String>,
    pub observer: Option<bool>,
    pub readonly: Option<bool>,
}

pub async fn ws_handler(
    ws: WebSocketUpgrade,
    Query(query): Query<WsQuery>,
    State(state): State<AppState>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, query, state))
}

async fn handle_socket(socket: WebSocket, query: WsQuery, state: AppState) {
    let (mut ws_sender, mut ws_receiver) = socket.split();
    let command = state.cli.resolved_command();

    let session = if state.cli.shared {
        if let Some(ref id) = query.session {
            match state.sessions.get_session(id).await {
                Some(s) => s,
                None => match state
                    .sessions
                    .get_or_create_shared(&command, &state.cli.args)
                    .await
                {
                    Ok(s) => s,
                    Err(e) => return send_error(&mut ws_sender, &e.to_string()).await,
                },
            }
        } else {
            match state
                .sessions
                .get_or_create_shared(&command, &state.cli.args)
                .await
            {
                Ok(s) => s,
                Err(e) => return send_error(&mut ws_sender, &e.to_string()).await,
            }
        }
    } else if let Some(ref id) = query.session {
        match state.sessions.get_session(id).await {
            Some(s) => s,
            None => match state
                .sessions
                .create_session(&command, &state.cli.args)
                .await
            {
                Ok(s) => s,
                Err(e) => return send_error(&mut ws_sender, &e.to_string()).await,
            },
        }
    } else {
        match state
            .sessions
            .create_session(&command, &state.cli.args)
            .await
        {
            Ok(s) => s,
            Err(e) => return send_error(&mut ws_sender, &e.to_string()).await,
        }
    };

    let is_observer =
        query.observer.unwrap_or(false) || query.readonly.unwrap_or(false) || state.cli.readonly;
    let client_id = Uuid::new_v4().to_string();
    let (mut pty_rx, replay_buf) = session.subscribe();

    let init_msg = ServerMessage::Init(Box::new(ClientConfig {
        session_id: session.id.clone(),
        title: state.cli.title(),
        read_only: is_observer,
        font_family: state
            .config
            .terminal
            .font_family
            .clone()
            .unwrap_or_else(|| "JetBrains Mono, Menlo, monospace".to_string()),
        font_size: state.config.terminal.font_size.unwrap_or(14),
        cursor_blink: state.config.terminal.cursor_blink.unwrap_or(true),
        theme: state.config.theme.preset.clone(),
        custom_colors: state.config.theme.colors.clone(),
        keybindings: Some(state.config.keybindings.clone()),
    }));

    if let Ok(json) = serde_json::to_string(&init_msg) {
        let _ = ws_sender.send(Message::Text(json.into())).await;
    }

    if !replay_buf.is_empty() {
        let replay = ServerMessage::Output(String::from_utf8_lossy(&replay_buf).to_string());
        if let Ok(json) = serde_json::to_string(&replay) {
            let _ = ws_sender.send(Message::Text(json.into())).await;
        }
    }

    loop {
        tokio::select! {
            Ok(output_bytes) = pty_rx.recv() => {
                let text = String::from_utf8_lossy(&output_bytes).to_string();
                let msg = ServerMessage::Output(text);
                if let Ok(json) = serde_json::to_string(&msg) {
                    if ws_sender.send(Message::Text(json.into())).await.is_err() {
                        break;
                    }
                }
            }
            Some(Ok(ws_msg)) = ws_receiver.next() => {
                match ws_msg {
                    Message::Text(payload) => {
                        if let Ok(client_msg) = serde_json::from_str::<ClientMessage>(&payload) {
                            match client_msg {
                                ClientMessage::Input(input_data) if !is_observer => {
                                    let _ = session.write_input(input_data.as_bytes()).await;
                                }
                                ClientMessage::Resize(resize) if !is_observer => {
                                    let _ = session.update_client_size(&client_id, resize.cols, resize.rows).await;
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

    let _ = session.remove_client(&client_id).await;
}

async fn send_error(ws_sender: &mut futures::stream::SplitSink<WebSocket, Message>, err: &str) {
    let err_msg = ServerMessage::Error(format!("Failed to attach PTY session: {}", err));
    if let Ok(json) = serde_json::to_string(&err_msg) {
        let _ = ws_sender.send(Message::Text(json.into())).await;
    }
}
