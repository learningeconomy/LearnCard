//! Optional measured-image settings, not host request fields. Partial sets fail closed.
use super::AuthorityError;

#[derive(Clone)]
pub struct AuthorityConfig {
    pub(crate) region: String,
    pub(crate) account: String,
    pub(crate) table: String,
    pub(crate) writer: String,
    pub(crate) tenant: String,
    pub(crate) environment: String,
    pub(crate) generation: String,
}

#[derive(Clone)]
pub struct EmailConfig {
    pub(crate) region: String,
    pub(crate) account: String,
    pub(crate) sender: String,
    pub(crate) from: String,
    pub(crate) identity: String,
    pub(crate) configuration_set: String,
}

fn read_optional<const N: usize>(
    names: [&str; N],
    read: impl Fn(&str) -> Result<String, AuthorityError>,
) -> Result<Option<[String; N]>, AuthorityError> {
    let values = names.map(read).into_iter().collect::<Result<Vec<_>, _>>()?;
    if values.iter().all(String::is_empty) {
        return Ok(None);
    }
    if values.iter().any(|v| v.is_empty() || v.len() > 255) {
        return Err(AuthorityError::Configuration);
    }
    values
        .try_into()
        .map(Some)
        .map_err(|_| AuthorityError::Configuration)
}

fn env(name: &str) -> Result<String, AuthorityError> {
    match std::env::var(name) {
        Ok(value) => Ok(value),
        Err(std::env::VarError::NotPresent) => Ok(String::new()),
        Err(_) => Err(AuthorityError::Configuration),
    }
}

fn label(s: &str) -> bool {
    !s.is_empty()
        && s.len() <= 128
        && s.bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"_-".contains(&b))
}
fn region_account(region: &str, account: &str) -> bool {
    region.len() <= 64
        && region.split('-').count() >= 3
        && region
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
        && account.len() == 12
        && account.bytes().all(|b| b.is_ascii_digit())
        && !region.starts_with("cn-")
        && !region.starts_with("us-gov-")
}
pub(super) fn email_address(s: &str) -> bool {
    let Some((local, domain)) = s.split_once('@') else {
        return false;
    };
    !local.is_empty()
        && local.len() <= 64
        && s.len() <= 254
        && local
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b"._+-".contains(&b))
        && dns_name(domain)
}
fn dns_name(s: &str) -> bool {
    s.len() <= 253
        && s.contains('.')
        && s.split('.').all(|part| {
            !part.is_empty()
                && part.len() <= 63
                && !part.starts_with('-')
                && !part.ends_with('-')
                && part
                    .bytes()
                    .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
        })
}

impl AuthorityConfig {
    pub fn from_measured_env() -> Result<Option<Self>, AuthorityError> {
        Self::load(env)
    }
    fn load(
        read: impl Fn(&str) -> Result<String, AuthorityError>,
    ) -> Result<Option<Self>, AuthorityError> {
        let Some([region, account, table, writer, tenant, environment, generation]) =
            read_optional(
                [
                    "ESCROW_AUTHORITY_REGION",
                    "ESCROW_AUTHORITY_ACCOUNT_ID",
                    "ESCROW_AUTHORITY_TABLE",
                    "ESCROW_AUTHORITY_WRITER_USER",
                    "ESCROW_AUTHORITY_TENANT",
                    "ESCROW_AUTHORITY_ENVIRONMENT",
                    "ESCROW_AUTHORITY_GENERATION",
                ],
                read,
            )?
        else {
            return Ok(None);
        };
        if !region_account(&region, &account)
            || table.len() < 3
            || table.len() > 255
            || !table
                .bytes()
                .all(|b| b.is_ascii_alphanumeric() || b"_.-".contains(&b))
            || ![&writer, &tenant, &environment, &generation]
                .into_iter()
                .all(|s| label(s))
        {
            return Err(AuthorityError::Configuration);
        }
        Ok(Some(Self {
            region,
            account,
            table,
            writer,
            tenant,
            environment,
            generation,
        }))
    }
    pub fn table_arn(&self) -> String {
        format!(
            "arn:aws:dynamodb:{}:{}:table/{}",
            self.region, self.account, self.table
        )
    }
    pub fn writer_arn(&self) -> String {
        format!("arn:aws:iam::{}:user/{}", self.account, self.writer)
    }
    pub fn tenant(&self) -> &str {
        &self.tenant
    }
    pub fn environment(&self) -> &str {
        &self.environment
    }
    pub fn generation(&self) -> &str {
        &self.generation
    }
    pub fn endpoint(&self) -> String {
        format!("https://dynamodb.{}.amazonaws.com:8001", self.region)
    }
}

impl EmailConfig {
    pub fn from_measured_env() -> Result<Option<Self>, AuthorityError> {
        Self::load(env)
    }
    fn load(
        read: impl Fn(&str) -> Result<String, AuthorityError>,
    ) -> Result<Option<Self>, AuthorityError> {
        let Some([region, account, sender, from, identity, configuration_set]) = read_optional(
            [
                "ESCROW_EMAIL_REGION",
                "ESCROW_EMAIL_ACCOUNT_ID",
                "ESCROW_EMAIL_SENDER_USER",
                "ESCROW_EMAIL_FROM",
                "ESCROW_EMAIL_IDENTITY",
                "ESCROW_EMAIL_CONFIGURATION_SET",
            ],
            read,
        )?
        else {
            return Ok(None);
        };
        if !region_account(&region, &account)
            || !label(&sender)
            || !label(&configuration_set)
            || !email_address(&from)
            || !dns_name(&identity)
            || from.split_once('@').map(|(_, d)| d) != Some(identity.as_str())
        {
            return Err(AuthorityError::Configuration);
        }
        Ok(Some(Self {
            region,
            account,
            sender,
            from,
            identity,
            configuration_set,
        }))
    }
    pub fn sender_arn(&self) -> String {
        format!("arn:aws:iam::{}:user/{}", self.account, self.sender)
    }
    pub fn identity_arn(&self) -> String {
        format!(
            "arn:aws:ses:{}:{}:identity/{}",
            self.region, self.account, self.identity
        )
    }
    pub fn endpoint(&self) -> String {
        format!("https://email.{}.amazonaws.com:8002", self.region)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn missing_optional_config_is_disabled_but_partial_config_is_an_error() {
        assert!(AuthorityConfig::load(|_| Ok(String::new()))
            .unwrap()
            .is_none());
        assert!(EmailConfig::load(|_| Ok(String::new())).unwrap().is_none());
        assert!(AuthorityConfig::load(|k| Ok(if k.ends_with("REGION") {
            "us-east-1"
        } else {
            ""
        }
        .into()))
        .is_err());
        assert!(EmailConfig::load(|k| Ok(if k.ends_with("FROM") {
            "recovery@staging.notify.learncard.com"
        } else {
            ""
        }
        .into()))
        .is_err());
    }
    #[test]
    fn endpoint_and_principal_injection_is_rejected() {
        assert!(!region_account("us-east-1.attacker.test", "123456789012"));
        assert!(!region_account("us-east-1", "123456789012:evil"));
        assert!(!label("../admin"));
        assert!(!email_address("x@example.com\r\nBcc: victim@test.com"));
        assert!(!email_address("Name <x@example.com>"));
        assert!(email_address("recovery@staging.notify.learncard.com"));
    }

    #[test]
    fn measured_values_pin_arns_and_are_forwarded_into_the_image() {
        let settings = std::collections::BTreeMap::from([
            ("ESCROW_AUTHORITY_REGION", "us-east-1"),
            ("ESCROW_AUTHORITY_ACCOUNT_ID", "123456789012"),
            ("ESCROW_AUTHORITY_TABLE", "authority"),
            ("ESCROW_AUTHORITY_WRITER_USER", "writer"),
            ("ESCROW_AUTHORITY_TENANT", "learncard"),
            ("ESCROW_AUTHORITY_ENVIRONMENT", "staging"),
            ("ESCROW_AUTHORITY_GENERATION", "g1"),
            (
                "ESCROW_AUTHORITY_CREDENTIAL_KMS_KEY_ARN",
                "arn:aws:kms:us-east-1:123456789012:key/00000000-1111-2222-3333-444444444444",
            ),
            ("ESCROW_EMAIL_REGION", "us-east-1"),
            ("ESCROW_EMAIL_ACCOUNT_ID", "123456789012"),
            ("ESCROW_EMAIL_SENDER_USER", "sender"),
            ("ESCROW_EMAIL_FROM", "recovery@staging.notify.learncard.com"),
            ("ESCROW_EMAIL_IDENTITY", "staging.notify.learncard.com"),
            ("ESCROW_EMAIL_CONFIGURATION_SET", "recovery"),
        ]);
        let read = |name: &str| Ok(settings.get(name).unwrap().to_string());
        let authority = AuthorityConfig::load(read).unwrap().unwrap();
        assert_eq!(
            authority.table_arn(),
            "arn:aws:dynamodb:us-east-1:123456789012:table/authority"
        );
        assert_eq!(
            authority.writer_arn(),
            "arn:aws:iam::123456789012:user/writer"
        );
        let email = EmailConfig::load(read).unwrap().unwrap();
        assert_eq!(
            email.identity_arn(),
            "arn:aws:ses:us-east-1:123456789012:identity/staging.notify.learncard.com"
        );
        for name in settings.keys() {
            assert!(include_str!("../../scripts/measurement-config.sh")
                .contains(&format!("${{{name}:-}}")));
            assert!(include_str!("../../Dockerfile").contains(&format!("ARG {name}=\"\"")));
            assert!(include_str!("../../Dockerfile").contains(&format!("{name}=${{{name}}}")));
            assert!(include_str!("../../scripts/build-eif.sh")
                .contains(&format!("--build-arg=\"{name}=${{{name}:-}}\"")));
        }
        assert!(EmailConfig::load(|name| Ok(if name == "ESCROW_EMAIL_FROM" {
            "recovery@wrong.example"
        } else {
            settings[name]
        }
        .to_owned()))
        .is_err());
    }
}
