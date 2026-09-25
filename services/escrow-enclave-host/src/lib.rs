pub mod api;
pub mod connections;
pub mod framing;
pub mod relay;
pub mod services;
pub mod storage;
pub mod supervisor;
pub mod wire;

/// Only static classifications may enter logs. Never attach SDK/IO errors or DTOs.
#[derive(Clone, Copy)]
pub enum Event {
    AuditUnavailable,
    SupervisorUnavailable,
    StartupFailed,
}
impl Event {
    pub fn message(self) -> &'static str {
        match self {
            Self::AuditUnavailable => "audit_unavailable",
            Self::SupervisorUnavailable => "supervisor_unavailable",
            Self::StartupFailed => "startup_failed",
        }
    }
    pub fn log(self) {
        eprintln!("{}", self.message());
    }
}
