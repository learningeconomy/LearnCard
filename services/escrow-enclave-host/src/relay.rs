use crate::framing::{self, invalid};
use serde::Deserialize;
use std::{collections::HashMap, io, sync::Arc, time::Duration};
use tokio::{
    io::{AsyncRead, AsyncWrite},
    net::UdpSocket,
};

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
pub struct RelayRequest {
    pub server_id: String,
    pub payload: Vec<u8>,
}
pub struct Relay {
    servers: HashMap<String, String>,
}
impl Default for Relay {
    fn default() -> Self {
        Self {
            servers: [
                ("cloudflare".into(), "roughtime.cloudflare.com:2003".into()),
                ("google".into(), "roughtime.sandbox.google.com:2002".into()),
            ]
            .into(),
        }
    }
}
impl Relay {
    /// Operator-owned configuration, not request-provided destinations.
    pub fn configured(servers: HashMap<String, String>) -> io::Result<Self> {
        if servers.len() < 2
            || servers.len() > 16
            || servers
                .iter()
                .any(|(id, endpoint)| id.is_empty() || id.len() > 128 || endpoint.is_empty())
        {
            return Err(invalid());
        }
        Ok(Self { servers })
    }
    pub fn destination(&self, request: &RelayRequest) -> io::Result<&str> {
        if request.server_id.len() > 128
            || request.payload.is_empty()
            || request.payload.len() > 1024
        {
            return Err(invalid());
        }
        self.servers
            .get(&request.server_id)
            .map(String::as_str)
            .ok_or_else(invalid)
    }
    pub async fn serve<S: AsyncRead + AsyncWrite + Unpin>(&self, stream: &mut S) -> io::Result<()> {
        tokio::time::timeout(Duration::from_secs(2), async {
            let bytes = framing::read(stream, 8192).await?;
            let request: RelayRequest = serde_json::from_slice(&bytes).map_err(|_| invalid())?;
            let destination = self.destination(&request)?;
            let address = tokio::net::lookup_host(destination)
                .await?
                .next()
                .ok_or_else(invalid)?;
            let udp = UdpSocket::bind(if address.is_ipv4() {
                "0.0.0.0:0"
            } else {
                "[::]:0"
            })
            .await?;
            udp.connect(address).await?;
            udp.send(&request.payload).await?;
            let mut response = [0; 1025];
            let n = udp.recv(&mut response).await?;
            if n == 0 || n > 1024 {
                return Err(invalid());
            }
            framing::write(stream, &response[..n], 1024).await
        })
        .await
        .map_err(|_| invalid())?
    }
}
pub async fn listen(relay: Arc<Relay>, cid: u32) -> io::Result<()> {
    #[cfg(target_os = "linux")]
    {
        let listener = tokio_vsock::VsockListener::bind(tokio_vsock::VsockAddr::new(3, 5001))?;
        let permits = Arc::new(tokio::sync::Semaphore::new(32));
        let mut tasks = tokio::task::JoinSet::new();
        loop {
            tokio::select! {
                connection = listener.accept() => {
                    let (mut stream, peer) = connection?;
                    if peer.cid() != cid { continue; }
                    let Ok(permit) = permits.clone().try_acquire_owned() else { continue; };
                    let relay = relay.clone();
                    tasks.spawn(async move { let _permit = permit; let _ = relay.serve(&mut stream).await; });
                }
                _ = tasks.join_next(), if !tasks.is_empty() => {}
            }
        }
    }
    #[cfg(not(target_os = "linux"))]
    {
        let _ = (relay, cid);
        Err(invalid())
    }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn allowlist_and_caps() {
        let relay = Relay::default();
        let mut r = RelayRequest {
            server_id: "cloudflare".into(),
            payload: vec![1; 1024],
        };
        assert_eq!(
            relay.destination(&r).unwrap(),
            "roughtime.cloudflare.com:2003"
        );
        r.payload.push(0);
        assert!(relay.destination(&r).is_err());
        r.payload = vec![1];
        r.server_id = "127.0.0.1:80".into();
        assert!(relay.destination(&r).is_err());
    }

    #[tokio::test]
    async fn udp_bytes_are_unchanged_and_oversize_is_closed() {
        for size in [1024, 1025] {
            let udp = UdpSocket::bind("127.0.0.1:0").await.unwrap();
            let endpoint = udp.local_addr().unwrap().to_string();
            let relay =
                Relay::configured([("a".into(), endpoint.clone()), ("b".into(), endpoint)].into())
                    .unwrap();
            let server = tokio::spawn(async move {
                let mut bytes = [0; 1024];
                let (n, peer) = udp.recv_from(&mut bytes).await.unwrap();
                assert_eq!(&bytes[..n], &[1, 2, 3]);
                udp.send_to(&vec![7; size], peer).await.unwrap();
            });
            let (mut parent, mut enclave) = tokio::io::duplex(16384);
            let task = tokio::spawn(async move { relay.serve(&mut parent).await });
            framing::write(
                &mut enclave,
                br#"{"server_id":"a","payload":[1,2,3]}"#,
                8192,
            )
            .await
            .unwrap();
            let response = framing::read(&mut enclave, 1024).await;
            if size == 1024 {
                assert_eq!(response.unwrap(), vec![7; 1024]);
                assert!(task.await.unwrap().is_ok());
            } else {
                assert!(response.is_err());
                assert!(task.await.unwrap().is_err());
            }
            server.await.unwrap();
        }
    }
}
