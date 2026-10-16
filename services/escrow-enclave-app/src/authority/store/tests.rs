use super::{
    fake::{FakeDatabase, WriteFault},
    *,
};

/// Run unchanged against the fake and the actual AWS-protocol adapter below.
pub(super) async fn backend_contract(store: &dyn AuthorityStore) {
    enroll(store).await;
    for i in 0..10 {
        let request = format!("attempt-{i}");
        let before = store.load(&binding(), &request, None).await.unwrap();
        let a = reserve(before.clone(), &request).unwrap();
        let b = reserve(before, &format!("loser-{i}")).unwrap();
        let ticket = a.ticket();
        let (winner, loser) = tokio::join!(store.commit(a), store.commit(b));
        assert!(matches!(winner.unwrap(), CommitOutcome::Applied(_)));
        assert!(matches!(loser.unwrap(), CommitOutcome::Conflict));
        assert!(matches!(
            store.reconcile(&ticket).await.unwrap(),
            CommitOutcome::Reconciled(_)
        ));
    }
    let snapshot = store.load(&binding(), "eleventh", None).await.unwrap();
    assert_eq!(snapshot.enrollment.as_ref().unwrap().pin.attempts_used, 10);
    assert!(reserve(snapshot, "eleventh").is_err());
}

#[tokio::test]
async fn fake_satisfies_shared_backend_contract() {
    backend_contract(&FakeDatabase::default().store(scope())).await;
}

fn scope() -> Scope {
    Scope::new("learncard".into(), "g1".into()).unwrap()
}
fn binding() -> Binding {
    Binding {
        tenant: "learncard".into(),
        generation: "g1".into(),
        did_hash: [1; 32],
    }
}
fn counter(value: u64) -> Counter {
    Counter::try_from(value).unwrap()
}
fn empty() -> Snapshot {
    Snapshot {
        enrollment: None,
        operation: None,
        hold: None,
    }
}
fn initial() -> EnrollmentItem {
    let vectors: serde_json::Value = serde_json::from_str(include_str!(
        "../../../../../packages/sss-key-manager/src/__fixtures__/escrow-vectors.json"
    ))
    .unwrap();
    let envelope = serde_json::from_value(vectors["blobs"][1]["envelope"].clone()).unwrap();
    EnrollmentItem {
        revisions: Revisions {
            operation: counter(1),
            enrollment: counter(1),
        },
        epoch: counter(1),
        pin: PinState {
            generation: counter(1),
            configured: true,
            attempts_used: 0,
        },
        intent_digest: [2; 32],
        enrollment: EnrollmentStatus::Active {
            blob: Box::new(ActiveBlob {
                identity: crate::crypto::escrow_blob_identity(&envelope).unwrap(),
                envelope,
                share_version: 42,
                chain_head: None,
                rewrap_delegated: true,
            }),
        },
    }
}
fn operation(
    id: &str,
    revisions: Revisions,
    kind: OperationKind,
    outcome: OperationOutcome,
) -> OperationItem {
    OperationItem {
        request_id: id.into(),
        execution_id: [0; 16],
        kind,
        outcome,
        revisions,
        request_digest: [3; 32],
        proposed_event: vec![4],
    }
}
fn enrollment_transition() -> Transition {
    let value = initial();
    Transition::prepare(
        binding(),
        empty(),
        value.clone(),
        operation(
            "enroll",
            value.revisions,
            OperationKind::Enroll,
            OperationOutcome::Committed,
        ),
        None,
    )
    .unwrap()
}
async fn enroll(store: &dyn AuthorityStore) {
    assert!(matches!(
        store.commit(enrollment_transition()).await.unwrap(),
        CommitOutcome::Applied(_)
    ));
}
fn reserve(before: Snapshot, request: &str) -> Result<Transition, Error> {
    let mut next = before.enrollment.clone().unwrap();
    next.revisions = next.revisions.advance(false)?;
    next.pin.attempts_used += 1;
    let op = operation(
        request,
        next.revisions,
        OperationKind::PinAttempt,
        OperationOutcome::Reserved,
    );
    Transition::prepare(binding(), before, next, op, None)
}

#[tokio::test]
async fn bootstrap_persists_envelope_operation_and_immutable_execution_receipt() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    let plan = enrollment_transition();
    let ticket = plan.ticket();
    assert!(matches!(
        store.commit(plan).await.unwrap(),
        CommitOutcome::Applied(_)
    ));
    let loaded = store.load(&binding(), "enroll", None).await.unwrap();
    assert!(loaded.enrollment.unwrap() == initial());
    assert!(loaded.operation.unwrap().execution_id == ticket.receipt.execution_id);
    let restarted = db.store(scope());
    assert!(matches!(
        restarted.reconcile(&ticket).await.unwrap(),
        CommitOutcome::Reconciled(_)
    ));
    assert!(matches!(
        restarted.commit(enrollment_transition()).await.unwrap(),
        CommitOutcome::Conflict
    ));
}

#[tokio::test]
async fn concurrent_stores_share_ten_reservations_with_no_local_budget() {
    let db = FakeDatabase::default();
    enroll(&db.store(scope())).await;
    let mut tasks = Vec::new();
    for i in 0..24 {
        let db = db.clone();
        tasks.push(tokio::spawn(async move {
            let store = db.store(scope());
            let request = format!("pin-{i}");
            loop {
                let snapshot = store.load(&binding(), &request, None).await.unwrap();
                if snapshot.enrollment.as_ref().unwrap().pin.attempts_used == PIN_BUDGET {
                    return false;
                }
                let plan = reserve(snapshot, &request).unwrap();
                tokio::task::yield_now().await;
                match store.commit(plan).await.unwrap() {
                    CommitOutcome::Applied(_) => return true,
                    CommitOutcome::Conflict => continue,
                    _ => panic!("unexpected ambiguity"),
                }
            }
        }));
    }
    let mut spent = 0;
    for task in tasks {
        spent += usize::from(task.await.unwrap());
    }
    assert_eq!(spent, 10);
    assert_eq!(
        db.store(scope())
            .load(&binding(), "unused", None)
            .await
            .unwrap()
            .enrollment
            .unwrap()
            .pin
            .attempts_used,
        10
    );
}

#[tokio::test]
async fn reservation_replay_and_restart_never_create_a_fresh_execution_permit() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    enroll(&store).await;
    let before = store.load(&binding(), "pin", None).await.unwrap();
    let plan = reserve(before.clone(), "pin").unwrap();
    let ticket = plan.ticket();
    db.fail_next_write(WriteFault::AfterCommit).unwrap();
    assert!(matches!(
        store.commit(plan).await.unwrap(),
        CommitOutcome::Reconciled(_)
    ));
    let restarted = db.store(scope());
    // Fresh IDs and no AWS token cache: permanent request/receipt rows still win.
    assert!(matches!(
        restarted
            .commit(reserve(before, "pin").unwrap())
            .await
            .unwrap(),
        CommitOutcome::Conflict
    ));
    let current = restarted.load(&binding(), "pin", None).await.unwrap();
    assert_eq!(current.enrollment.as_ref().unwrap().pin.attempts_used, 1);
    assert!(reserve(current, "pin").is_err());
    assert!(matches!(
        restarted.reconcile(&ticket).await.unwrap(),
        CommitOutcome::Reconciled(_)
    ));
}

#[tokio::test]
async fn absence_after_timeout_is_unknown_and_a_late_commit_is_reconciled() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    enroll(&store).await;
    for fault in [WriteFault::BeforeCommit, WriteFault::DelayedCommit] {
        let plan = reserve(store.load(&binding(), "pin", None).await.unwrap(), "pin").unwrap();
        let ticket = plan.ticket();
        db.fail_next_write(fault).unwrap();
        assert!(matches!(
            store.commit(plan).await.unwrap(),
            CommitOutcome::Unknown
        ));
        assert!(matches!(
            store.reconcile(&ticket).await.unwrap(),
            CommitOutcome::Unknown
        ));
        db.complete_delayed().unwrap();
        if store
            .load(&binding(), "pin", None)
            .await
            .unwrap()
            .operation
            .is_some()
        {
            assert!(matches!(
                store.reconcile(&ticket).await.unwrap(),
                CommitOutcome::Reconciled(_)
            ));
        } else {
            assert!(matches!(
                store.reconcile(&ticket).await.unwrap(),
                CommitOutcome::Unknown
            ));
        }
    }
    assert_eq!(
        store
            .load(&binding(), "pin", None)
            .await
            .unwrap()
            .enrollment
            .unwrap()
            .pin
            .attempts_used,
        1
    );
}

#[tokio::test]
async fn failed_readback_keeps_spent_attempt_and_reconciliation_is_never_applied() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    enroll(&store).await;
    let plan = reserve(store.load(&binding(), "pin", None).await.unwrap(), "pin").unwrap();
    let ticket = plan.ticket();
    db.fail_next_read().unwrap();
    assert!(matches!(
        store.commit(plan).await.unwrap(),
        CommitOutcome::Unknown
    ));
    assert!(matches!(
        db.store(scope()).reconcile(&ticket).await.unwrap(),
        CommitOutcome::Reconciled(_)
    ));
    assert_eq!(
        store
            .load(&binding(), "pin", None)
            .await
            .unwrap()
            .enrollment
            .unwrap()
            .pin
            .attempts_used,
        1
    );
}

#[tokio::test]
async fn competing_revision_fences_a_delayed_write_atomically() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    enroll(&store).await;
    let before = store.load(&binding(), "late", None).await.unwrap();
    let late = reserve(before.clone(), "late").unwrap();
    let ticket = late.ticket();
    db.fail_next_write(WriteFault::DelayedCommit).unwrap();
    assert!(matches!(
        store.commit(late).await.unwrap(),
        CommitOutcome::Unknown
    ));
    assert!(matches!(
        store
            .commit(reserve(before, "winner").unwrap())
            .await
            .unwrap(),
        CommitOutcome::Applied(_)
    ));
    assert!(matches!(
        store.reconcile(&ticket).await.unwrap(),
        CommitOutcome::Conflict
    ));
    assert!(db.complete_delayed().is_err());
    let current = store.load(&binding(), "late", None).await.unwrap();
    assert!(current.operation.is_none());
    assert_eq!(current.enrollment.unwrap().pin.attempts_used, 1);
}

#[tokio::test]
async fn only_one_result_can_replace_a_reservation_and_no_refund_is_allowed() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    enroll(&store).await;
    let plan = reserve(store.load(&binding(), "pin", None).await.unwrap(), "pin").unwrap();
    let reservation = plan.ticket();
    store.commit(plan).await.unwrap();
    let before = store.load(&binding(), "pin", None).await.unwrap();
    let mut after = before.enrollment.clone().unwrap();
    after.revisions = after.revisions.advance(false).unwrap();
    let result = operation(
        "pin",
        after.revisions,
        OperationKind::PinAttempt,
        OperationOutcome::Compared { matched: false },
    );
    let first = Transition::prepare(
        binding(),
        before.clone(),
        after.clone(),
        result.clone(),
        None,
    )
    .unwrap();
    let loser = Transition::prepare(
        binding(),
        before.clone(),
        after.clone(),
        result.clone(),
        None,
    )
    .unwrap();
    assert!(matches!(
        store.commit(first).await.unwrap(),
        CommitOutcome::Applied(_)
    ));
    assert!(matches!(
        store.commit(loser).await.unwrap(),
        CommitOutcome::Conflict
    ));
    assert!(matches!(
        store.reconcile(&reservation).await.unwrap(),
        CommitOutcome::Reconciled(_)
    ));
    after.pin.attempts_used = 0;
    assert!(Transition::prepare(binding(), before, after, result, None).is_err());
}

#[tokio::test]
async fn scope_mismatch_and_empty_recovery_state_do_not_bootstrap() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    assert!(store
        .load(&binding(), "pin", None)
        .await
        .unwrap()
        .enrollment
        .is_none());
    for bad in [
        Binding {
            generation: "g2".into(),
            ..binding()
        },
        Binding {
            tenant: "other".into(),
            ..binding()
        },
    ] {
        assert!(store.load(&bad, "pin", None).await.is_err());
    }
    let plan = reserve(
        Snapshot {
            enrollment: Some(initial()),
            ..empty()
        },
        "pin",
    )
    .unwrap();
    assert!(matches!(
        store.commit(plan).await.unwrap(),
        CommitOutcome::Unknown
    ));
    assert!(store
        .load(&binding(), "pin", None)
        .await
        .unwrap()
        .enrollment
        .is_none());
}

#[tokio::test]
async fn holds_commit_with_account_and_terminal_rows_cannot_be_reopened() {
    let db = FakeDatabase::default();
    let store = db.store(scope());
    enroll(&store).await;
    let before = store
        .load(&binding(), "create", Some("hold"))
        .await
        .unwrap();
    let mut after = before.enrollment.clone().unwrap();
    after.revisions = after.revisions.advance(false).unwrap();
    let hold = HoldItem {
        hold_id: "hold".into(),
        enrollment_version: counter(1),
        epoch: counter(1),
        blob_identity: [5; 32],
        signed_hold_digest: [6; 32],
        created_revision: after.revisions.operation,
        updated_revision: after.revisions.operation,
        status: HoldStatus::Pending,
    };
    let create = Transition::prepare(
        binding(),
        before,
        after.clone(),
        operation(
            "create",
            after.revisions,
            OperationKind::CreateHold,
            OperationOutcome::Committed,
        ),
        Some(hold),
    )
    .unwrap();
    store.commit(create).await.unwrap();
    let before = store
        .load(&binding(), "cancel", Some("hold"))
        .await
        .unwrap();
    after.revisions = after.revisions.advance(false).unwrap();
    let mut hold = before.hold.clone().unwrap();
    hold.updated_revision = after.revisions.operation;
    hold.status = HoldStatus::Cancelled;
    let cancel = Transition::prepare(
        binding(),
        before.clone(),
        after.clone(),
        operation(
            "cancel",
            after.revisions,
            OperationKind::Cancel,
            OperationOutcome::Committed,
        ),
        Some(hold.clone()),
    )
    .unwrap();
    hold.status = HoldStatus::Released;
    let release = Transition::prepare(
        binding(),
        before,
        after.clone(),
        operation(
            "release",
            after.revisions,
            OperationKind::Release,
            OperationOutcome::Committed,
        ),
        Some(hold),
    )
    .unwrap();
    assert!(matches!(
        store.commit(cancel).await.unwrap(),
        CommitOutcome::Applied(_)
    ));
    assert!(matches!(
        store.commit(release).await.unwrap(),
        CommitOutcome::Conflict
    ));
    let before = store
        .load(&binding(), "reopen", Some("hold"))
        .await
        .unwrap();
    let mut hold = before.hold.clone().unwrap();
    hold.status = HoldStatus::Pending;
    after.revisions = after.revisions.advance(false).unwrap();
    hold.updated_revision = after.revisions.operation;
    assert!(Transition::prepare(
        binding(),
        before,
        after.clone(),
        operation(
            "reopen",
            after.revisions,
            OperationKind::CreateHold,
            OperationOutcome::Committed
        ),
        Some(hold)
    )
    .is_err());
}

#[test]
fn execution_ids_are_generated_and_plan_digest_binds_every_write() {
    let a = enrollment_transition();
    let b = enrollment_transition();
    assert!(a.ticket.receipt.execution_id != b.ticket.receipt.execution_id);
    assert!(a.ticket.receipt.transaction_digest != b.ticket.receipt.transaction_digest);
    let mut writes = a.writes[..a.writes.len() - 1].to_vec();
    assert!(digest(&writes) == a.ticket.receipt.transaction_digest);
    writes[0].expected = Some(Vec::new());
    assert!(digest(&writes) != a.ticket.receipt.transaction_digest);
}
