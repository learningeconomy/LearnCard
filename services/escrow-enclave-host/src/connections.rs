//! Admission before TLS/HTTP parsing, with a hard connection lifetime.
use axum_server::accept::Accept;
use std::{
    future::Future,
    future::{Ready, ready},
    io,
    pin::Pin,
    sync::Arc,
    task::{Context, Poll},
    time::Duration,
};
use tokio::{
    io::{AsyncRead, AsyncWrite, ReadBuf},
    net::TcpStream,
    sync::{OwnedSemaphorePermit, Semaphore},
    time::Sleep,
};

#[derive(Clone)]
pub struct BoundedAccept {
    permits: Arc<Semaphore>,
}
impl BoundedAccept {
    pub fn new(limit: usize) -> Self {
        Self {
            permits: Arc::new(Semaphore::new(limit)),
        }
    }
}
pub struct Connection {
    stream: TcpStream,
    _permit: OwnedSemaphorePermit,
    deadline: Pin<Box<Sleep>>,
}
impl<S> Accept<TcpStream, S> for BoundedAccept {
    type Stream = Connection;
    type Service = S;
    type Future = Ready<io::Result<(Connection, S)>>;
    fn accept(&self, stream: TcpStream, service: S) -> Self::Future {
        ready(
            self.permits
                .clone()
                .try_acquire_owned()
                .map(|permit| {
                    (
                        Connection {
                            stream,
                            _permit: permit,
                            deadline: Box::pin(tokio::time::sleep(Duration::from_secs(60))),
                        },
                        service,
                    )
                })
                .map_err(|_| crate::framing::invalid()),
        )
    }
}
impl Connection {
    fn expired(&mut self, cx: &mut Context<'_>) -> bool {
        self.deadline.as_mut().poll(cx).is_ready()
    }
}
impl AsyncRead for Connection {
    fn poll_read(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &mut ReadBuf<'_>,
    ) -> Poll<io::Result<()>> {
        if self.expired(cx) {
            return Poll::Ready(Err(crate::framing::invalid()));
        }
        Pin::new(&mut self.stream).poll_read(cx, buf)
    }
}
impl AsyncWrite for Connection {
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<io::Result<usize>> {
        if self.expired(cx) {
            return Poll::Ready(Err(crate::framing::invalid()));
        }
        Pin::new(&mut self.stream).poll_write(cx, buf)
    }
    fn poll_flush(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        if self.expired(cx) {
            return Poll::Ready(Err(crate::framing::invalid()));
        }
        Pin::new(&mut self.stream).poll_flush(cx)
    }
    fn poll_shutdown(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<io::Result<()>> {
        Pin::new(&mut self.stream).poll_shutdown(cx)
    }
}
