mod assets;
mod auth;
mod cli;
mod config;
mod ws;

use assets::static_handler;
use auth::basic_auth_middleware;
use axum::{middleware, routing::get, Router};
use clap::Parser;
use cli::CliArgs;
use config::OxittyConfig;
use oxitty_core::SessionManager;
use std::{net::SocketAddr, sync::Arc};
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use ws::{ws_handler, AppState};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "oxitty=info,tower_http=info".into()),
        )
        .init();

    let mut cli = CliArgs::parse();
    let config = OxittyConfig::load(cli.config.as_deref());
    cli.merge_with_config(&config);

    let addr = SocketAddr::new(cli.interface(), cli.port());
    let sessions = SessionManager::new();

    let state = AppState {
        cli: Arc::new(cli),
        config: Arc::new(config),
        sessions,
    };

    let app = Router::new()
        .route("/ws", get(ws_handler))
        .fallback(static_handler)
        .layer(middleware::from_fn_with_state(
            state.clone(),
            basic_auth_middleware,
        ))
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state.clone());

    if let (Some(cert), Some(key)) = (&state.cli.ssl_cert, &state.cli.ssl_key) {
        tracing::info!("Starting Oxitty with TLS on https://{}", addr);
        tracing::info!("Spawning shell: {}", state.cli.resolved_command());
        let config = axum_server::tls_rustls::RustlsConfig::from_pem_file(cert, key).await?;
        axum_server::bind_rustls(addr, config)
            .serve(app.into_make_service())
            .await?;
    } else {
        tracing::info!("Starting Oxitty on http://{}", addr);
        tracing::info!("Spawning shell: {}", state.cli.resolved_command());
        let listener = tokio::net::TcpListener::bind(addr).await?;
        axum::serve(listener, app).await?;
    }

    Ok(())
}
