use super::{fake::FakeEmailSender, EmailMessage, EmailSender};
use crate::authority::AuthorityError;

#[tokio::test]
async fn rejects_unknown_languages_before_any_send_is_recorded() {
    let sender = FakeEmailSender::default();
    let result = sender
        .send(
            "owner@example.com",
            "xx",
            None,
            EmailMessage::OneTimeCode {
                code: "12345678".into(),
            },
        )
        .await;
    assert!(matches!(result, Err(AuthorityError::InvalidRequest)));
    assert!(sender.sent.lock().unwrap().is_empty());
}

#[tokio::test]
async fn every_language_and_message_kind_renders_a_nonempty_message_with_no_links_and_within_ses_caps(
) {
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
                .send("owner@example.com", language, None, message)
                .await
                .unwrap();
            let sent = sender.sent.lock().unwrap();
            let record = sent.last().unwrap();
            assert!(!record.subject.is_empty());
            assert!(!record.body.is_empty());
            assert!(!record.body.to_lowercase().contains("http"));
            assert!(!record.body.contains('<'));
            // Same caps `SesEmailClient::send_email` enforces (aws.rs); the
            // fake doesn't call the real client, so check them here too.
            assert!(record.subject.len() <= 256);
            assert!(record.body.len() <= 16_384);
        }
    }
}

#[tokio::test]
async fn only_the_one_time_code_message_carries_the_code_and_its_code_line() {
    for (index, language) in crate::crypto::RECOVERY_LANGUAGES.iter().enumerate() {
        let sender = FakeEmailSender::default();
        sender
            .send(
                "owner@example.com",
                language,
                None,
                EmailMessage::OneTimeCode {
                    code: "11223344".into(),
                },
            )
            .await
            .unwrap();
        let sent = sender.sent.lock().unwrap();
        let record = sent.last().unwrap();
        assert!(record.body.contains("11223344"));
        // P9.1 (attack C): the code-specific line belongs only here, not on
        // the other two message kinds (that was the bug: it used to be
        // appended to every message, even ones with no code to enter).
        assert!(record.body.contains(super::CODE_LINE[index]));
    }
}

#[tokio::test]
async fn started_and_warning_messages_never_mention_a_code_and_tell_the_user_how_to_cancel() {
    // "code"/"código" catch the English/Spanish/French spelling (French
    // reuses the English word); "رمز" is the Arabic word for code/symbol.
    // None of these may leak into RecoveryStarted/ReleaseWarning: those
    // messages contain no code at all.
    let code_markers = ["code", "código", "رمز"];
    for (index, language) in crate::crypto::RECOVERY_LANGUAGES.iter().enumerate() {
        for message in [
            EmailMessage::RecoveryStarted,
            EmailMessage::ReleaseWarning { hours: 24 },
        ] {
            let sender = FakeEmailSender::default();
            sender
                .send("owner@example.com", language, None, message)
                .await
                .unwrap();
            let sent = sender.sent.lock().unwrap();
            let record = sent.last().unwrap();
            assert!(!record.body.contains("11223344"));
            let lower = record.body.to_lowercase();
            for marker in code_markers {
                assert!(
                    !lower.contains(&marker.to_lowercase()),
                    "language {language} leaked code wording {marker:?}: {}",
                    record.body
                );
            }
            // Required meaning: tell the user how to stop an unexpected
            // recovery, naming the brand and the app (no links, by design).
            assert!(record
                .body
                .contains(&super::cancel_line(index, super::brand_name("learncard"))));
        }
    }
    // ReleaseWarning also keeps its own completes-in-N-hours sentence.
    let sender = FakeEmailSender::default();
    sender
        .send(
            "owner@example.com",
            "en",
            None,
            EmailMessage::ReleaseWarning { hours: 24 },
        )
        .await
        .unwrap();
    let sent = sender.sent.lock().unwrap();
    assert!(sent.last().unwrap().body.contains("24"));
}

#[test]
fn brand_name_maps_known_tenants_and_falls_back_to_the_raw_label_otherwise() {
    assert_eq!(super::brand_name("learncard"), "LearnCard");
    assert_eq!(super::brand_name("scouts"), "ScoutPass");
    assert_eq!(super::brand_name("some-other-tenant"), "some-other-tenant");
}

#[test]
fn unmapped_tenant_labels_surface_unchanged_in_subject_and_body() {
    // D21: the label-derived brand is now the fallback for blobs with no
    // (valid) sealed brand; `display_brand` resolves it before rendering.
    let message = EmailMessage::OneTimeCode { code: "1".into() };
    let brand = super::display_brand(None, "some-other-tenant");
    let subj = super::subject(&message, 0, brand);
    let body = super::body(&message, 0, brand);
    assert!(subj.contains("some-other-tenant"));
    assert!(body.contains("some-other-tenant"));
    // The known mapping actually changes the rendered copy (not a no-op).
    let brand = super::display_brand(None, "learncard");
    assert!(super::subject(&message, 0, brand).contains("LearnCard"));
    assert!(super::body(&message, 0, brand).contains("LearnCard"));
}

#[test]
fn spanish_and_french_copy_uses_proper_accents_not_ascii_transliteration() {
    for message in [
        EmailMessage::OneTimeCode { code: "1".into() },
        EmailMessage::RecoveryStarted,
        EmailMessage::ReleaseWarning { hours: 1 },
    ] {
        for index in [1usize, 2usize] {
            let subj = super::subject(&message, index, "LearnCard");
            let body = super::body(&message, index, "LearnCard");
            assert!(
                subj.bytes().any(|b| b > 0x7F) || body.bytes().any(|b| b > 0x7F),
                "expected an accented character for language index {index}: subject={subj:?} body={body:?}"
            );
        }
    }
}

#[tokio::test]
async fn unknown_outcome_never_records_a_send_and_reject_is_distinguishable_from_it() {
    let sender = FakeEmailSender::default();
    sender
        .unknown
        .store(true, std::sync::atomic::Ordering::SeqCst);
    let result = sender
        .send(
            "owner@example.com",
            "en",
            None,
            EmailMessage::RecoveryStarted,
        )
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
        .send(
            "owner@example.com",
            "en",
            None,
            EmailMessage::RecoveryStarted,
        )
        .await;
    assert!(matches!(result, Err(AuthorityError::Rejected)));
    assert!(sender.sent.lock().unwrap().is_empty());
}

#[test]
fn display_brand_uses_only_an_exactly_canonical_sealed_brand_and_otherwise_the_label() {
    use super::display_brand;
    assert_eq!(display_brand(Some("VetPass"), "learncard"), "VetPass");
    assert_eq!(display_brand(None, "learncard"), "LearnCard");
    assert_eq!(display_brand(None, "scouts"), "ScoutPass");
    // Invalid, and valid-but-not-canonical (normalize would have rewritten
    // it): both fall back rather than render unchecked text.
    for sealed in [
        "",
        "www example",
        "Vet\r\nPass",
        "Vet\u{202e}Pass",
        "a.b",
        " VetPass",
        "Vet  Pass",
    ] {
        assert_eq!(
            display_brand(Some(sealed), "learncard"),
            "LearnCard",
            "{sealed:?}"
        );
    }
}

// D21 byte-budget proof: the longest allowed brand, in every language and
// message kind, stays within the SES caps `aws.rs` enforces, with no CR/LF
// in the subject (so the release warning's fail-closed send can never be
// triggered through the brand) and no links or markup in the body.
#[tokio::test]
async fn the_longest_allowed_sealed_brand_renders_within_ses_caps_everywhere() {
    let brand = "Aa".repeat(crate::crypto::MAX_RECOVERY_BRAND_CHARS / 2);
    assert_eq!(brand.len(), crate::crypto::MAX_RECOVERY_BRAND_CHARS);
    for (index, language) in crate::crypto::RECOVERY_LANGUAGES.iter().enumerate() {
        for message in [
            EmailMessage::OneTimeCode {
                code: "87654321".into(),
            },
            EmailMessage::RecoveryStarted,
            EmailMessage::ReleaseWarning { hours: 24 },
        ] {
            let carries_cancel_line = !matches!(message, EmailMessage::OneTimeCode { .. });
            let sender = FakeEmailSender::default();
            sender
                .send("owner@example.com", language, Some(&brand), message)
                .await
                .unwrap();
            let sent = sender.sent.lock().unwrap();
            let record = sent.last().unwrap();
            assert_eq!(record.brand, brand);
            assert!(record.subject.contains(&brand));
            assert!(record.subject.len() <= 256);
            assert!(!record.subject.contains(['\r', '\n']));
            assert!(record.body.len() <= 16_384);
            assert!(!record.body.to_lowercase().contains("http"));
            assert!(!record.body.contains('<'));
            if carries_cancel_line {
                assert!(record.body.contains(&super::cancel_line(index, &brand)));
            }
        }
    }
}
