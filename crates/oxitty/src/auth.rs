use crate::ws::AppState;
use axum::{
    extract::{Request, State},
    http::{header, HeaderValue, StatusCode},
    middleware::Next,
    response::Response,
};
use base64::prelude::*;

/// Middleware to enforce optional HTTP Basic Authentication.
pub async fn basic_auth_middleware(
    State(state): State<AppState>,
    request: Request,
    next: Next,
) -> Response {
    let Some(ref expected) = state.cli.credential else {
        return next.run(request).await;
    };

    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|val| val.to_str().ok());

    match auth_header {
        Some(header_val) if header_val.starts_with("Basic ") => {
            let encoded = &header_val["Basic ".len()..];
            if let Ok(decoded_bytes) = BASE64_STANDARD.decode(encoded) {
                if let Ok(credentials) = String::from_utf8(decoded_bytes) {
                    if credentials == *expected {
                        let user = credentials.split(':').next().unwrap_or("unknown");
                        tracing::info!(user = %user, "Authentication succeeded");
                        return next.run(request).await;
                    }
                }
            }
            tracing::warn!("Authentication failed: invalid username or password");
        }
        _ => {
            tracing::warn!("Unauthorized access attempt: missing or invalid Authorization header");
        }
    }

    Response::builder()
        .status(StatusCode::UNAUTHORIZED)
        .header(
            header::WWW_AUTHENTICATE,
            HeaderValue::from_static("Basic realm=\"oxitty\""),
        )
        .body(axum::body::Body::from("401 Unauthorized\n"))
        .unwrap()
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::cli::CliArgs;
    use axum::{body::Body, routing::get, Router};
    use std::sync::Arc;
    use tower::ServiceExt;

    fn test_app(credential: Option<String>) -> Router {
        let cli = CliArgs {
            port: 7681,
            interface: "127.0.0.1".parse().unwrap(),
            command: None,
            args: vec![],
            title: "Test".to_string(),
            readonly: false,
            shared: false,
            credential,
            ssl_cert: None,
            ssl_key: None,
        };
        let state = AppState { cli: Arc::new(cli) };
        Router::new()
            .route("/test", get(|| async { "OK" }))
            .layer(axum::middleware::from_fn_with_state(
                state.clone(),
                basic_auth_middleware,
            ))
            .with_state(state)
    }

    #[tokio::test]
    async fn test_auth_not_configured() {
        let app = test_app(None);
        let req = axum::http::Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();
        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);
    }

    #[tokio::test]
    async fn test_auth_missing_header() {
        let app = test_app(Some("admin:secret".to_string()));
        let req = axum::http::Request::builder()
            .uri("/test")
            .body(Body::empty())
            .unwrap();
        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
        assert_eq!(
            res.headers().get(header::WWW_AUTHENTICATE).unwrap(),
            "Basic realm=\"oxitty\""
        );
    }

    #[tokio::test]
    async fn test_auth_invalid_credentials() {
        let app = test_app(Some("admin:secret".to_string()));
        let req = axum::http::Request::builder()
            .uri("/test")
            .header(header::AUTHORIZATION, "Basic d3Jvbmc6Y3JlZHM=")
            .body(Body::empty())
            .unwrap();
        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::UNAUTHORIZED);
    }

    #[tokio::test]
    async fn test_auth_valid_credentials() {
        let app = test_app(Some("admin:secret".to_string()));
        let req = axum::http::Request::builder()
            .uri("/test")
            .header(header::AUTHORIZATION, "Basic YWRtaW46c2VjcmV0")
            .body(Body::empty())
            .unwrap();
        let res = app.oneshot(req).await.unwrap();
        assert_eq!(res.status(), StatusCode::OK);
    }
}
