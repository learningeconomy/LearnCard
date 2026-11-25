//! Opaque TLS relay: loopback TCP :8000 -> parent CID 3 :8000 -> regional KMS :443.
//! No TLS termination, HTTP parsing, credentials or plaintext logging here.
use std::{io, time::Duration};
use tokio::{net::TcpListener, task::JoinSet, time::timeout};
use tokio_vsock::{VsockAddr, VsockStream};

/// Run under the server's supervised task lifetime; dropping the future aborts
/// active connections. Fixed destination, max 16 connections, 60s total lifetime.
pub async fn run() -> io::Result<()> {
    bring_up_loopback()?;
    run_port(8000).await
}

/// Configured authority relay setup, supervised by production boot. The
/// parent must separately enable fixed DynamoDB/SES :443 destinations on these
/// ports. All TLS, hostname checks and signing remain inside the enclave.
pub async fn run_data_plane(
    authority: &crate::authority::config::AuthorityConfig,
    email: Option<&crate::authority::config::EmailConfig>,
) -> io::Result<()> {
    use std::io::Write;
    let mut hosts = format!("\n127.0.0.1 dynamodb.{}.amazonaws.com\n", authority.region);
    if let Some(email) = email {
        hosts.push_str(&format!("127.0.0.1 email.{}.amazonaws.com\n", email.region));
    }
    std::fs::OpenOptions::new()
        .append(true)
        .open("/etc/hosts")?
        .write_all(hosts.as_bytes())?;
    bring_up_loopback()?;
    if email.is_some() {
        tokio::select! { result = run_port(8001) => result, result = run_port(8002) => result }
    } else {
        run_port(8001).await
    }
}

async fn run_port(port: u16) -> io::Result<()> {
    let listener = TcpListener::bind((std::net::Ipv4Addr::LOCALHOST, port)).await?;
    let mut connections = JoinSet::new();
    loop {
        tokio::select! {
            result = connections.join_next(), if !connections.is_empty() => { let _ = result; }
            accepted = listener.accept(), if connections.len() < 16 => {
                let (mut tcp, _) = accepted?;
                connections.spawn(async move {
                    let _ = timeout(Duration::from_secs(60), async {
                        let mut vsock = VsockStream::connect(VsockAddr::new(3, u32::from(port))).await?;
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
        let result = if libc::ioctl(fd, libc::SIOCGIFFLAGS as libc::Ioctl, &mut ifr) < 0 {
            Err(io::Error::last_os_error())
        } else {
            ifr.ifr_ifru.ifru_flags |= (libc::IFF_UP | libc::IFF_RUNNING) as libc::c_short;
            if libc::ioctl(fd, libc::SIOCSIFFLAGS as libc::Ioctl, &ifr) < 0 {
                Err(io::Error::last_os_error())
            } else {
                Ok(())
            }
        };
        libc::close(fd);
        result
    }
}
