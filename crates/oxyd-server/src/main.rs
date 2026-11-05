mod assets;
mod cli;
mod ws;

use assets::static_handler;
use axum::{routing::get, Router};
use clap::Parser;
use cli::CliArgs;
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use ws::{ws_handler, AppState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "oxyd=info,tower_http=info".into()),
        )
        .init();

    let cli = CliArgs::parse();
    let addr = SocketAddr::new(cli.interface, cli.port);

    tracing::info!("Starting Oxyd on http://{}", addr);
    tracing::info!("Spawning shell: {}", cli.resolved_command());

    let state = AppState {
        cli: Arc::new(cli),
    };

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .fallback(static_handler)
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
