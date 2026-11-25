use super::*;
use crate::time::{TimeError, TimeEvidence, TimeFuture, TrustedInterval};
use aws_smithy_runtime_api::client::{
    http::{HttpConnectorFuture, SharedHttpConnector},
    orchestrator::HttpResponse,
};
use std::sync::{
    atomic::{AtomicUsize, Ordering},
    Mutex,
};

struct Clock {
    calls: AtomicUsize,
    unavailable: bool,
}
impl TimeSource for Clock {
    fn now(&self, _: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
        Box::pin(async {
            if self.unavailable {
                return Err(TimeError::Unavailable);
            }
            let n = self.calls.fetch_add(1, Ordering::SeqCst) as u64;
            Ok(TimeEvidence {
                interval: TrustedInterval {
                    lo_ms: 1_577_836_800_000 + n * 1000,
                    hi_ms: 1_577_836_800_000 + n * 1000,
                },
                sources: vec![],
            })
        })
    }
}
fn clock() -> Arc<Clock> {
    Arc::new(Clock {
        calls: AtomicUsize::new(0),
        unavailable: false,
    })
}
fn config() -> AuthorityConfig {
    AuthorityConfig {
        region: "us-east-1".into(),
        account: "123456789012".into(),
        table: "authority".into(),
        writer: "writer".into(),
        tenant: "test".into(),
        environment: "test".into(),
        generation: "g1".into(),
    }
}
fn credentials(arn: String, purpose: CredentialPurpose) -> DedicatedCredentials {
    DedicatedCredentials::from_unsealed("AKIA0000000000000000".into(), "a".repeat(40), arn, purpose)
        .unwrap()
}
#[derive(Debug)]
struct Capture {
    requests: Arc<Mutex<Vec<HttpRequest>>>,
    status: u16,
    response: &'static str,
}
impl HttpConnector for Capture {
    fn call(&self, request: HttpRequest) -> HttpConnectorFuture {
        self.requests.lock().unwrap().push(request);
        let response = hyper::Response::builder()
            .status(self.status)
            .header("date", "Tue, 01 Jan 2030 00:00:00 GMT")
            .body(SdkBody::from(self.response))
            .unwrap();
        HttpConnectorFuture::ready(Ok(HttpResponse::try_from(response).unwrap()))
    }
}
fn capture(
    client: &mut Client,
    status: u16,
    response: &'static str,
) -> Arc<Mutex<Vec<HttpRequest>>> {
    let requests = Arc::new(Mutex::new(Vec::new()));
    client.connector = Some(SharedHttpConnector::new(Capture {
        requests: requests.clone(),
        status,
        response,
    }));
    requests
}
fn dynamo(time: Arc<dyn TimeSource>) -> DynamoAuthorityClient {
    let config = config();
    let creds = credentials(config.writer_arn(), CredentialPurpose::AuthorityWriter);
    DynamoAuthorityClient::new(config, creds, time).unwrap()
}
fn key() -> ItemKey {
    ItemKey {
        pk: "ENROLL#test".into(),
        sk: "HEAD".into(),
    }
}
fn condition() -> Condition {
    Condition {
        expression: "attribute_not_exists(#pk)".into(),
        names: BTreeMap::from([("#pk".into(), "pk".into())]),
        values: BTreeMap::new(),
    }
}
fn body(request: &HttpRequest) -> Value {
    serde_json::from_slice(request.body().bytes().unwrap()).unwrap()
}

#[tokio::test]
async fn strong_reads_pin_table_and_each_operation_reacquires_signing_time() {
    let time = clock();
    let mut client = dynamo(time.clone());
    let requests = capture(&mut client.client, 200, "{}");
    assert!(client.get_item(&key()).await.unwrap().is_none());
    assert!(client.get_item(&key()).await.unwrap().is_none());
    assert_eq!(time.calls.load(Ordering::SeqCst), 2);
    let requests = requests.lock().unwrap();
    for (i, request) in requests.iter().enumerate() {
        assert_eq!(
            request.headers().get("x-amz-date"),
            Some(format!("20200101T00000{i}Z").as_str())
        );
        assert!(request
            .headers()
            .get("authorization")
            .unwrap()
            .contains("/us-east-1/dynamodb/aws4_request"));
        assert_eq!(request.headers().get("x-amz-security-token"), None);
        assert_eq!(
            request.headers().get("x-amz-target"),
            Some("DynamoDB_20120810.GetItem")
        );
        let body = body(request);
        assert_eq!(body["ConsistentRead"], true);
        assert_eq!(body["TableName"], config().table_arn());
        assert_eq!(
            request.uri().to_string(),
            "https://dynamodb.us-east-1.amazonaws.com:8001/"
        );
        assert_eq!(
            request.headers().get("host"),
            Some("dynamodb.us-east-1.amazonaws.com")
        );
    }
}

#[tokio::test]
async fn transactional_reads_use_aws_atomic_api_and_validate_response_shape() {
    let mut client = dynamo(clock());
    let requests = capture(&mut client.client, 200, "{\"Responses\":[{}]}");
    assert_eq!(client.transact_get_items(&[key()]).await.unwrap().len(), 1);
    {
        let request = requests.lock().unwrap();
        assert_eq!(
            request[0].headers().get("x-amz-target"),
            Some("DynamoDB_20120810.TransactGetItems")
        );
        assert!(body(&request[0])["TransactItems"][0]["Get"]
            .get("ConsistentRead")
            .is_none());
    }
    capture(&mut client.client, 200, "{\"Responses\":[]}");
    assert!(client.transact_get_items(&[key()]).await.is_err());
    capture(&mut client.client, 200, "{\"Item\":null}");
    assert!(client.get_item(&key()).await.is_err());
}

#[tokio::test]
async fn transactions_bind_conditions_and_random_tokens_and_do_not_retry() {
    let mut client = dynamo(clock());
    let writes = [ConditionalWrite::Put {
        item: key().item().unwrap(),
        condition: condition(),
    }];
    let first = client.prepare_transaction(&writes).unwrap();
    let second = client.prepare_transaction(&writes).unwrap();
    assert_ne!(
        first.execution_id().as_str(),
        second.execution_id().as_str()
    );
    assert_eq!(first.execution_id().as_str().len(), 32);
    let requests = capture(&mut client.client, 503, "{}");
    assert_eq!(
        client.transact_write_items(&first).await,
        Err(Error::UnknownOutcome)
    );
    let requests = requests.lock().unwrap();
    assert_eq!(requests.len(), 1);
    let body = body(&requests[0]);
    assert_eq!(body["ClientRequestToken"], first.execution_id().as_str());
    assert_eq!(
        body["TransactItems"][0]["Put"]["ConditionExpression"],
        "attribute_not_exists(#pk)"
    );
    assert_eq!(
        body["TransactItems"][0]["Put"]["TableName"],
        config().table_arn()
    );
    assert!(client.prepare_transaction(&[]).is_err());
    assert!(client
        .prepare_transaction(&[ConditionalWrite::Delete {
            key: key(),
            condition: Condition {
                expression: String::new(),
                names: BTreeMap::new(),
                values: BTreeMap::new()
            }
        }])
        .is_err());
}

#[tokio::test]
async fn ses_uses_fixed_sender_identity_plain_text_and_one_attempt() {
    let config = EmailConfig {
        region: "us-east-1".into(),
        account: "123456789012".into(),
        sender: "sender".into(),
        from: "recovery@staging.notify.learncard.com".into(),
        identity: "staging.notify.learncard.com".into(),
        configuration_set: "recovery".into(),
    };
    let creds = credentials(config.sender_arn(), CredentialPurpose::EmailSender);
    let mut client = SesEmailClient::new(config, creds, clock()).unwrap();
    let requests = capture(&mut client.client, 200, "{\"MessageId\":\"accepted\"}");
    let receipt = client
        .send_email(
            "test@example.com",
            "Recovery",
            "Only enter this code if you started a recovery.",
        )
        .await
        .unwrap();
    assert_eq!(receipt.message_id, "accepted");
    {
        let guard = requests.lock().unwrap();
        let request = &guard[0];
        assert_eq!(
            request.uri().to_string(),
            "https://email.us-east-1.amazonaws.com:8002/v2/email/outbound-emails"
        );
        // SES rejects a SigV4 signature over `host:8002` (verified live); the
        // relay port stays in the URL only.
        assert_eq!(
            request.headers().get("host"),
            Some("email.us-east-1.amazonaws.com")
        );
        assert!(request
            .headers()
            .get("authorization")
            .unwrap()
            .contains("SignedHeaders=content-length;content-type;host;"));
        assert!(request
            .headers()
            .get("authorization")
            .unwrap()
            .contains("/us-east-1/ses/aws4_request"));
        assert_eq!(request.headers().get("x-amz-target"), None);
        let body = body(request);
        assert!(body["Content"]["Simple"]["Body"].get("Html").is_none());
        assert_eq!(
            body["FromEmailAddress"],
            "recovery@staging.notify.learncard.com"
        );
        assert_eq!(body["EmailTags"][0]["Value"], receipt.execution_id.as_str());
    }
    let requests = capture(&mut client.client, 503, "{}");
    assert!(matches!(
        client
            .send_email("test@example.com", "Recovery", "Code")
            .await,
        Err(Error::UnknownOutcome)
    ));
    assert_eq!(requests.lock().unwrap().len(), 1);
}

#[tokio::test]
async fn no_time_no_request_and_no_boot_credential_fallback() {
    let mut client = dynamo(Arc::new(Clock {
        calls: AtomicUsize::new(0),
        unavailable: true,
    }));
    let requests = capture(&mut client.client, 200, "{}");
    assert!(matches!(
        client.get_item(&key()).await,
        Err(Error::Unavailable)
    ));
    assert!(requests.lock().unwrap().is_empty());
    assert!(DedicatedCredentials::from_unsealed(
        "ASIA0000000000000000".into(),
        "a".repeat(40),
        config().writer_arn(),
        CredentialPurpose::AuthorityWriter
    )
    .is_err());
    assert!(DynamoAuthorityClient::new(
        config(),
        credentials(config().writer_arn(), CredentialPurpose::EmailSender),
        clock()
    )
    .is_err());
    assert!(DynamoAuthorityClient::new(
        config(),
        credentials(
            "arn:aws:iam::123456789012:user/wrong".into(),
            CredentialPurpose::AuthorityWriter
        ),
        clock()
    )
    .is_err());
    assert_eq!(
        decode(Operation::TransactWrite, 408, b"{}"),
        Err(Error::UnknownOutcome)
    );
    assert_eq!(
        decode(Operation::TransactWrite, 400, b"secret server error"),
        Err(Error::UnknownOutcome)
    );
    assert_eq!(
        decode(Operation::SendEmail, 200, b"garbage"),
        Err(Error::UnknownOutcome)
    );
}

#[tokio::test]
async fn replayed_transaction_in_progress_preserves_unknown_original_outcome() {
    let mut client = dynamo(clock());
    let transaction = client
        .prepare_transaction(&[ConditionalWrite::Put {
            item: key().item().unwrap(),
            condition: condition(),
        }])
        .unwrap();
    let first = capture(&mut client.client, 503, "{}");
    assert_eq!(
        client.transact_write_items(&transaction).await,
        Err(Error::UnknownOutcome)
    );
    assert_eq!(first.lock().unwrap().len(), 1);
    let replay = capture(
        &mut client.client,
        400,
        "{\"__type\":\"com.amazonaws.dynamodb.v20120810#TransactionInProgressException\"}",
    );
    assert_eq!(
        client.transact_write_items(&transaction).await,
        Err(Error::UnknownOutcome)
    );
    assert_eq!(replay.lock().unwrap().len(), 1);
    assert_eq!(
        body(&first.lock().unwrap()[0]),
        body(&replay.lock().unwrap()[0])
    );
}

#[tokio::test]
async fn signature_is_computed_over_the_bare_service_host() {
    let sign = |endpoint: &str| {
        let email = EmailConfig {
            region: "us-east-1".into(),
            account: "123456789012".into(),
            sender: "sender".into(),
            from: "recovery@staging.notify.learncard.com".into(),
            identity: "staging.notify.learncard.com".into(),
            configuration_set: "recovery".into(),
        };
        let creds = credentials(email.sender_arn(), CredentialPurpose::EmailSender);
        Client::new(
            creds,
            clock(),
            endpoint.into(),
            "us-east-1".into(),
            CredentialPurpose::EmailSender,
            &email.sender_arn(),
        )
        .unwrap()
    };
    let relay = sign("https://email.us-east-1.amazonaws.com:8002");
    let direct = sign("https://email.us-east-1.amazonaws.com");
    let time = RequestTime::acquire(clock().as_ref()).await.unwrap();
    let auth = |client: &Client| {
        client
            .signed(Operation::SendEmail, b"{}".to_vec(), &time)
            .unwrap()
            .headers()
            .get("authorization")
            .unwrap()
            .to_owned()
    };
    // Same signature as a request AWS sees on the standard :443 host.
    assert_eq!(auth(&relay), auth(&direct));
}
