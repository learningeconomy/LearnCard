use aws_lambda_events::event::dynamodb::Event;
use escrow_ledger_monitor::{Error, Metric, Monitor, aws::Aws};
use lambda_runtime::{LambdaEvent, service_fn};
use p256::ecdsa::VerifyingKey;
use serde_dynamo::AttributeValue;
use serde_json::Value;

fn env(name: &str) -> Result<String, Error> {
    std::env::var(name)
        .ok()
        .filter(|v| !v.is_empty())
        .ok_or(Error::Configuration)
}

async fn handle(monitor: &Monitor<Aws>, event: Value) -> Result<(), Error> {
    if event.get("source").and_then(Value::as_str) == Some("aws.events")
        && event.get("detail-type").and_then(Value::as_str) == Some("Scheduled Event")
    {
        return monitor.sweep().await;
    }
    if event
        .get("Records")
        .and_then(Value::as_array)
        .is_none_or(|records| records.is_empty())
    {
        return Err(Error::Integrity);
    }
    let event: Event = serde_json::from_value(event).map_err(|_| Error::Integrity)?;
    for record in event.records {
        if matches!(record.event_name.as_str(), "MODIFY" | "REMOVE") {
            monitor.stream(&record.event_name, "", "", &[]).await?;
            continue;
        }
        let string = |name: &str| match record.change.keys.get(name) {
            Some(AttributeValue::S(s)) => s.as_str(),
            _ => "",
        };
        let bytes = match record.change.new_image.get("record") {
            Some(AttributeValue::B(b)) => b.as_slice(),
            _ => &[],
        };
        monitor
            .stream(&record.event_name, string("pk"), string("sk"), bytes)
            .await?;
    }
    Ok(())
}

#[tokio::main]
async fn main() -> Result<(), lambda_runtime::Error> {
    // No tracing subscriber: neither payloads nor AWS diagnostic errors are logged.
    let config = aws_config::load_defaults(aws_config::BehaviorVersion::latest()).await;
    let parameter = aws_sdk_ssm::Client::new(&config)
        .get_parameter()
        .name(env("LEDGER_PUBLIC_KEY_PARAMETER")?)
        .with_decryption(false)
        .send()
        .await
        .map_err(|_| Error::Unavailable)?;
    let value = parameter
        .parameter
        .and_then(|p| p.value)
        .ok_or(Error::Configuration)?;
    if value.len() != 130 {
        return Err(Error::Configuration.into());
    }
    let key = VerifyingKey::from_sec1_bytes(&hex::decode(value).map_err(|_| Error::Configuration)?)
        .map_err(|_| Error::Configuration)?;
    let tenant = env("TENANT")?;
    if tenant.len() > 128
        || !tenant
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._-".contains(&b))
    {
        return Err(Error::Configuration.into());
    }
    let monitor = Monitor {
        key,
        tenant: tenant.clone(),
        backend: Aws {
            db: aws_sdk_dynamodb::Client::new(&config),
            s3: aws_sdk_s3::Client::new(&config),
            cw: aws_sdk_cloudwatch::Client::new(&config),
            sns: aws_sdk_sns::Client::new(&config),
            records: env("RECORDS_TABLE")?,
            heads: env("HEADS_TABLE")?,
            bucket: env("AUDIT_BUCKET")?,
            topic: env("ALARM_TOPIC")?,
            tenant,
        },
    };
    lambda_runtime::run(service_fn(|event: LambdaEvent<Value>| async {
        match handle(&monitor, event.payload).await {
            Err(Error::Integrity) => monitor.alarm(Metric::LedgerIntegrityFailure).await,
            result => result,
        }
        .map_err(lambda_runtime::Error::from)
    }))
    .await
}
