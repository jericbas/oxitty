use crate::pty::{spawn_pty, PtyError, PtyWriter};
use std::sync::Arc;
use tokio::sync::{mpsc, Mutex};
use uuid::Uuid;

pub struct Session {
    pub id: String,
    writer: Arc<Mutex<PtyWriter>>,
}

impl Session {
    pub fn new(
        command: &str,
        args: &[String],
        cols: u16,
        rows: u16,
    ) -> Result<(Self, mpsc::Receiver<Vec<u8>>), PtyError> {
        let id = Uuid::new_v4().to_string();
        let (writer, mut reader) = spawn_pty(command, args, cols, rows)?;
        let (out_tx, out_rx) = mpsc::channel::<Vec<u8>>(128);

        tokio::task::spawn_blocking(move || {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => {
                        tracing::debug!("PTY reached EOF");
                        break;
                    }
                    Ok(n) => {
                        if out_tx.blocking_send(buf[..n].to_vec()).is_err() {
                            tracing::debug!("Receiver dropped, closing PTY reader loop");
                            break;
                        }
                    }
                    Err(e) => {
                        tracing::error!("Error reading PTY: {}", e);
                        break;
                    }
                }
            }
        });

        Ok((
            Self {
                id,
                writer: Arc::new(Mutex::new(writer)),
            },
            out_rx,
        ))
    }

    pub async fn write_input(&self, data: &[u8]) -> Result<(), PtyError> {
        let mut writer = self.writer.lock().await;
        writer.write_all(data)
    }

    pub async fn resize(&self, cols: u16, rows: u16) -> Result<(), PtyError> {
        let pty = self.writer.lock().await;
        pty.resize(cols, rows)
    }
}
