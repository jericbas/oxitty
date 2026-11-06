use oxitty_protocol::{CustomColors, KeybindingsConfig};
use serde::{Deserialize, Serialize};
use std::net::IpAddr;
use std::path::{Path, PathBuf};

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ServerConfig {
    pub port: Option<u16>,
    pub interface: Option<IpAddr>,
    pub command: Option<String>,
    pub args: Option<Vec<String>>,
    pub title: Option<String>,
    pub readonly: Option<bool>,
    pub shared: Option<bool>,
    pub credential: Option<String>,
    pub ssl_cert: Option<PathBuf>,
    pub ssl_key: Option<PathBuf>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct TerminalConfig {
    pub font_family: Option<String>,
    pub font_size: Option<u16>,
    pub cursor_blink: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ThemeConfig {
    pub preset: Option<String>,
    pub colors: Option<CustomColors>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct OxittyConfig {
    #[serde(default)]
    pub server: ServerConfig,
    #[serde(default)]
    pub terminal: TerminalConfig,
    #[serde(default)]
    pub theme: ThemeConfig,
    #[serde(default)]
    pub keybindings: KeybindingsConfig,
}

impl OxittyConfig {
    pub fn load(custom_path: Option<&Path>) -> Self {
        let candidates = match custom_path {
            Some(p) => vec![p.to_path_buf()],
            None => {
                let mut paths = vec![PathBuf::from(".oxitty.toml")];
                if let Ok(home) = std::env::var("HOME") {
                    paths.push(PathBuf::from(home).join(".config/oxitty/oxitty.toml"));
                }
                paths.push(PathBuf::from("/etc/oxitty/oxitty.toml"));
                paths
            }
        };

        for path in candidates {
            if path.exists() {
                match std::fs::read_to_string(&path) {
                    Ok(content) => match toml::from_str::<Self>(&content) {
                        Ok(config) => {
                            tracing::info!("Loaded configuration from {}", path.display());
                            return config;
                        }
                        Err(e) => {
                            tracing::warn!("Failed to parse config at {}: {}", path.display(), e);
                        }
                    },
                    Err(e) => {
                        tracing::warn!("Failed to read config at {}: {}", path.display(), e);
                    }
                }
            }
        }

        Self::default()
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_valid_toml() {
        let toml_str = r#"
[server]
port = 9000
title = "Custom Oxitty"
shared = true

[terminal]
font_size = 16

[theme]
preset = "dracula"

[keybindings]
clear = "ctrl+k"
"#;
        let config: OxittyConfig = toml::from_str(toml_str).expect("failed to parse TOML");
        assert_eq!(config.server.port, Some(9000));
        assert_eq!(config.server.title.as_deref(), Some("Custom Oxitty"));
        assert_eq!(config.server.shared, Some(true));
        assert_eq!(config.terminal.font_size, Some(16));
        assert_eq!(config.theme.preset.as_deref(), Some("dracula"));
        assert_eq!(config.keybindings.clear.as_deref(), Some("ctrl+k"));
    }
}
