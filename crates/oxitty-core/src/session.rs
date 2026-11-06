use crate::pty::{spawn_pty, PtyError, PtyWriter};
use crate::ring_buffer::RingBuffer;
use std::collections::HashMap;
use std::sync::{Arc, Mutex as StdMutex};
use tokio::sync::{broadcast, Mutex};
use uuid::Uuid;

pub struct Session {
    pub id: String,
    writer: Arc<Mutex<PtyWriter>>,
    tx: broadcast::Sender<Vec<u8>>,
    ring_buffer: Arc<StdMutex<RingBuffer>>,
    client_sizes: Arc<Mutex<HashMap<String, (u16, u16)>>>,
}

impl Session {
    pub fn new(command: &str, args: &[String], cols: u16, rows: u16) -> Result<Self, PtyError> {
        let id = Uuid::new_v4().to_string();
        let (writer, mut reader) = spawn_pty(command, args, cols, rows)?;
        let (broadcast_tx, _) = broadcast::channel::<Vec<u8>>(512);
        let ring_buffer = Arc::new(StdMutex::new(RingBuffer::new(128 * 1024)));

        let tx_clone = broadcast_tx.clone();
        let rb_clone = Arc::clone(&ring_buffer);

        tokio::task::spawn_blocking(move || {
            let mut buf = [0u8; 4096];
            loop {
                match reader.read(&mut buf) {
                    Ok(0) => {
                        tracing::debug!("PTY reached EOF");
                        break;
                    }
                    Ok(n) => {
                        let chunk = &buf[..n];
                        if let Ok(mut rb) = rb_clone.lock() {
                            rb.extend(chunk);
                        }
                        let _ = tx_clone.send(chunk.to_vec());
                    }
                    Err(e) => {
                        tracing::error!("Error reading PTY: {}", e);
                        break;
                    }
                }
            }
        });

        Ok(Self {
            id,
            writer: Arc::new(Mutex::new(writer)),
            tx: broadcast_tx,
            ring_buffer,
            client_sizes: Arc::new(Mutex::new(HashMap::new())),
        })
    }

    pub fn subscribe(&self) -> (broadcast::Receiver<Vec<u8>>, Vec<u8>) {
        let rx = self.tx.subscribe();
        let snapshot = self
            .ring_buffer
            .lock()
            .map(|rb| rb.snapshot())
            .unwrap_or_default();
        (rx, snapshot)
    }

    pub async fn write_input(&self, data: &[u8]) -> Result<(), PtyError> {
        let mut writer = self.writer.lock().await;
        writer.write_all(data)
    }

    pub async fn update_client_size(
        &self,
        client_id: &str,
        cols: u16,
        rows: u16,
    ) -> Result<(), PtyError> {
        let mut sizes = self.client_sizes.lock().await;
        sizes.insert(client_id.to_string(), (cols, rows));
        let min_cols = sizes.values().map(|(c, _)| *c).min().unwrap_or(cols);
        let min_rows = sizes.values().map(|(_, r)| *r).min().unwrap_or(rows);
        drop(sizes);
        self.resize(min_cols, min_rows).await
    }

    pub async fn remove_client(&self, client_id: &str) -> Result<(), PtyError> {
        let mut sizes = self.client_sizes.lock().await;
        sizes.remove(client_id);
        if let Some((min_cols, min_rows)) = sizes.values().next().copied() {
            let min_c = sizes.values().map(|(c, _)| *c).min().unwrap_or(min_cols);
            let min_r = sizes.values().map(|(_, r)| *r).min().unwrap_or(min_rows);
            drop(sizes);
            self.resize(min_c, min_r).await?;
        }
        Ok(())
    }

    pub async fn resize(&self, cols: u16, rows: u16) -> Result<(), PtyError> {
        let pty = self.writer.lock().await;
        pty.resize(cols, rows)
    }
}
