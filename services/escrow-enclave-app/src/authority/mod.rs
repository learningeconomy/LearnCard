//! Direct AWS foundations. No Policy or boot path constructs these clients yet.
pub mod aws;
pub mod config;
pub mod credentials;

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
