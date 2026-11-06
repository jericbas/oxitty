use crate::pty::PtyError;
use crate::session::Session;
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

#[derive(Clone, Default)]
pub struct SessionManager {
    sessions: Arc<RwLock<HashMap<String, Arc<Session>>>>,
    shared_session_id: Arc<RwLock<Option<String>>>,
}

impl SessionManager {
    pub fn new() -> Self {
        Self::default()
    }

    pub async fn get_session(&self, id: &str) -> Option<Arc<Session>> {
        let session = self.sessions.read().await.get(id).cloned()?;
        if session.is_alive() {
            Some(session)
        } else {
            self.sessions.write().await.remove(id);
            None
        }
    }

    pub async fn get_or_create_shared(
        &self,
        command: &str,
        args: &[String],
    ) -> Result<Arc<Session>, PtyError> {
        let mut shared_id = self.shared_session_id.write().await;
        if let Some(id) = &*shared_id {
            if let Some(session) = self.get_session(id).await {
                return Ok(session);
            }
        }
        let session = Arc::new(Session::new(command, args, 80, 24)?);
        *shared_id = Some(session.id.clone());
        self.sessions
            .write()
            .await
            .insert(session.id.clone(), session.clone());
        Ok(session)
    }

    pub async fn create_session(
        &self,
        command: &str,
        args: &[String],
    ) -> Result<Arc<Session>, PtyError> {
        let session = Arc::new(Session::new(command, args, 80, 24)?);
        self.sessions
            .write()
            .await
            .insert(session.id.clone(), session.clone());
        Ok(session)
    }

    pub async fn remove_session(&self, id: &str) {
        self.sessions.write().await.remove(id);
        let mut shared_id = self.shared_session_id.write().await;
        if shared_id.as_deref() == Some(id) {
            *shared_id = None;
        }
    }

    pub async fn list_sessions(&self) -> Vec<String> {
        self.sessions.read().await.keys().cloned().collect()
    }
}
