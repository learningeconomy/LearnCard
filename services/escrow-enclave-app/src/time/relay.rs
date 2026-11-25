//! One bounded JSON request and one raw datagram response per vsock connection.
use super::TimeError;
#[cfg(target_os = "linux")]
use super::{RoughtimeTransport, TimeFuture};
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
#[cfg(target_os = "linux")]
use tokio_vsock::{VsockAddr, VsockStream};

#[cfg(target_os = "linux")]
pub struct VsockRoughtimeTransport;

/// The production relay exchange, independent of the socket's address family.
pub async fn exchange_stream<S: AsyncRead + AsyncWrite + Unpin>(
    stream: &mut S,
    server_id: &str,
    request: Vec<u8>,
) -> Result<Vec<u8>, TimeError> {
    if server_id.len() > 128 || request.len() > 1024 {
        return Err(TimeError::Encoding);
    }
    let body = serde_json::to_vec(&serde_json::json!({"server_id":server_id,"payload":request}))
        .map_err(|_| TimeError::Encoding)?;
    if body.len() > 8192 {
        return Err(TimeError::Encoding);
    }
    let exchange = async {
        stream.write_u32(body.len() as u32).await?;
        stream.write_all(&body).await?;
        let len = stream.read_u32().await? as usize;
        if len == 0 || len > 1024 {
            return Err(std::io::Error::from(std::io::ErrorKind::InvalidData));
        }
        let mut response = vec![0; len];
        stream.read_exact(&mut response).await?;
        Ok::<_, std::io::Error>(response)
    };
    tokio::time::timeout(std::time::Duration::from_secs(2), exchange)
        .await
        .map_err(|_| TimeError::Unavailable)?
        .map_err(|_| TimeError::Unavailable)
}

#[cfg(target_os = "linux")]
impl RoughtimeTransport for VsockRoughtimeTransport {
    fn exchange<'a>(&'a self, server_id: &'a str, request: Vec<u8>) -> TimeFuture<'a, Vec<u8>> {
        Box::pin(async move {
            if server_id.len() > 128 || request.len() > 1024 {
                return Err(TimeError::Encoding);
            }
            let exchange = async {
                let mut stream = VsockStream::connect(VsockAddr::new(3, 5001))
                    .await
                    .map_err(|_| TimeError::Unavailable)?;
                exchange_stream(&mut stream, server_id, request).await
            };
            tokio::time::timeout(std::time::Duration::from_secs(2), exchange)
                .await
                .map_err(|_| TimeError::Unavailable)?
        })
    }
}
