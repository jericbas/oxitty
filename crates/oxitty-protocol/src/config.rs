use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Custom 16-color ANSI and truecolor scheme.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default, TS)]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
pub struct CustomColors {
    #[ts(optional)]
    pub background: Option<String>,
    #[ts(optional)]
    pub foreground: Option<String>,
    #[ts(optional)]
    pub cursor: Option<String>,
    #[ts(optional)]
    pub black: Option<String>,
    #[ts(optional)]
    pub red: Option<String>,
    #[ts(optional)]
    pub green: Option<String>,
    #[ts(optional)]
    pub yellow: Option<String>,
    #[ts(optional)]
    pub blue: Option<String>,
    #[ts(optional)]
    pub magenta: Option<String>,
    #[ts(optional)]
    pub cyan: Option<String>,
    #[ts(optional)]
    pub white: Option<String>,
    #[ts(optional)]
    pub bright_black: Option<String>,
    #[ts(optional)]
    pub bright_red: Option<String>,
    #[ts(optional)]
    pub bright_green: Option<String>,
    #[ts(optional)]
    pub bright_yellow: Option<String>,
    #[ts(optional)]
    pub bright_blue: Option<String>,
    #[ts(optional)]
    pub bright_magenta: Option<String>,
    #[ts(optional)]
    pub bright_cyan: Option<String>,
    #[ts(optional)]
    pub bright_white: Option<String>,
}

/// Configurable keybindings for common terminal actions.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq, Default, TS)]
#[ts(export, export_to = "../../../frontend/src/types/generated/")]
pub struct KeybindingsConfig {
    #[ts(optional)]
    pub copy: Option<String>,
    #[ts(optional)]
    pub paste: Option<String>,
    #[ts(optional)]
    pub clear: Option<String>,
    #[ts(optional)]
    pub font_increase: Option<String>,
    #[ts(optional)]
    pub font_decrease: Option<String>,
    #[ts(optional)]
    pub font_reset: Option<String>,
}
