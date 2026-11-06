use axum::{
    body::Body,
    http::{header, HeaderValue, StatusCode},
    response::{IntoResponse, Response},
};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "dist/"]
pub struct EmbeddedAssets;

pub async fn static_handler(uri: axum::http::Uri) -> impl IntoResponse {
    let path = uri.path().trim_start_matches('/');
    let target = if path.is_empty() { "index.html" } else { path };

    match EmbeddedAssets::get(target) {
        Some(content) => {
            let mime = mime_guess::from_path(target).first_or_octet_stream();
            Response::builder()
                .header(
                    header::CONTENT_TYPE,
                    HeaderValue::from_str(mime.as_ref()).unwrap(),
                )
                .body(Body::from(content.data))
                .unwrap()
        }
        None => {
            // Fallback to index.html for client-side routing
            if let Some(index) = EmbeddedAssets::get("index.html") {
                Response::builder()
                    .header(header::CONTENT_TYPE, HeaderValue::from_static("text/html"))
                    .body(Body::from(index.data))
                    .unwrap()
            } else {
                (
                    StatusCode::NOT_FOUND,
                    "Embedded frontend assets not compiled. Please run 'bun run build:frontend'.",
                )
                    .into_response()
            }
        }
    }
}
