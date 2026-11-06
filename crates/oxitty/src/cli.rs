use crate::config::OxittyConfig;
use clap::Parser;
use std::net::IpAddr;
use std::path::PathBuf;

#[derive(Parser, Debug, Clone, Default)]
#[command(
    name = "oxitty",
    about = "High-performance Web TTY Daemon built in Rust & React 19",
    version
)]
pub struct CliArgs {
    /// Path to TOML configuration file
    #[arg(long)]
    pub config: Option<PathBuf>,

    /// Port to listen on
    #[arg(short, long)]
    pub port: Option<u16>,

    /// Interface to bind to
    #[arg(short, long)]
    pub interface: Option<IpAddr>,

    /// Command to spawn (defaults to user's shell)
    #[arg(short = 'c', long)]
    pub command: Option<String>,

    /// Command arguments
    #[arg(trailing_var_arg = true)]
    pub args: Vec<String>,

    /// Window title
    #[arg(short = 't', long)]
    pub title: Option<String>,

    /// Run in read-only mode (clients cannot send stdin)
    #[arg(short = 'R', long)]
    pub readonly: bool,

    /// Allow multiple clients to attach to the same session
    #[arg(short = 's', long)]
    pub shared: bool,

    /// Basic HTTP authentication credentials (format: username:password)
    #[arg(short = 'u', long, env = "OXITTY_CREDENTIAL")]
    pub credential: Option<String>,

    /// Path to SSL/TLS X.509 certificate (PEM format)
    #[arg(long = "ssl-cert", env = "OXITTY_SSL_CERT")]
    pub ssl_cert: Option<PathBuf>,

    /// Path to SSL/TLS private key (PEM format)
    #[arg(long = "ssl-key", env = "OXITTY_SSL_KEY")]
    pub ssl_key: Option<PathBuf>,
}

impl CliArgs {
    pub fn merge_with_config(&mut self, config: &OxittyConfig) {
        if self.port.is_none() {
            self.port = config.server.port;
        }
        if self.interface.is_none() {
            self.interface = config.server.interface;
        }
        if self.command.is_none() {
            self.command = config.server.command.clone();
        }
        if self.args.is_empty() {
            if let Some(args) = &config.server.args {
                self.args = args.clone();
            }
        }
        if self.title.is_none() {
            self.title = config.server.title.clone();
        }
        if !self.readonly {
            self.readonly = config.server.readonly.unwrap_or(false);
        }
        if !self.shared {
            self.shared = config.server.shared.unwrap_or(false);
        }
        if self.credential.is_none() {
            self.credential = config.server.credential.clone();
        }
        if self.ssl_cert.is_none() {
            self.ssl_cert = config.server.ssl_cert.clone();
        }
        if self.ssl_key.is_none() {
            self.ssl_key = config.server.ssl_key.clone();
        }
    }

    pub fn port(&self) -> u16 {
        self.port.unwrap_or(7681)
    }

    pub fn interface(&self) -> IpAddr {
        self.interface
            .unwrap_or_else(|| "0.0.0.0".parse().expect("valid default IP"))
    }

    pub fn title(&self) -> String {
        self.title
            .clone()
            .unwrap_or_else(|| "Oxitty Terminal".to_string())
    }

    pub fn resolved_command(&self) -> String {
        self.command
            .clone()
            .or_else(|| std::env::var("SHELL").ok())
            .unwrap_or_else(|| "/bin/sh".to_string())
    }
}
