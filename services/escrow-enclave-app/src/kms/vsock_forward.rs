//! Opaque TLS relay: loopback TCP :8000 -> parent CID 3 :8000 -> regional KMS :443.
//! No TLS termination, HTTP parsing, credentials or plaintext logging here.
use std::{io, time::Duration};
use tokio::{net::TcpListener, task::JoinSet, time::timeout};
use tokio_vsock::{VsockAddr, VsockStream};

/// Run under the server's supervised task lifetime; dropping the future aborts
/// active connections. Fixed destination, max 16 connections, 60s total lifetime.
pub async fn run() -> io::Result<()> {
    let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, 8000)).await?;
    let mut connections = JoinSet::new();
    loop {
        tokio::select! {
            result = connections.join_next(), if !connections.is_empty() => { let _ = result; }
            accepted = listener.accept(), if connections.len() < 16 => {
                let (mut tcp, _) = accepted?;
                connections.spawn(async move {
                    let _ = timeout(Duration::from_secs(60), async {
                        let mut vsock = VsockStream::connect(VsockAddr::new(3, 8000)).await?;
                        tokio::io::copy_bidirectional(&mut tcp, &mut vsock).await
                    }).await;
                });
            }
        }
    }
}
