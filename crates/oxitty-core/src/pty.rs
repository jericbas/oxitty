use portable_pty::{native_pty_system, CommandBuilder, MasterPty, PtyPair, PtySize};
use std::io::{Read, Write};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum PtyError {
    #[error("Failed to initialize PTY system: {0}")]
    System(String),
    #[error("Failed to spawn process in PTY: {0}")]
    Spawn(String),
    #[error("Failed to resize PTY: {0}")]
    Resize(String),
    #[error("PTY I/O failure: {0}")]
    Io(#[from] std::io::Error),
}

pub struct PtyWriter {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
}

impl PtyWriter {
    pub fn write_all(&mut self, data: &[u8]) -> Result<(), PtyError> {
        self.writer.write_all(data)?;
        self.writer.flush()?;
        Ok(())
    }

    pub fn resize(&self, cols: u16, rows: u16) -> Result<(), PtyError> {
        self.master
            .resize(PtySize {
                rows,
                cols,
                pixel_width: 0,
                pixel_height: 0,
            })
            .map_err(|e| PtyError::Resize(e.to_string()))
    }
}

pub fn spawn_pty(
    command: &str,
    args: &[String],
    cols: u16,
    rows: u16,
) -> Result<(PtyWriter, Box<dyn Read + Send>), PtyError> {
    let pty_system = native_pty_system();
    let size = PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    };

    let PtyPair { master, slave } = pty_system
        .openpty(size)
        .map_err(|e| PtyError::System(e.to_string()))?;

    let mut cmd = CommandBuilder::new(command);
    for arg in args {
        cmd.arg(arg);
    }

    cmd.env("TERM", "xterm-256color");
    cmd.env("COLORTERM", "truecolor");

    let _child = slave
        .spawn_command(cmd)
        .map_err(|e| PtyError::Spawn(e.to_string()))?;

    drop(slave);

    let reader = master
        .try_clone_reader()
        .map_err(|e| PtyError::System(e.to_string()))?;
    let writer = master
        .take_writer()
        .map_err(|e| PtyError::System(e.to_string()))?;

    Ok((PtyWriter { master, writer }, reader))
}
