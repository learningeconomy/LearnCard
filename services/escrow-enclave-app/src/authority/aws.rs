//! Fixed AWS operations only. These Rust inputs are not host RPC DTOs and must
//! only be constructed by enclave policy. No generic request-signing API exists.
use super::{
    config::{email_address, AuthorityConfig, EmailConfig},
    AuthorityError as Error,
};
use crate::{aws_transport::RequestTime, time::TimeSource};
use aws_sigv4::{
    http_request::{sign, SignableBody, SignableRequest, SigningParams, SigningSettings},
    sign::v4,
};
use aws_smithy_runtime_api::client::{http::HttpConnector, orchestrator::HttpRequest};
use aws_smithy_types::body::SdkBody;
use base64::{engine::general_purpose::STANDARD, Engine};
use rand_core::{OsRng, RngCore};
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use std::{collections::BTreeMap, sync::Arc};
use zeroize::{Zeroize, ZeroizeOnDrop};

const MAX_REQUEST: usize = 1024 * 1024;

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum CredentialPurpose {
    AuthorityWriter,
    EmailSender,
}

/// Dedicated long-lived keys, not the parent STS boot credential type. No Debug,
/// Deserialize, environment provider, session token, or implicit fallback.
#[derive(Zeroize, ZeroizeOnDrop)]
pub struct DedicatedCredentials {
    access_key_id: String,
    secret_access_key: String,
    principal_arn: String,
    #[zeroize(skip)]
    purpose: CredentialPurpose,
}

impl DedicatedCredentials {
    /// Only pass material obtained by attested credential-CMK unsealing. The
    /// principal metadata must be bound by that sealing/provisioning contract;
    /// this constructor is not an AWS identity lookup or proof of key ownership.
    pub fn from_unsealed(
        access_key_id: String,
        secret_access_key: String,
        principal_arn: String,
        purpose: CredentialPurpose,
    ) -> Result<Self, Error> {
        let credentials = Self {
            access_key_id,
            secret_access_key,
            principal_arn,
            purpose,
        };
        if !credentials.access_key_id.starts_with("AKIA")
            || credentials.access_key_id.len() != 20
            || !credentials
                .access_key_id
                .bytes()
                .all(|b| b.is_ascii_uppercase() || b.is_ascii_digit())
            || credentials.secret_access_key.len() != 40
            || !credentials
                .secret_access_key
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"/+=".contains(&b))
        {
            return Err(Error::Configuration);
        }
        Ok(credentials)
    }
}

/// A random enclave-generated ID. Never construct from a host request ID.
#[derive(Clone, PartialEq, Eq)]
pub struct ExecutionId(String);
impl ExecutionId {
    pub fn generate() -> Result<Self, Error> {
        let mut bytes = [0; 16];
        OsRng
            .try_fill_bytes(&mut bytes)
            .map_err(|_| Error::Unavailable)?;
        Ok(Self(hex::encode(bytes)))
    }
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

/// Minimal authority schema values; nested documents/sets are intentionally not exposed.
#[derive(Clone, Serialize, Deserialize, PartialEq, Eq)]
pub enum Attribute {
    S(String),
    N(String),
    B(String),
    #[serde(rename = "BOOL")]
    Bool(bool),
    #[serde(rename = "NULL")]
    Null(bool),
}
pub type Item = BTreeMap<String, Attribute>;

#[derive(Clone)]
pub struct ItemKey {
    pub pk: String,
    pub sk: String,
}
impl ItemKey {
    fn item(&self) -> Result<Item, Error> {
        if self.pk.is_empty() || self.pk.len() > 2048 || self.sk.is_empty() || self.sk.len() > 1024
        {
            return Err(Error::InvalidRequest);
        }
        Ok(BTreeMap::from([
            ("pk".into(), Attribute::S(self.pk.clone())),
            ("sk".into(), Attribute::S(self.sk.clone())),
        ]))
    }
}

/// Expressions are enclave-authored; never deserialize them from parent input.
pub struct Condition {
    pub expression: String,
    pub names: BTreeMap<String, String>,
    pub values: Item,
}
pub enum ConditionalWrite {
    Put {
        item: Item,
        condition: Condition,
    },
    Update {
        key: ItemKey,
        update: String,
        condition: Condition,
    },
    Delete {
        key: ItemKey,
        condition: Condition,
    },
    Check {
        key: ItemKey,
        condition: Condition,
    },
}

fn validate_item(item: &Item) -> Result<(), Error> {
    if item.len() > 100 {
        return Err(Error::InvalidRequest);
    }
    for (name, value) in item {
        if name.is_empty() || name.len() > 255 {
            return Err(Error::InvalidRequest);
        }
        let valid = match value {
            Attribute::S(v) => v.len() <= 400_000,
            Attribute::N(v) => {
                !v.is_empty() && v.len() <= 20 && v.bytes().all(|b| b.is_ascii_digit())
            }
            Attribute::B(v) => v.len() <= 540_000 && STANDARD.decode(v).is_ok(),
            Attribute::Bool(_) => true,
            Attribute::Null(v) => *v,
        };
        if !valid {
            return Err(Error::InvalidRequest);
        }
    }
    Ok(())
}
fn expression(s: &str) -> Result<(), Error> {
    if s.trim().is_empty() || s.len() > 4096 {
        Err(Error::InvalidRequest)
    } else {
        Ok(())
    }
}
fn conditional(table: &str, write: &ConditionalWrite) -> Result<Value, Error> {
    let (kind, mut body, condition) = match write {
        ConditionalWrite::Put { item, condition } => {
            validate_item(item)?;
            let (Some(Attribute::S(pk)), Some(Attribute::S(sk))) = (item.get("pk"), item.get("sk"))
            else {
                return Err(Error::InvalidRequest);
            };
            ItemKey {
                pk: pk.clone(),
                sk: sk.clone(),
            }
            .item()?;
            ("Put", json!({"Item":item}), condition)
        }
        ConditionalWrite::Update {
            key,
            update,
            condition,
        } => {
            expression(update)?;
            (
                "Update",
                json!({"Key":key.item()?, "UpdateExpression":update}),
                condition,
            )
        }
        ConditionalWrite::Delete { key, condition } => {
            ("Delete", json!({"Key":key.item()?}), condition)
        }
        ConditionalWrite::Check { key, condition } => {
            ("ConditionCheck", json!({"Key":key.item()?}), condition)
        }
    };
    expression(&condition.expression)?;
    validate_item(&condition.values)?;
    if condition.names.len() > 100
        || condition
            .names
            .iter()
            .any(|(k, v)| !k.starts_with('#') || k.len() > 255 || v.is_empty() || v.len() > 255)
        || condition.values.keys().any(|k| !k.starts_with(':'))
    {
        return Err(Error::InvalidRequest);
    }
    body["TableName"] = json!(table);
    body["ConditionExpression"] = json!(condition.expression);
    if !condition.names.is_empty() {
        body["ExpressionAttributeNames"] = json!(condition.names);
    }
    if !condition.values.is_empty() {
        body["ExpressionAttributeValues"] = json!(condition.values);
    }
    Ok(json!({kind:body}))
}

/// Immutable body/token pair. Retrying manually reuses these exact bytes; the
/// AWS 10-minute token window is NOT a substitute for durable policy receipts.
pub struct Transaction {
    execution_id: ExecutionId,
    body: Vec<u8>,
    table_arn: String,
}
impl Transaction {
    pub fn execution_id(&self) -> &ExecutionId {
        &self.execution_id
    }
}

#[derive(Clone, Copy)]
enum Operation {
    Get,
    TransactGet,
    TransactWrite,
    SendEmail,
}
impl Operation {
    fn service(self) -> &'static str {
        if matches!(self, Self::SendEmail) {
            "ses"
        } else {
            "dynamodb"
        }
    }
    fn path(self) -> &'static str {
        if matches!(self, Self::SendEmail) {
            "/v2/email/outbound-emails"
        } else {
            "/"
        }
    }
    fn target(self) -> Option<&'static str> {
        match self {
            Self::Get => Some("DynamoDB_20120810.GetItem"),
            Self::TransactGet => Some("DynamoDB_20120810.TransactGetItems"),
            Self::TransactWrite => Some("DynamoDB_20120810.TransactWriteItems"),
            Self::SendEmail => None,
        }
    }
    fn ambiguous(self) -> Error {
        if matches!(self, Self::TransactWrite | Self::SendEmail) {
            Error::UnknownOutcome
        } else {
            Error::Unavailable
        }
    }
}

struct Client {
    credentials: DedicatedCredentials,
    time: Arc<dyn TimeSource>,
    endpoint: String,
    region: String,
    #[cfg(test)]
    connector: Option<aws_smithy_runtime_api::client::http::SharedHttpConnector>,
}
impl Client {
    fn new(
        credentials: DedicatedCredentials,
        time: Arc<dyn TimeSource>,
        endpoint: String,
        region: String,
        purpose: CredentialPurpose,
        principal: &str,
    ) -> Result<Self, Error> {
        if credentials.purpose != purpose || credentials.principal_arn != principal {
            return Err(Error::Configuration);
        }
        Ok(Self {
            credentials,
            time,
            endpoint,
            region,
            #[cfg(test)]
            connector: None,
        })
    }
    fn signed(
        &self,
        operation: Operation,
        body: Vec<u8>,
        time: &RequestTime,
    ) -> Result<HttpRequest, Error> {
        if body.len() > MAX_REQUEST {
            return Err(Error::InvalidRequest);
        }
        let credentials = aws_credential_types::Credentials::new(
            self.credentials.access_key_id.clone(),
            self.credentials.secret_access_key.clone(),
            None,
            None,
            "enclave-dedicated",
        );
        let identity = credentials.into();
        let params: SigningParams<'_> = v4::SigningParams::builder()
            .identity(&identity)
            .region(&self.region)
            .name(operation.service())
            .time(aws_smithy_async::time::TimeSource::now(time))
            .settings(SigningSettings::default())
            .build()
            .map_err(|_| Error::Configuration)?
            .into();
        let url = format!("{}{}", self.endpoint, operation.path());
        let authority = self
            .endpoint
            .strip_prefix("https://")
            .ok_or(Error::Configuration)?;
        let content_type = if operation.target().is_some() {
            "application/x-amz-json-1.0"
        } else {
            "application/json"
        };
        let mut request = hyper::Request::builder()
            .method("POST")
            .uri(&url)
            .header("host", authority)
            .header("content-type", content_type)
            .header("content-length", body.len());
        if let Some(target) = operation.target() {
            request = request.header("x-amz-target", target);
        }
        let mut request = request.body(body).map_err(|_| Error::Configuration)?;
        let headers = request
            .headers()
            .iter()
            .map(|(name, value)| {
                value
                    .to_str()
                    .map(|v| (name.as_str(), v))
                    .map_err(|_| Error::Configuration)
            })
            .collect::<Result<Vec<_>, _>>()?;
        let signable = SignableRequest::new(
            "POST",
            &url,
            headers.into_iter(),
            SignableBody::Bytes(request.body()),
        )
        .map_err(|_| Error::Configuration)?;
        let (instructions, _) = sign(signable, &params)
            .map_err(|_| Error::Unavailable)?
            .into_parts();
        instructions.apply_to_request_http1x(&mut request);
        HttpRequest::try_from(request.map(SdkBody::from)).map_err(|_| Error::Configuration)
    }
    async fn call(&self, operation: Operation, body: Vec<u8>) -> Result<Value, Error> {
        let time = RequestTime::acquire(self.time.as_ref())
            .await
            .map_err(|_| Error::Unavailable)?;
        let request = self.signed(operation, body, &time)?;
        let connector = time
            .connector(&self.endpoint)
            .map_err(|_| Error::Configuration)?;
        #[cfg(test)]
        let connector = self.connector.clone().unwrap_or(connector);
        // Deliberately exactly one call. In particular SES has no idempotency token.
        let response = connector
            .call(request)
            .await
            .map_err(|_| operation.ambiguous())?;
        decode(
            operation,
            response.status().as_u16(),
            response
                .body()
                .bytes()
                .ok_or_else(|| operation.ambiguous())?,
        )
    }
}

fn encode(value: &Value) -> Result<Vec<u8>, Error> {
    let body = serde_json::to_vec(value).map_err(|_| Error::InvalidRequest)?;
    if body.len() > MAX_REQUEST {
        return Err(Error::InvalidRequest);
    }
    Ok(body)
}
fn decode(operation: Operation, status: u16, body: &[u8]) -> Result<Value, Error> {
    if status != 200 {
        // A reused transaction token can return HTTP 400 TransactionInProgress
        // while the original still commits. Even AccessDenied on a later call
        // says nothing about that original outcome. Conservatively preserve
        // ambiguity for ALL mutation errors; policy must reconcile durable state.
        return Err(match operation {
            Operation::TransactWrite | Operation::SendEmail => Error::UnknownOutcome,
            _ if status >= 500 || status == 408 => Error::Unavailable,
            _ => Error::Rejected,
        });
    }
    let value: Value = serde_json::from_slice(body).map_err(|_| operation.ambiguous())?;
    if !value.is_object() {
        return Err(operation.ambiguous());
    }
    Ok(value)
}
fn read_item(value: &Value) -> Result<Option<Item>, Error> {
    let Some(item) = value.get("Item") else {
        return Ok(None);
    };
    let item: Item = serde_json::from_value(item.clone()).map_err(|_| Error::Unavailable)?;
    validate_item(&item).map_err(|_| Error::Unavailable)?;
    Ok(Some(item))
}

pub struct DynamoAuthorityClient {
    config: AuthorityConfig,
    client: Client,
}
impl DynamoAuthorityClient {
    pub fn new(
        config: AuthorityConfig,
        credentials: DedicatedCredentials,
        time: Arc<dyn TimeSource>,
    ) -> Result<Self, Error> {
        let client = Client::new(
            credentials,
            time,
            config.endpoint(),
            config.region.clone(),
            CredentialPurpose::AuthorityWriter,
            &config.writer_arn(),
        )?;
        Ok(Self { config, client })
    }
    pub async fn get_item(&self, key: &ItemKey) -> Result<Option<Item>, Error> {
        let body = encode(
            &json!({"TableName":self.config.table_arn(), "Key":key.item()?, "ConsistentRead":true}),
        )?;
        read_item(&self.client.call(Operation::Get, body).await?)
    }
    /// Transactional reads are atomic/serializable. AWS does not accept a
    /// ConsistentRead field on TransactGetItems; do not send that invalid option.
    pub async fn transact_get_items(&self, keys: &[ItemKey]) -> Result<Vec<Option<Item>>, Error> {
        if keys.is_empty() || keys.len() > 100 {
            return Err(Error::InvalidRequest);
        }
        let items = keys
            .iter()
            .map(|key| Ok(json!({"Get":{"TableName":self.config.table_arn(),"Key":key.item()?}})))
            .collect::<Result<Vec<_>, Error>>()?;
        let response = self
            .client
            .call(
                Operation::TransactGet,
                encode(&json!({"TransactItems":items}))?,
            )
            .await?;
        let values = response
            .get("Responses")
            .and_then(Value::as_array)
            .filter(|v| v.len() == keys.len())
            .ok_or(Error::Unavailable)?;
        values
            .iter()
            .map(|v| {
                if v.is_object() {
                    read_item(v)
                } else {
                    Err(Error::Unavailable)
                }
            })
            .collect()
    }
    pub fn prepare_transaction(&self, writes: &[ConditionalWrite]) -> Result<Transaction, Error> {
        if writes.is_empty() || writes.len() > 100 {
            return Err(Error::InvalidRequest);
        }
        let table_arn = self.config.table_arn();
        let items = writes
            .iter()
            .map(|w| conditional(&table_arn, w))
            .collect::<Result<Vec<_>, _>>()?;
        let execution_id = ExecutionId::generate()?;
        let body =
            encode(&json!({"ClientRequestToken":execution_id.as_str(), "TransactItems":items}))?;
        Ok(Transaction {
            execution_id,
            body,
            table_arn,
        })
    }
    pub async fn transact_write_items(&self, transaction: &Transaction) -> Result<(), Error> {
        if transaction.table_arn != self.config.table_arn() {
            return Err(Error::InvalidRequest);
        }
        self.client
            .call(Operation::TransactWrite, transaction.body.clone())
            .await?;
        Ok(())
    }
}

pub struct EmailReceipt {
    pub execution_id: ExecutionId,
    pub message_id: String,
}
pub struct SesEmailClient {
    config: EmailConfig,
    client: Client,
}
impl SesEmailClient {
    pub fn new(
        config: EmailConfig,
        credentials: DedicatedCredentials,
        time: Arc<dyn TimeSource>,
    ) -> Result<Self, Error> {
        let client = Client::new(
            credentials,
            time,
            config.endpoint(),
            config.region.clone(),
            CredentialPurpose::EmailSender,
            &config.sender_arn(),
        )?;
        Ok(Self { config, client })
    }
    /// One plain-text recipient; no HTML, raw MIME, arbitrary headers or sender override.
    /// Subject/template selection must come from measured enclave code, not the host.
    pub async fn send_email(
        &self,
        recipient: &str,
        subject: &'static str,
        text: &str,
    ) -> Result<EmailReceipt, Error> {
        if !email_address(recipient)
            || subject.is_empty()
            || subject.len() > 256
            || subject.contains(['\r', '\n'])
            || text.is_empty()
            || text.len() > 16_384
        {
            return Err(Error::InvalidRequest);
        }
        let execution_id = ExecutionId::generate()?;
        let body = encode(&json!({
            "FromEmailAddress":self.config.from, "FromEmailAddressIdentityArn":self.config.identity_arn(),
            "ConfigurationSetName":self.config.configuration_set, "Destination":{"ToAddresses":[recipient]},
            "Content":{"Simple":{"Subject":{"Data":subject,"Charset":"UTF-8"},"Body":{"Text":{"Data":text,"Charset":"UTF-8"}}}},
            "EmailTags":[{"Name":"execution-id","Value":execution_id.as_str()}]
        }))?;
        let response = self.client.call(Operation::SendEmail, body).await?;
        let message_id = response
            .get("MessageId")
            .and_then(Value::as_str)
            .filter(|s| !s.is_empty() && s.len() <= 256)
            .ok_or(Error::UnknownOutcome)?
            .to_owned();
        Ok(EmailReceipt {
            execution_id,
            message_id,
        })
    }
}

#[cfg(test)]
mod tests;
