//! Explicit, low-volume interoperability probe; never contacted by normal tests.
use super::*;
use base64::{engine::general_purpose::STANDARD, Engine};
use std::net::{ToSocketAddrs, UdpSocket};

// Real UDP captures, 2026-09-30. Verify offline against operator-published roots,
// not generated test keys; no wall-clock freshness assertion for historical vectors.
#[test]
fn captured_legacy_responses() {
    for (id, nonce, response, midpoint, radius) in [
        ("int08h", "wtpiWsCcGXYihlnGEDTiyDxPb4W82euzA1ch94L02EAKOHj0KXVzLfgWMZ3rwKUjYtilqQHydISX4N0Mqcxuwg==", "BgAAAEAAAACAAAAAwAAAACQBAAC8AQAAU0lHAE5PTkNQQVRIU1JFUENFUlRJTkRYlqFsy8x4Hv/KPSQqaichgESH+3goChkhKSvENtcOzEzVyjPhyRaucajqFxpG2sTWEzO+LWSyHxEMkEa8Qw3rAMLaYlrAnBl2IoZZxhA04sg8T2+FvNnrswNXIfeC9NhACjh49Cl1cy34FjGd68ClI2LYpakB8nSEl+DdDKnMbsLmjacxEBjUxe7UREP8PCOaLysLoer7jP5ugSZo6zg+dQG/lkPTzx5u5ixq66Q+FOjPfaGEL8hW3FIPJ1QLorJNAwAAAAQAAAAMAAAAUkFESU1JRFBST09UQEtMADwXAam3XAYAebNkW1nkUmVrfrcIprAWs4zLgro9AMtggCEgs/iup6/ip2Q7mc/EdahrkUMIioqWozDy0AZHmXCXRaQQSh7RfAIAAABAAAAAU0lHAERFTEVX4SHg8VDc4QGWhVdScxwhh/R192rJms+Y4t3hJ6mhchcTc4mGdPaKNJw2Cz0HXJCvWNi2LS8JkGGKkXAIXc8PAwAAACAAAAAoAAAAUFVCS01JTlRNQVhUcOGTEprlnWGiq2r1maJF1lTn7JVCMkrz6jvfb8/WI7kAAAAAAAAAAP//////////AAAAAA==", 1_790_793_744_455, 5000),
        ("txryan", "pEJq8TRo5Z60QBTKYEtMy8bnim2f/0zURdDy5vjZ0l8+hfkrtF2BlOYA7/gHzhh8nRSopPLBR7FXAAshaiA5gA==", "BQAAAEAAAABAAAAApAAAADwBAABTSUcAUEFUSFNSRVBDRVJUSU5EWEo2j4vpUI5hYmVPCAvRBSzP6Un64NcZMzb0C70/16B0EOCQgsQMiffJuNRwwouzZT0qh6B2m0SFUxx8C4YICQEDAAAABAAAAAwAAABSQURJTUlEUFJPT1TAxi0AYyMIqbdcBgAWKNK/fVDV7iIRaUqkSDEb6cwdpbrHcNbuv579KUKQZN4jEmSJ8913iCCpJ5ypsIsqw16adrIeY+aJC6gfEtVpAgAAAEAAAABTSUcAREVMRcqqt6/LbDAUocQN/WixMcJlS5AQbv21YXvR8jJf6z6R8N1rh7uDGBaGGWX5vJ4SqBJJcx0NSDA7NH1n6rt29g0DAAAAIAAAACgAAABQVUJLTUlOVE1BWFTotYS26VFcuCsV21nadUuU/dacX08fTIIEwFQDIBWOzyFJWzauXAYAIakyVMJcBgAAAAAA", 1_790_793_744_917, 3000),
    ] {
        let server = servers::published().unwrap().into_iter().find(|s| s.id == id).unwrap();
        let nonce = STANDARD.decode(nonce).unwrap();
        let response = STANDARD.decode(response).unwrap();
        let (evidence, interval) = protocol::verify(&server, &nonce, &response, 10_000).unwrap();
        assert_eq!(evidence.midpoint_ms, midpoint);
        assert_eq!(evidence.radius_ms, radius);
        assert_eq!(interval, TrustedInterval { lo_ms: midpoint - radius, hi_ms: midpoint + radius + 1 });
        let mut wrong_nonce = nonce;
        wrong_nonce[0] ^= 1;
        assert_eq!(protocol::verify(&server, &wrong_nonce, &response, 10_000), Err(TimeError::Nonce));
    }
}

#[test]
#[ignore = "contacts public UDP time authorities; run manually with --ignored --nocapture"]
fn published_servers_verify_live() {
    let endpoints = [
        "roughtime.cloudflare.com:2003",
        "roughtime.int08h.com:2002",
        "time.txryan.com:2002",
    ];
    let mut failures = Vec::new();
    for (server, endpoint) in servers::published().unwrap().iter().zip(endpoints) {
        let result = (|| -> Result<(), Box<dyn std::error::Error>> {
            let address = endpoint
                .to_socket_addrs()?
                .find(|a| a.is_ipv4())
                .ok_or("no IPv4 address")?;
            let socket = UdpSocket::bind("0.0.0.0:0")?;
            socket.set_read_timeout(Some(Duration::from_secs(3)))?;
            socket.connect(address)?;
            let mut nonce = vec![0; server.protocol.nonce_size()];
            OsRng.try_fill_bytes(&mut nonce)?;
            socket.send(&protocol::request(server.protocol, &nonce)?)?;
            let mut packet = [0; 1025];
            let n = socket.recv(&mut packet)?;
            let evidence = protocol::verify(server, &nonce, &packet[..n], 10_000)?;
            println!("{endpoint}: VERIFIED {evidence:?}");
            println!(
                "nonce={} response={}",
                STANDARD.encode(nonce),
                STANDARD.encode(&packet[..n])
            );
            Ok(())
        })();
        if let Err(error) = result {
            eprintln!("{endpoint}: NOT VERIFIED: {error}");
            failures.push(endpoint);
        }
    }
    assert!(failures.is_empty(), "unverified endpoints: {failures:?}");
}
