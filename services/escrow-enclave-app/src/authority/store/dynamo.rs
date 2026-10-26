//! Direct typed DynamoDB adapter. There are no host-authored expressions, reads
//! from Mongo/ledger, retries, deletions or refunds in this driver.
use super::*;
use crate::authority::{
    aws::{Attribute, Condition, ConditionalWrite, DynamoAuthorityClient, Item, ItemKey},
    config::AuthorityConfig,
};
use base64::{engine::general_purpose::STANDARD, Engine};
use std::collections::BTreeMap;

impl DynamoAuthorityClient {
    /// Config scope comes from this client's measured configuration, not a second
    /// caller-supplied tenant/generation which could disagree with its credentials.
    pub fn into_store(self) -> Result<impl AuthorityStore, Error> {
        let scope = scope(self.authority_config())?;
        Ok(Store {
            scope,
            backend: self,
        })
    }
}

fn scope(config: &AuthorityConfig) -> Result<Scope, Error> {
    Scope::new(config.tenant().to_owned(), config.generation().to_owned())
}
fn item_key(key: &Key) -> ItemKey {
    ItemKey {
        pk: key.pk.clone(),
        sk: key.sk.clone(),
    }
}
fn encode_row(key: &Key, value: &[u8]) -> Item {
    BTreeMap::from([
        ("pk".into(), Attribute::S(key.pk.clone())),
        ("sk".into(), Attribute::S(key.sk.clone())),
        ("payload".into(), Attribute::B(STANDARD.encode(value))),
    ])
}
fn decode_row(key: &Key, item: Item) -> Result<Vec<u8>, Error> {
    require(item.len() == 3)?;
    require(
        item.get("pk") == Some(&Attribute::S(key.pk.clone()))
            && item.get("sk") == Some(&Attribute::S(key.sk.clone())),
    )?;
    let Some(Attribute::B(value)) = item.get("payload") else {
        return Err(Error::Unavailable);
    };
    require(value.len() <= MAX_ITEM_BYTES.div_ceil(3) * 4)?;
    let value = STANDARD.decode(value).map_err(|_| Error::Unavailable)?;
    require(value.len() <= MAX_ITEM_BYTES)?;
    Ok(value)
}
fn conditional(write: &Write) -> ConditionalWrite {
    let condition = match &write.expected {
        None => Condition {
            expression: "attribute_not_exists(#pk)".into(),
            names: BTreeMap::from([("#pk".into(), "pk".into())]),
            values: BTreeMap::new(),
        },
        Some(bytes) => Condition {
            expression: "#payload = :expected".into(),
            names: BTreeMap::from([("#payload".into(), "payload".into())]),
            values: BTreeMap::from([(":expected".into(), Attribute::B(STANDARD.encode(bytes)))]),
        },
    };
    ConditionalWrite::Put {
        item: encode_row(&write.key, &write.value),
        condition,
    }
}

impl Backend for DynamoAuthorityClient {
    fn read<'a>(&'a self, keys: &'a [Key]) -> StoreFuture<'a, Vec<Option<Vec<u8>>>> {
        Box::pin(async move {
            let values = self
                .transact_get_items(&keys.iter().map(item_key).collect::<Vec<_>>())
                .await?;
            values
                .into_iter()
                .zip(keys)
                .map(|(item, key)| item.map(|item| decode_row(key, item)).transpose())
                .collect()
        })
    }
    fn write<'a>(&'a self, writes: &'a [Write]) -> StoreFuture<'a, ()> {
        Box::pin(async move {
            let transaction =
                self.prepare_transaction(&writes.iter().map(conditional).collect::<Vec<_>>())?;
            self.transact_write_items(&transaction).await
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        authority::aws::{CredentialPurpose, DedicatedCredentials},
        time::{TimeEvidence, TimeFuture, TimeSource, TrustedInterval},
    };
    use aws_smithy_runtime_api::client::{
        http::{HttpConnector, HttpConnectorFuture, SharedHttpConnector},
        orchestrator::{HttpRequest, HttpResponse},
    };
    use aws_smithy_types::body::SdkBody;
    use serde_json::{json, Value};
    use std::sync::{Arc, Mutex};

    struct Clock;
    impl TimeSource for Clock {
        fn now(&self, _: Option<u64>) -> TimeFuture<'_, TimeEvidence> {
            Box::pin(async {
                Ok(TimeEvidence {
                    interval: TrustedInterval {
                        lo_ms: 1_577_836_800_000,
                        hi_ms: 1_577_836_800_000,
                    },
                    sources: vec![],
                })
            })
        }
    }

    /// Protocol-level emulator, independent of FakeDatabase. It interprets the
    /// actual signed HTTP JSON and atomic conditions, with NO AWS token cache.
    #[derive(Default)]
    struct Protocol {
        rows: Mutex<BTreeMap<(String, String), Item>>,
    }
    impl std::fmt::Debug for Protocol {
        fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
            f.write_str("test authority protocol")
        }
    }
    impl HttpConnector for Protocol {
        fn call(&self, request: HttpRequest) -> HttpConnectorFuture {
            let body: Value = serde_json::from_slice(request.body().bytes().unwrap()).unwrap();
            assert!(request.headers().get("authorization").is_some());
            let target = request.headers().get("x-amz-target").unwrap();
            let mut rows = self.rows.lock().unwrap();
            let (status, response) = if target == "DynamoDB_20120810.TransactGetItems" {
                let items = body["TransactItems"]
                    .as_array()
                    .unwrap()
                    .iter()
                    .map(|get| {
                        assert!(get["Get"].get("ConsistentRead").is_none());
                        let key = (
                            get["Get"]["Key"]["pk"]["S"].as_str().unwrap().to_owned(),
                            get["Get"]["Key"]["sk"]["S"].as_str().unwrap().to_owned(),
                        );
                        rows.get(&key)
                            .map(|item| json!({"Item":item}))
                            .unwrap_or(json!({}))
                    })
                    .collect::<Vec<_>>();
                (200, json!({"Responses":items}))
            } else {
                assert_eq!(target, "DynamoDB_20120810.TransactWriteItems");
                assert_eq!(body["ClientRequestToken"].as_str().unwrap().len(), 32);
                let writes = body["TransactItems"].as_array().unwrap();
                assert!((3..=4).contains(&writes.len()));
                let mut proposed = Vec::new();
                let mut valid = true;
                let mut seen = BTreeSet::new();
                for write in writes {
                    let put = &write["Put"];
                    let item: Item = serde_json::from_value(put["Item"].clone()).unwrap();
                    let Attribute::S(pk) = item.get("pk").unwrap() else {
                        panic!("pk")
                    };
                    let Attribute::S(sk) = item.get("sk").unwrap() else {
                        panic!("sk")
                    };
                    assert!(seen.insert((pk.clone(), sk.clone())));
                    let key = (pk.clone(), sk.clone());
                    match put["ConditionExpression"].as_str().unwrap() {
                        "attribute_not_exists(#pk)" => {
                            assert_eq!(put["ExpressionAttributeNames"]["#pk"], "pk");
                            valid &= !rows.contains_key(&key);
                        }
                        "#payload = :expected" => {
                            assert_eq!(put["ExpressionAttributeNames"]["#payload"], "payload");
                            let expected: Attribute = serde_json::from_value(
                                put["ExpressionAttributeValues"][":expected"].clone(),
                            )
                            .unwrap();
                            valid &= rows.get(&key).and_then(|row| row.get("payload"))
                                == Some(&expected);
                        }
                        _ => panic!("unexpected condition"),
                    }
                    proposed.push((key, item));
                }
                if valid {
                    rows.extend(proposed);
                    (200, json!({}))
                } else {
                    (400, json!({"__type":"TransactionCanceledException"}))
                }
            };
            HttpConnectorFuture::ready(Ok(HttpResponse::try_from(
                hyper::Response::builder()
                    .status(status)
                    .body(SdkBody::from(response.to_string()))
                    .unwrap(),
            )
            .unwrap()))
        }
    }

    #[tokio::test]
    async fn actual_dynamo_adapter_satisfies_shared_contract_without_token_cache() {
        let config = AuthorityConfig {
            region: "us-east-1".into(),
            account: "123456789012".into(),
            table: "authority".into(),
            writer: "writer".into(),
            tenant: "learncard".into(),
            environment: "test".into(),
            generation: "g1".into(),
        };
        let credentials = DedicatedCredentials::from_unsealed(
            "AKIA0000000000000000".into(),
            "a".repeat(40),
            config.writer_arn(),
            CredentialPurpose::AuthorityWriter,
        )
        .unwrap();
        let mut client = DynamoAuthorityClient::new(config, credentials, Arc::new(Clock)).unwrap();
        client.set_test_connector(SharedHttpConnector::new(Protocol::default()));
        crate::authority::store::tests::backend_contract(&client.into_store().unwrap()).await;
    }
    #[test]
    fn exact_binary_conditions_and_no_delete_or_unconditional_write() {
        let key = Key {
            pk: "account".into(),
            sk: "ENROLLMENT".into(),
        };
        for expected in [None, Some(b"old".to_vec())] {
            let ConditionalWrite::Put { item, condition } = conditional(&Write {
                key: key.clone(),
                expected: expected.clone(),
                value: b"new".to_vec(),
            }) else {
                panic!("put required")
            };
            assert_eq!(decode_row(&key, item).unwrap(), b"new");
            if let Some(expected) = expected {
                assert_eq!(condition.expression, "#payload = :expected");
                assert!(
                    condition.values.get(":expected")
                        == Some(&Attribute::B(STANDARD.encode(expected)))
                );
            } else {
                assert_eq!(condition.expression, "attribute_not_exists(#pk)");
            }
        }
    }
    #[test]
    fn row_transplants_extra_attributes_and_oversize_fail_closed() {
        let key = Key {
            pk: "account".into(),
            sk: "ENROLLMENT".into(),
        };
        let mut row = encode_row(&key, b"payload");
        row.insert("pk".into(), Attribute::S("other".into()));
        assert!(decode_row(&key, row).is_err());
        let mut row = encode_row(&key, b"payload");
        row.insert("ttl".into(), Attribute::N("1".into()));
        assert!(decode_row(&key, row).is_err());
        assert!(decode_row(&key, encode_row(&key, &vec![0; MAX_ITEM_BYTES + 1])).is_err());
    }
}
