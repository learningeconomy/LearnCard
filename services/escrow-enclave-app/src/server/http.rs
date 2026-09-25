//! Minimal emulator-only HTTP/1.1: no chunking, keepalive, proxying or upgrades.
use super::*;
use subtle::ConstantTimeEq;

async fn send(stream: &mut dyn Socket, status: u16, body: &[u8]) -> io::Result<()> {
    let header = format!("HTTP/1.1 {status} Response\r\nContent-Type: application/json\r\nContent-Length: {}\r\nConnection: close\r\n\r\n", body.len());
    stream.write_all(header.as_bytes()).await?;
    stream.write_all(body).await
}
async fn reject(stream: &mut dyn Socket, status: u16) -> io::Result<Request> {
    send(
        stream,
        status,
        br#"{"code":"policy","message":"Request refused."}"#,
    )
    .await?;
    // An early refusal leaves unread request bytes. Closing immediately can
    // reset TCP and discard the response on macOS/Linux. Half-close first and
    // drain only within the outer connection deadline and a fixed byte budget.
    stream.shutdown().await?;
    let mut buffer = Zeroizing::new([0u8; 4096]);
    let mut remaining = MAX_FRAME + 8192;
    while remaining > 0 {
        let cap = remaining.min(buffer.len());
        let read = stream.read(&mut buffer[..cap]).await?;
        if read == 0 {
            break;
        }
        remaining -= read;
    }
    Err(invalid())
}
pub(super) async fn read(stream: &mut dyn Socket, token: &str) -> io::Result<Request> {
    let mut header = Zeroizing::new(Vec::new());
    while !header.ends_with(b"\r\n\r\n") {
        if header.len() >= 8192 {
            return reject(stream, 431).await;
        }
        header.push(stream.read_u8().await?);
    }
    let text = std::str::from_utf8(&header).map_err(|_| invalid())?;
    let mut lines = text.split("\r\n");
    let mut start = lines.next().ok_or_else(invalid)?.split(' ');
    let verb = start.next();
    let path = start.next();
    if verb != Some("POST") || start.next() != Some("HTTP/1.1") || start.next().is_some() {
        return reject(stream, 400).await;
    }
    let method = match path {
        Some("/v1/attest") => "attest",
        Some("/v1/verify-blob") => "verifyBlob",
        Some("/v1/create-hold") => "createHold",
        Some("/v1/release") => "release",
        Some("/v1/cancel" | "/v1/cancel-hold") => "cancel",
        Some("/v1/health") => "health",
        _ => return reject(stream, 404).await,
    };
    let mut length = None;
    let mut authorization = None;
    for line in lines.filter(|line| !line.is_empty()) {
        let Some((name, value)) = line.split_once(':') else {
            return reject(stream, 400).await;
        };
        if name
            .bytes()
            .any(|b| !b.is_ascii_alphanumeric() && b != b'-')
        {
            return reject(stream, 400).await;
        }
        let value = value.trim();
        if name.eq_ignore_ascii_case("content-length") {
            if length.is_some() || value.is_empty() || !value.bytes().all(|b| b.is_ascii_digit()) {
                return reject(stream, 400).await;
            }
            let Ok(parsed) = value.parse::<usize>() else {
                return reject(stream, 413).await;
            };
            length = Some(parsed);
        } else if name.eq_ignore_ascii_case("authorization") {
            if authorization.is_some() {
                return reject(stream, 400).await;
            }
            authorization = Some(value);
        } else if name.eq_ignore_ascii_case("transfer-encoding")
            || name.eq_ignore_ascii_case("expect")
        {
            return reject(stream, 400).await;
        }
    }
    let supplied = authorization
        .and_then(|a| a.strip_prefix("Bearer "))
        .unwrap_or("");
    if token.is_empty() || !bool::from(supplied.as_bytes().ct_eq(token.as_bytes())) {
        return reject(stream, 401).await;
    }
    let Some(length) = length else {
        return reject(stream, 411).await;
    };
    if length > MAX_FRAME {
        return reject(stream, 413).await;
    }
    let mut body = Zeroizing::new(vec![0; length]);
    stream.read_exact(&mut body).await?;
    // Insert the discriminator into the original bytes, avoiding a Value map
    // which would silently collapse duplicate security-sensitive JSON keys.
    let body = std::str::from_utf8(&body).map_err(|_| invalid())?.trim();
    let Some(rest) = body.strip_prefix('{') else {
        return reject(stream, 400).await;
    };
    let separator = if rest.trim_start().starts_with('}') {
        ""
    } else {
        ","
    };
    // P4.2 HTTP callers omit operation IDs. Preserve explicit IDs and generate a
    // fresh random ID otherwise, exactly as the host adapter does. Keep original
    // JSON bytes for typed decoding so duplicate fields are still rejected.
    let id = if matches!(method, "createHold" | "release" | "cancel") {
        #[derive(serde::Deserialize)]
        struct OperationId<'a> {
            #[serde(rename = "requestId", borrow)]
            request_id: Option<&'a str>,
        }
        let value: OperationId<'_> = serde_json::from_str(body).map_err(|_| invalid())?;
        if value.request_id.is_none() {
            format!(
                ",\"requestId\":\"{}\"",
                hex::encode(rand::random::<[u8; 16]>())
            )
        } else {
            String::new()
        }
    } else {
        String::new()
    };
    let tagged = Zeroizing::new(format!("{{\"method\":\"{method}\"{id}{separator}{rest}"));
    match serde_json::from_str(&tagged) {
        Ok(request) => Ok(request),
        Err(_) => reject(stream, 400).await,
    }
}
pub(super) async fn respond(stream: &mut dyn Socket, response: Response) -> io::Result<()> {
    let status = match &response {
        Response::Error {
            code: ErrorCode::Unavailable | ErrorCode::Ledger | ErrorCode::Time,
            ..
        } => 503,
        Response::Error { .. } => 403,
        _ => 200,
    };
    let create = matches!(&response, Response::CreateHold { .. });
    let cancel = matches!(&response, Response::Cancel { cancelled: true });
    let mut value = serde_json::to_value(response).map_err(|_| invalid())?;
    value.as_object_mut().ok_or_else(invalid)?.remove("method");
    if create {
        value = value.get_mut("hold").ok_or_else(invalid)?.take();
    }
    if cancel {
        value = serde_json::json!({"ok":true});
    }
    send(
        stream,
        status,
        &serde_json::to_vec(&value).map_err(|_| invalid())?,
    )
    .await
}
