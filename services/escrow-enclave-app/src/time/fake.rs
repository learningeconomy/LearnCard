use super::{
    check_interval, RoughtimeTransport, TimeError, TimeEvidence, TimeFuture, TimeSource,
    TrustedInterval,
};
use std::sync::Arc;

/// Explicitly host-trusted test driver, never enabled by default.
pub struct FakeTimeSource {
    pub result: Result<TimeEvidence, TimeError>,
}
impl FakeTimeSource {
    pub fn interval(lo_ms: u64, hi_ms: u64) -> Self {
        Self {
            result: Ok(TimeEvidence {
                interval: TrustedInterval { lo_ms, hi_ms },
                sources: vec![],
            }),
        }
    }
}
impl TimeSource for FakeTimeSource {
    fn now(&self, floor_ms: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async move {
            let evidence = self.result.clone()?;
            check_interval(evidence.interval, floor_ms)?;
            Ok(evidence)
        })
    }
}

type Handler = dyn Fn(&str, Vec<u8>) -> Result<Vec<u8>, TimeError> + Send + Sync;
/// In-memory responder can sign a response to each freshly generated request.
pub struct FakeRoughtimeTransport {
    handler: Arc<Handler>,
    pub delay: std::time::Duration,
}
impl FakeRoughtimeTransport {
    pub fn new(
        handler: impl Fn(&str, Vec<u8>) -> Result<Vec<u8>, TimeError> + Send + Sync + 'static,
    ) -> Self {
        Self {
            handler: Arc::new(handler),
            delay: std::time::Duration::ZERO,
        }
    }
}
impl RoughtimeTransport for FakeRoughtimeTransport {
    fn exchange<'a>(&'a self, server_id: &'a str, request: Vec<u8>) -> TimeFuture<'a, Vec<u8>> {
        Box::pin(async move {
            tokio::time::sleep(self.delay).await;
            (self.handler)(server_id, request)
        })
    }
}
