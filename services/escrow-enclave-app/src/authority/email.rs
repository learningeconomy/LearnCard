//! P9.1 (attack C): compiled recovery-email templates and the enclave-side
//! sender trait. Real sends go through `SesEmailClient` (authority/aws.rs,
//! `kms`-gated); tests use an in-memory fake. Wording is measured-image
//! content, never host input: callers pass only language + interpolated
//! values (code/tenant/hours), never subject or body text.
use super::AuthorityError as Error;
use crate::crypto::RECOVERY_LANGUAGES;
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

/// Every message explicitly tells the recipient recovery is self-service, so an
/// unexpected email (attack C: an attacker who only controls the recipient key,
/// not the inbox) is immediately recognizable as not theirs to act on.
const CONTEXT_LINE: [&str; 4] = [
    "Only enter this code if you started this recovery. If you did not, ignore this email.",
    "Introduce este codigo solo si tu iniciaste esta recuperacion. Si no fuiste tu, ignora este correo.",
    "Ne saisissez ce code que si vous avez demande cette recuperation. Sinon, ignorez cet e-mail.",
    "أدخل هذا الرمز فقط إذا بدأت عملية استرداد الحساب. إذا لم تفعل ذلك، تجاهل هذه الرسالة.",
];

fn language_index(language: &str) -> Result<usize, Error> {
    RECOVERY_LANGUAGES
        .iter()
        .position(|l| *l == language)
        .ok_or(Error::InvalidRequest)
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

fn subject(message: &EmailMessage, index: usize) -> &'static str {
    match (message, index) {
        (EmailMessage::OneTimeCode { .. }, 0) => "Your account recovery code",
        (EmailMessage::OneTimeCode { .. }, 1) => "Tu codigo de recuperacion de cuenta",
        (EmailMessage::OneTimeCode { .. }, 2) => "Votre code de recuperation de compte",
        (EmailMessage::OneTimeCode { .. }, 3) => "رمز استعادة الحساب",
        (EmailMessage::RecoveryStarted, 0) => "Account recovery started",
        (EmailMessage::RecoveryStarted, 1) => "Recuperacion de cuenta iniciada",
        (EmailMessage::RecoveryStarted, 2) => "Recuperation de compte demarree",
        (EmailMessage::RecoveryStarted, 3) => "تم بدء استعادة الحساب",
        (EmailMessage::ReleaseWarning { .. }, 0) => "Your account recovery completes soon",
        (EmailMessage::ReleaseWarning { .. }, 1) => {
            "Tu recuperacion de cuenta se completara pronto"
        }
        (EmailMessage::ReleaseWarning { .. }, 2) => {
            "Votre recuperation de compte se terminera bientot"
        }
        (EmailMessage::ReleaseWarning { .. }, 3) => "ستكتمل استعادة حسابك قريبًا",
        _ => unreachable!("every (kind, index) pair above is exhaustive for 4 languages"),
    }
}

/// `tenant`: the measured `ESCROW_AUTHORITY_TENANT` label (there is no richer
/// enclave-side branding config); interpolated as plain text only, never HTML.
fn body(message: &EmailMessage, index: usize, tenant: &str) -> String {
    let context = CONTEXT_LINE[index];
    match (message, index) {
        (EmailMessage::OneTimeCode { code }, 0) => {
            format!("Your {tenant} recovery code is: {code}\n\n{context}")
        }
        (EmailMessage::OneTimeCode { code }, 1) => {
            format!("Tu codigo de recuperacion de {tenant} es: {code}\n\n{context}")
        }
        (EmailMessage::OneTimeCode { code }, 2) => {
            format!("Votre code de recuperation {tenant} est : {code}\n\n{context}")
        }
        (EmailMessage::OneTimeCode { code }, 3) => {
            format!("رمز استعادة حساب {tenant} الخاص بك هو: {code}\n\n{context}")
        }
        (EmailMessage::RecoveryStarted, 0) => {
            format!("Account recovery has started for your {tenant} account.\n\n{context}")
        }
        (EmailMessage::RecoveryStarted, 1) => {
            format!("Se ha iniciado la recuperacion de tu cuenta de {tenant}.\n\n{context}")
        }
        (EmailMessage::RecoveryStarted, 2) => {
            format!("La recuperation de votre compte {tenant} a demarre.\n\n{context}")
        }
        (EmailMessage::RecoveryStarted, 3) => {
            format!("تم بدء استعادة حساب {tenant} الخاص بك.\n\n{context}")
        }
        (EmailMessage::ReleaseWarning { hours }, 0) => {
            format!(
                "Your {tenant} account recovery will complete in about {hours} hours unless you cancel it.\n\n{context}"
            )
        }
        (EmailMessage::ReleaseWarning { hours }, 1) => {
            format!(
                "Tu recuperacion de cuenta de {tenant} se completara en unas {hours} horas, a menos que la canceles.\n\n{context}"
            )
        }
        (EmailMessage::ReleaseWarning { hours }, 2) => {
            format!(
                "Votre recuperation de compte {tenant} se terminera dans environ {hours} heures, sauf annulation.\n\n{context}"
            )
        }
        (EmailMessage::ReleaseWarning { hours }, 3) => {
            format!("ستكتمل استعادة حساب {tenant} خلال حوالي {hours} ساعة ما لم تقم بإلغائها.\n\n{context}")
        }
        _ => unreachable!("every (kind, index) pair above is exhaustive for 4 languages"),
    }
}

pub type EmailFuture<'a> = Pin<Box<dyn Future<Output = Result<(), Error>> + Send + 'a>>;

/// Dormant-credential-backed in production; swapped for an in-memory fake in
/// tests. `recipient`/`language` are untrusted request-adjacent values (the
/// language ultimately comes from the decrypted blob); `message` is always
/// enclave-constructed, never host-supplied subject/body text.
pub trait EmailSender: Send + Sync {
    fn send<'a>(
        &'a self,
        recipient: &'a str,
        language: &'a str,
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
        message: EmailMessage,
    ) -> EmailFuture<'a> {
        Box::pin(async move {
            // The recipient already passed `EscrowBlobPlaintext::normalize`'s
            // stricter shape check when the enclave decrypted it; no second,
            // looser email-shape check is layered on here.
            let index = language_index(language)?;
            let text = body(&message, index, &self.tenant);
            self.client
                .send_email(recipient, subject(&message, index), &text)
                .await?;
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
        pub subject: &'static str,
        pub body: String,
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
            message: EmailMessage,
        ) -> EmailFuture<'a> {
            Box::pin(async move {
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
                self.sent.lock().unwrap().push(Sent {
                    recipient: recipient.to_owned(),
                    language: language.to_owned(),
                    subject: subject(&message, index),
                    body: body(&message, index, "learncard"),
                    code,
                });
                Ok(())
            })
        }
    }
}

#[cfg(test)]
mod tests;
