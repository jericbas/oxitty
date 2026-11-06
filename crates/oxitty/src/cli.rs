use clap::Parser;
use std::net::IpAddr;

#[derive(Parser, Debug, Clone)]
#[command(
    name = "oxitty",
    about = "High-performance Web TTY Daemon built in Rust & React 19",
    version
)]
pub struct CliArgs {
    /// Port to listen on
    #[arg(short, long, default_value_t = 7681)]
    pub port: u16,

    /// Interface to bind to
    #[arg(short, long, default_value = "0.0.0.0")]
    pub interface: IpAddr,

    /// Command to spawn (defaults to user's shell)
    #[arg(short = 'c', long)]
    pub command: Option<String>,

    /// Command arguments
    #[arg(trailing_var_arg = true)]
    pub args: Vec<String>,

    /// Window title
    #[arg(short = 't', long, default_value = "Oxitty Terminal")]
    pub title: String,

    /// Run in read-only mode (clients cannot send stdin)
    #[arg(short = 'R', long, default_value_t = false)]
    pub readonly: bool,

    /// Allow multiple clients to attach to the same session
    #[arg(short = 's', long, default_value_t = false)]
    pub shared: bool,

    /// Basic HTTP authentication credentials (format: username:password)
    #[arg(short = 'u', long, env = "OXITTY_CREDENTIAL")]
    pub credential: Option<String>,

    /// Path to SSL/TLS X.509 certificate (PEM format)
    #[arg(long = "ssl-cert", env = "OXITTY_SSL_CERT")]
    pub ssl_cert: Option<std::path::PathBuf>,

    /// Path to SSL/TLS private key (PEM format)
    #[arg(long = "ssl-key", env = "OXITTY_SSL_KEY")]
    pub ssl_key: Option<std::path::PathBuf>,
}

impl CliArgs {
    pub fn resolved_command(&self) -> String {
        self.command
            .clone()
            .or_else(|| std::env::var("SHELL").ok())
            .unwrap_or_else(|| "/bin/sh".to_string())
    }
}
