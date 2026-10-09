use escrow_enclave::Transport;
use std::{error::Error, io};

fn parse_args(args: impl IntoIterator<Item = String>) -> io::Result<Transport> {
    let mut args = args.into_iter();
    let invalid = || {
        io::Error::new(
            io::ErrorKind::InvalidInput,
            "usage: escrow-enclave [--emulate <ip:port> [--emulate-http <ip:port>]]",
        )
    };
    match (args.next().as_deref(), args.next()) {
        (None, None) => Ok(Transport::Vsock { port: 5000 }),
        (Some("--emulate"), Some(address)) => {
            let address = address.parse().map_err(|_| invalid())?;
            let http_address = match args.next().as_deref() {
                None => None,
                Some("--emulate-http") => Some(
                    args.next()
                        .ok_or_else(invalid)?
                        .parse()
                        .map_err(|_| invalid())?,
                ),
                _ => return Err(invalid()),
            };
            if args.next().is_some() {
                return Err(invalid());
            }
            Ok(Transport::Emulate {
                address,
                http_address,
            })
        }
        _ => Err(io::Error::new(
            io::ErrorKind::InvalidInput,
            "usage: escrow-enclave [--emulate <ip:port>]",
        )),
    }
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn Error + Send + Sync>> {
    tracing_subscriber::fmt().with_target(false).try_init()?;
    escrow_enclave::run(parse_args(std::env::args().skip(1))?).await?;
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn defaults_to_vsock() {
        assert_eq!(parse_args([]).unwrap(), Transport::Vsock { port: 5000 });
    }

    #[test]
    fn accepts_tcp_emulation() {
        assert_eq!(
            parse_args(["--emulate".into(), "127.0.0.1:5000".into()]).unwrap(),
            Transport::Emulate {
                address: "127.0.0.1:5000".parse().unwrap(),
                http_address: None,
            }
        );
    }

    #[test]
    fn rejects_invalid_arguments() {
        for args in [
            vec!["--emulate"],
            vec!["--emulate", "not-an-address"],
            vec!["--emulate", "127.0.0.1:5000", "extra"],
            vec!["--unknown"],
        ] {
            assert!(parse_args(args.into_iter().map(String::from)).is_err());
        }
    }
}
