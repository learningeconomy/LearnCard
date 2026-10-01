//! Opaque TLS relay: loopback TCP :8000 -> parent CID 3 :8000 -> regional KMS :443.
//! No TLS termination, HTTP parsing, credentials or plaintext logging here.
use std::{io, time::Duration};
use tokio::{net::TcpListener, task::JoinSet, time::timeout};
use tokio_vsock::{VsockAddr, VsockStream};

/// Run under the server's supervised task lifetime; dropping the future aborts
/// active connections. Fixed destination, max 16 connections, 60s total lifetime.
pub async fn run() -> io::Result<()> {
    bring_up_loopback()?;
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

/// Nitro enclaves boot with `lo` down and the measured image has no `ip`
/// binary, so the 127.0.0.1 listener above needs loopback raised in-process.
/// Setting IFF_UP on loopback also makes the kernel assign 127.0.0.1/8.
fn bring_up_loopback() -> io::Result<()> {
    // SAFETY: plain socket + SIOCGIFFLAGS/SIOCSIFFLAGS on a zeroed, NUL-terminated
    // `ifreq` for "lo"; the fd is closed on every path.
    unsafe {
        let fd = libc::socket(libc::AF_INET, libc::SOCK_DGRAM | libc::SOCK_CLOEXEC, 0);
        if fd < 0 {
            return Err(io::Error::last_os_error());
        }
        let mut ifr: libc::ifreq = std::mem::zeroed();
        for (dst, src) in ifr.ifr_name.iter_mut().zip(b"lo") {
            *dst = *src as libc::c_char;
        }
        let result = if libc::ioctl(fd, libc::SIOCGIFFLAGS, &mut ifr) < 0 {
            Err(io::Error::last_os_error())
        } else {
            ifr.ifr_ifru.ifru_flags |= (libc::IFF_UP | libc::IFF_RUNNING) as libc::c_short;
            if libc::ioctl(fd, libc::SIOCSIFFLAGS, &ifr) < 0 {
                Err(io::Error::last_os_error())
            } else {
                Ok(())
            }
        };
        libc::close(fd);
        result
    }
}
