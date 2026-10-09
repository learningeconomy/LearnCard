use std::io;
use tokio::io::{AsyncRead, AsyncReadExt, AsyncWrite, AsyncWriteExt};
pub const MAX_FRAME: usize = 256 * 1024;
pub fn invalid() -> io::Error {
    io::Error::other("unavailable")
}
pub async fn read<R: AsyncRead + Unpin>(stream: &mut R, cap: usize) -> io::Result<Vec<u8>> {
    let len = stream.read_u32().await? as usize;
    if len == 0 || len > cap {
        return Err(invalid());
    }
    let mut bytes = vec![0; len];
    stream.read_exact(&mut bytes).await?;
    Ok(bytes)
}
pub async fn write<W: AsyncWrite + Unpin>(
    stream: &mut W,
    bytes: &[u8],
    cap: usize,
) -> io::Result<()> {
    if bytes.is_empty() || bytes.len() > cap || bytes.len() > u32::MAX as usize {
        return Err(invalid());
    }
    stream.write_u32(bytes.len() as u32).await?;
    stream.write_all(bytes).await?;
    stream.flush().await
}
#[async_trait::async_trait]
pub trait Enclave: Send + Sync {
    async fn exchange(&self, request: Vec<u8>) -> io::Result<Vec<u8>>;
}
pub struct VsockEnclave {
    pub cid: u32,
}
#[async_trait::async_trait]
impl Enclave for VsockEnclave {
    async fn exchange(&self, request: Vec<u8>) -> io::Result<Vec<u8>> {
        #[cfg(target_os = "linux")]
        {
            let mut stream =
                tokio_vsock::VsockStream::connect(tokio_vsock::VsockAddr::new(self.cid, 5000))
                    .await?;
            write(&mut stream, &request, MAX_FRAME).await?;
            read(&mut stream, MAX_FRAME).await
        }
        #[cfg(not(target_os = "linux"))]
        {
            let _ = request;
            Err(invalid())
        }
    }
}
