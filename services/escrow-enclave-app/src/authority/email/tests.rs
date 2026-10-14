use super::{fake::FakeEmailSender, EmailMessage, EmailSender};
use crate::authority::AuthorityError;

#[tokio::test]
async fn rejects_unknown_languages_before_any_send_is_recorded() {
    let sender = FakeEmailSender::default();
    let result = sender
        .send(
            "owner@example.com",
            "xx",
            EmailMessage::OneTimeCode {
                code: "12345678".into(),
            },
        )
        .await;
    assert!(matches!(result, Err(AuthorityError::InvalidRequest)));
    assert!(sender.sent.lock().unwrap().is_empty());
}

#[tokio::test]
async fn every_language_and_message_kind_renders_the_recovery_context_line_and_no_links() {
    for language in crate::crypto::RECOVERY_LANGUAGES {
        for message in [
            EmailMessage::OneTimeCode {
                code: "87654321".into(),
            },
            EmailMessage::RecoveryStarted,
            EmailMessage::ReleaseWarning { hours: 24 },
        ] {
            let sender = FakeEmailSender::default();
            sender
                .send("owner@example.com", language, message)
                .await
                .unwrap();
            let sent = sender.sent.lock().unwrap();
            let record = sent.last().unwrap();
            assert!(!record.subject.is_empty());
            assert!(!record.body.to_lowercase().contains("http"));
            assert!(!record.body.contains('<'));
            assert!(!record.body.is_empty());
        }
    }
}

#[tokio::test]
async fn the_one_time_code_appears_verbatim_in_its_own_message_body_only() {
    let sender = FakeEmailSender::default();
    sender
        .send(
            "owner@example.com",
            "en",
            EmailMessage::OneTimeCode {
                code: "11223344".into(),
            },
        )
        .await
        .unwrap();
    sender
        .send("owner@example.com", "en", EmailMessage::RecoveryStarted)
        .await
        .unwrap();
    sender
        .send(
            "owner@example.com",
            "en",
            EmailMessage::ReleaseWarning { hours: 24 },
        )
        .await
        .unwrap();
    let sent = sender.sent.lock().unwrap();
    assert!(sent[0].body.contains("11223344"));
    assert!(!sent[1].body.contains("11223344"));
    assert!(!sent[2].body.contains("11223344"));
    assert!(sent[2].body.contains("24"));
}

#[tokio::test]
async fn unknown_outcome_never_records_a_send_and_reject_is_distinguishable_from_it() {
    let sender = FakeEmailSender::default();
    sender
        .unknown
        .store(true, std::sync::atomic::Ordering::SeqCst);
    let result = sender
        .send("owner@example.com", "en", EmailMessage::RecoveryStarted)
        .await;
    assert!(matches!(result, Err(AuthorityError::UnknownOutcome)));
    assert!(sender.sent.lock().unwrap().is_empty());
    sender
        .unknown
        .store(false, std::sync::atomic::Ordering::SeqCst);
    sender
        .reject
        .store(true, std::sync::atomic::Ordering::SeqCst);
    let result = sender
        .send("owner@example.com", "en", EmailMessage::RecoveryStarted)
        .await;
    assert!(matches!(result, Err(AuthorityError::Rejected)));
    assert!(sender.sent.lock().unwrap().is_empty());
}
