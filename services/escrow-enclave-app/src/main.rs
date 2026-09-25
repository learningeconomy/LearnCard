use escrow_enclave::Transport;
use std::{error::Error, io};

fn parse_args(args: impl IntoIterator<Item = String>) -> io::Result<Transport> {
    let mut args = args.into_iter();
    match (args.next().as_deref(), args.next(), args.next()) {
        (None, None, None) => Ok(Transport::Vsock { port: 5000 }),
        (Some("--emulate"), Some(address), None) => address
            .parse()
            .map(|address| Transport::Emulate { address })
            .map_err(|error| io::Error::new(io::ErrorKind::InvalidInput, error)),
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
                address: "127.0.0.1:5000".parse().unwrap()
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
