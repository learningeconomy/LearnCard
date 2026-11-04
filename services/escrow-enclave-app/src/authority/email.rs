//! P9.1 (attack C): compiled recovery-email templates and the enclave-side
//! sender trait. Real sends go through `SesEmailClient` (authority/aws.rs,
//! `kms`-gated); tests use an in-memory fake. Wording is measured-image
//! content, never host input: callers pass only language + interpolated
//! values (code/brand/hours), never subject or body text. The brand is either
//! the owner-sealed `recoveryBrand` from the decrypted blob (D21, re-checked by
//! `display_brand`) or, as a fallback, derived from the measured tenant label.
use super::AuthorityError as Error;
use crate::crypto::{canonical_brand, RECOVERY_LANGUAGES};
use std::{future::Future, pin::Pin};

#[cfg(feature = "kms")]
use super::{
    aws::{DedicatedCredentials, SesEmailClient},
    config::EmailConfig,
};
#[cfg(feature = "kms")]
use crate::time::TimeSource;
#[cfg(feature = "kms")]
use std::sync::Arc;

/// Maps the measured `ESCROW_AUTHORITY_TENANT` label to a short display name
/// for user-facing copy. Plain text only, never HTML. Unknown labels fall
/// back to the label unchanged; the label's own character-set/length
/// validation happens in `config.rs`, not here. Since D21 this is only the
/// fallback for blobs with no (valid) owner-sealed brand.
fn brand_name(tenant: &str) -> &str {
    match tenant {
        "learncard" => "LearnCard",
        "scouts" => "ScoutPass",
        other => other,
    }
}

/// D21: the brand actually rendered. The sealed value is used only if it is
/// already exactly canonical (normalize has run on every decrypt, so this is
/// belt and braces against a future path that skips it); anything else falls
/// back to the measured label's `brand_name`.
fn display_brand<'a>(sealed: Option<&'a str>, tenant: &'a str) -> &'a str {
    match sealed {
        Some(s) if canonical_brand(s).as_deref() == Some(s) => s,
        _ => brand_name(tenant),
    }
}

/// SES `SendEmail` payload caps the real client enforces before sending
/// (`SesEmailClient::send_email`): a non-empty subject of at most 256 bytes
/// with no CR/LF, and a non-empty plain-text body of at most 16 KiB. Shared
/// with the test fake so a template or sealed brand (D21) that would make the
/// real send fail also fails in tests.
pub(crate) fn ses_payload_ok(subject: &str, text: &str) -> bool {
    !subject.is_empty()
        && subject.len() <= 256
        && !subject.contains(['\r', '\n'])
        && !text.is_empty()
        && text.len() <= 16_384
}

fn language_index(language: &str) -> Result<usize, Error> {
    RECOVERY_LANGUAGES
        .iter()
        .position(|l| *l == language)
        .ok_or(Error::InvalidRequest)
}

/// `OneTimeCode` only: the one line that lets a recipient who did not start
/// recovery recognize the email as not theirs to act on (attack C). The
/// other two message kinds use `cancel_line` instead: they carry no code, so
/// "enter this code" would be meaningless there.
const CODE_LINE: [&str; 4] = [
    "Only enter this code if you started this recovery. If you didn't, ignore this email. Your account stays safe.",
    "Introduce este código solo si tú iniciaste esta recuperación. Si no fuiste tú, ignora este correo. Tu cuenta sigue segura.",
    "Saisissez ce code uniquement si vous avez démarré cette récupération. Sinon, ignorez cet e-mail. Votre compte reste en sécurité.",
    "أدخل هذا الرمز فقط إذا بدأت هذه العملية. إذا لم تفعل ذلك، فتجاهل هذه الرسالة. حسابك يبقى آمنًا.",
];

/// `RecoveryStarted` and `ReleaseWarning`: tells a recipient who did not
/// start recovery how to stop it (attack C). These emails are plain text
/// with no links by design, so the instruction points at the app itself
/// rather than a URL.
fn cancel_line(index: usize, brand: &str) -> String {
    match index {
        0 => format!(
            "If you didn't start this, open the {brand} app and cancel the recovery right away."
        ),
        1 => format!(
            "Si no fuiste tú quien inició esto, abre la aplicación de {brand} y cancela la recuperación de inmediato."
        ),
        2 => format!(
            "Si vous n'avez pas démarré cette opération, ouvrez l'application {brand} et annulez la récupération immédiatement."
        ),
        3 => format!("إذا لم تبدأ هذه العملية، فافتح تطبيق {brand} وألغِ عملية الاسترداد فورًا."),
        _ => unreachable!("every index above is exhaustive for 4 languages"),
    }
}

/// Compiled-image content only: no links, no images, no raw host strings.
pub enum EmailMessage {
    /// Hold creation: a fresh CSPRNG one-time code the recipient must relay
    /// back through `confirm-hold` before the waiting period starts.
    OneTimeCode { code: String },
    /// Hold confirmation: the waiting period has now started.
    RecoveryStarted,
    /// `send-release-warning`: release is authorized in roughly `hours` hours
    /// unless cancelled.
    ReleaseWarning { hours: u32 },
}

/// `brand`: already resolved by `display_brand`; interpolated as plain text
/// only, never HTML.
fn subject(message: &EmailMessage, index: usize, brand: &str) -> String {
    match (message, index) {
        (EmailMessage::OneTimeCode { .. }, 0) => format!("Your {brand} recovery code"),
        (EmailMessage::OneTimeCode { .. }, 1) => format!("Tu código de recuperación de {brand}"),
        (EmailMessage::OneTimeCode { .. }, 2) => format!("Votre code de récupération {brand}"),
        (EmailMessage::OneTimeCode { .. }, 3) => format!("رمز استعادة حساب {brand} الخاص بك"),
        (EmailMessage::RecoveryStarted, 0) => format!("Your {brand} account recovery has started"),
        (EmailMessage::RecoveryStarted, 1) => {
            format!("Tu recuperación de cuenta de {brand} ha comenzado")
        }
        (EmailMessage::RecoveryStarted, 2) => {
            format!("La récupération de votre compte {brand} a démarré")
        }
        (EmailMessage::RecoveryStarted, 3) => format!("تم بدء استعادة حساب {brand} الخاص بك"),
        (EmailMessage::ReleaseWarning { .. }, 0) => format!("Your {brand} recovery completes soon"),
        (EmailMessage::ReleaseWarning { .. }, 1) => {
            format!("Tu recuperación de cuenta de {brand} se completará pronto")
        }
        (EmailMessage::ReleaseWarning { .. }, 2) => {
            format!("Votre récupération de compte {brand} se terminera bientôt")
        }
        (EmailMessage::ReleaseWarning { .. }, 3) => {
            format!("ستكتمل استعادة حساب {brand} الخاص بك قريبًا")
        }
        _ => unreachable!("every (kind, index) pair above is exhaustive for 4 languages"),
    }
}

/// `brand`: already resolved by `display_brand` (owner-sealed D21 brand, or
/// the measured tenant label's fallback); interpolated as plain text only,
/// never HTML.
fn body(message: &EmailMessage, index: usize, brand: &str) -> String {
    match (message, index) {
        (EmailMessage::OneTimeCode { code }, 0) => {
            format!("Your {brand} recovery code is: {code}\n\n{}", CODE_LINE[0])
        }
        (EmailMessage::OneTimeCode { code }, 1) => format!(
            "Tu código de recuperación de {brand} es: {code}\n\n{}",
            CODE_LINE[1]
        ),
        (EmailMessage::OneTimeCode { code }, 2) => format!(
            "Votre code de récupération {brand} est : {code}\n\n{}",
            CODE_LINE[2]
        ),
        (EmailMessage::OneTimeCode { code }, 3) => format!(
            "رمز استعادة حساب {brand} الخاص بك هو: {code}\n\n{}",
            CODE_LINE[3]
        ),
        (EmailMessage::RecoveryStarted, 0) => format!(
            "Account recovery has started for your {brand} account.\n\n{}",
            cancel_line(0, brand)
        ),
        (EmailMessage::RecoveryStarted, 1) => format!(
            "Se ha iniciado la recuperación de tu cuenta de {brand}.\n\n{}",
            cancel_line(1, brand)
        ),
        (EmailMessage::RecoveryStarted, 2) => format!(
            "La récupération de votre compte {brand} a démarré.\n\n{}",
            cancel_line(2, brand)
        ),
        (EmailMessage::RecoveryStarted, 3) => format!(
            "تم بدء استعادة حساب {brand} الخاص بك.\n\n{}",
            cancel_line(3, brand)
        ),
        (EmailMessage::ReleaseWarning { hours }, 0) => format!(
            "Your {brand} account recovery will complete in about {hours} hours unless you cancel it.\n\n{}",
            cancel_line(0, brand)
        ),
        (EmailMessage::ReleaseWarning { hours }, 1) => format!(
            "Tu recuperación de cuenta de {brand} se completará en unas {hours} horas, a menos que la canceles.\n\n{}",
            cancel_line(1, brand)
        ),
        (EmailMessage::ReleaseWarning { hours }, 2) => format!(
            "Votre récupération de compte {brand} se terminera dans environ {hours} heures, sauf annulation.\n\n{}",
            cancel_line(2, brand)
        ),
        (EmailMessage::ReleaseWarning { hours }, 3) => format!(
            "ستكتمل استعادة حساب {brand} خلال حوالي {hours} ساعة ما لم تقم بإلغائها.\n\n{}",
            cancel_line(3, brand)
        ),
        _ => unreachable!("every (kind, index) pair above is exhaustive for 4 languages"),
    }
}

pub type EmailFuture<'a> = Pin<Box<dyn Future<Output = Result<(), Error>> + Send + 'a>>;

/// Dormant-credential-backed in production; swapped for an in-memory fake in
/// tests. `recipient`/`language`/`brand` are untrusted request-adjacent values
/// (all come from the decrypted blob; `brand` is re-checked by
/// `display_brand`); `message` is always enclave-constructed, never
/// host-supplied subject/body text.
pub trait EmailSender: Send + Sync {
    fn send<'a>(
        &'a self,
        recipient: &'a str,
        language: &'a str,
        brand: Option<&'a str>,
        message: EmailMessage,
    ) -> EmailFuture<'a>;
}

#[cfg(feature = "kms")]
pub struct SesEmailSender {
    client: SesEmailClient,
    tenant: String,
}

#[cfg(feature = "kms")]
impl SesEmailSender {
    pub fn new(
        config: EmailConfig,
        credentials: DedicatedCredentials,
        time: Arc<dyn TimeSource>,
        tenant: String,
    ) -> Result<Self, Error> {
        Ok(Self {
            client: SesEmailClient::new(config, credentials, time)?,
            tenant,
        })
    }
}

#[cfg(feature = "kms")]
impl EmailSender for SesEmailSender {
    fn send<'a>(
        &'a self,
        recipient: &'a str,
        language: &'a str,
        brand: Option<&'a str>,
        message: EmailMessage,
    ) -> EmailFuture<'a> {
        Box::pin(async move {
            // The recipient already passed `EscrowBlobPlaintext::normalize`'s
            // stricter shape check when the enclave decrypted it; no second,
            // looser email-shape check is layered on here.
            let index = language_index(language)?;
            let brand = display_brand(brand, &self.tenant);
            let text = body(&message, index, brand);
            let subj = subject(&message, index, brand);
            self.client.send_email(recipient, &subj, &text).await?;
            Ok(())
        })
    }
}

#[cfg(any(test, feature = "fake-authority"))]
pub mod fake {
    use super::*;
    use std::sync::Mutex;

    pub struct Sent {
        pub recipient: String,
        pub language: String,
        pub subject: String,
        pub body: String,
        /// The brand actually rendered (after `display_brand`).
        pub brand: String,
        /// Test-only introspection: the raw code, when this was `OneTimeCode`.
        /// Production code never extracts this back out of a sent message.
        pub code: Option<String>,
    }

    /// Records every call for assertions; never silently drops a send. Set
    /// `unknown` to make every subsequent send return `Error::UnknownOutcome`
    /// (an ambiguous SES outcome), matching the real client's one-shot-call
    /// contract: the hold must not advance on an unknown outcome.
    #[derive(Default)]
    pub struct FakeEmailSender {
        pub sent: Mutex<Vec<Sent>>,
        pub unknown: std::sync::atomic::AtomicBool,
        pub reject: std::sync::atomic::AtomicBool,
    }

    impl EmailSender for FakeEmailSender {
        fn send<'a>(
            &'a self,
            recipient: &'a str,
            language: &'a str,
            brand: Option<&'a str>,
            message: EmailMessage,
        ) -> EmailFuture<'a> {
            Box::pin(async move {
                let brand = display_brand(brand, "learncard");
                let index = language_index(language)?;
                if self.unknown.load(std::sync::atomic::Ordering::SeqCst) {
                    return Err(Error::UnknownOutcome);
                }
                if self.reject.load(std::sync::atomic::Ordering::SeqCst) {
                    return Err(Error::Rejected);
                }
                let code = match &message {
                    EmailMessage::OneTimeCode { code } => Some(code.clone()),
                    EmailMessage::RecoveryStarted | EmailMessage::ReleaseWarning { .. } => None,
                };
                let subject = subject(&message, index, brand);
                let body = body(&message, index, brand);
                // Same payload caps as the real SES client, so the fake
                // cannot accept a send production would refuse.
                if !ses_payload_ok(&subject, &body) {
                    return Err(Error::InvalidRequest);
                }
                self.sent.lock().unwrap().push(Sent {
                    recipient: recipient.to_owned(),
                    language: language.to_owned(),
                    subject,
                    body,
                    brand: brand.to_owned(),
                    code,
                });
                Ok(())
            })
        }
    }
}

#[cfg(test)]
mod tests;
