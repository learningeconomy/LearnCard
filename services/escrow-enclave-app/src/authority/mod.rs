//! Measured-scope authority, owner intent, conditional persistence and audit artifacts.
#[cfg(feature = "kms")]
pub mod aws;
#[cfg(feature = "kms")]
pub mod config;
#[cfg(feature = "kms")]
pub mod credentials;
pub mod intent;
pub mod record;
pub mod state;
#[cfg(any(test, feature = "kms", feature = "fake-authority"))]
pub mod store;

#[derive(Debug, Clone, Copy, PartialEq, Eq, thiserror::Error)]
pub enum AuthorityError {
    #[error("Invalid authority configuration")]
    Configuration,
    #[error("Invalid authority request")]
    InvalidRequest,
    #[error("Authority unavailable")]
    Unavailable,
    #[error("Authority request rejected")]
    Rejected,
    #[error("Authority mutation outcome unknown")]
    UnknownOutcome,
}
