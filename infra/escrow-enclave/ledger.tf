# =============================================================================
# escrow-enclave — DynamoDB anti-replay ledger (P3.2)
#
# Implements decisions.md D3's option A: a signed, hash-chained ledger. This
# module only creates the two tables; the enclave-signed chain logic, the
# reserve/verify/commit semantics, and the actual TransactWriteItems calls
# live in the P3.3 parent binary and the P1 enclave app. Per D3, this is
# DETECTION of rollback, not prevention — the tables alone do not make that
# claim true; iam.tf's Deny on UpdateItem/DeleteItem for `records` is the
# Terraform-enforceable half of "append-only".
# =============================================================================

resource "aws_dynamodb_table" "records" {
  name         = "escrow-ledger-records-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"
  range_key    = "sk"

  # Append-only chain records (decisions.md D3: PK "HOLD#<id>",
  # SK "SEQ#<n>", attribute_not_exists condition on write). Deletion
  # protection is a second, independent guard against ever destroying this
  # table's data outside of an explicit two-step Terraform change.
  deletion_protection_enabled = true

  # Feeds the escrow-ledger-monitor Lambda (P7.1) so chain/divergence checks
  # run off new writes rather than polling.
  #
  # NEW_AND_OLD_IMAGES, not NEW_IMAGE: IAM cannot express "PutItem only if
  # the item doesn't already exist" (attribute_not_exists is a
  # ConditionExpression enforced by DynamoDB at write time, not an IAM
  # policy condition) — see iam.tf's DenyMutateLedgerRecords comment. A
  # caller with ordinary dynamodb:PutItem CAN silently overwrite an
  # existing record if the application code's condition expression is
  # ever missing or wrong. NEW_AND_OLD_IMAGES is what lets the P7.1
  # monitor tell overwrite apart from legitimate append: a real append
  # produces an INSERT stream event; the record table has no legitimate
  # UPDATE (blocked by IAM Deny) or REMOVE (also Denied) event under
  # correct operation, so the monitor MUST treat any MODIFY or REMOVE
  # event on this table's stream as tampering and alarm — see README's
  # "Records overwrite detection" note. NEW_IMAGE alone would still show
  # a MODIFY event but without the OLD image needed to prove the record's
  # signed content actually changed underneath it.
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "pk"
    type = "S"
  }

  attribute {
    name = "sk"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  # No server_side_encryption block: DynamoDB encrypts every table at rest
  # by default with an AWS owned key (free, always on since Nov 2018),
  # satisfying "SSE with AWS-owned or customer key". Switch to a
  # customer-managed key later by adding a server_side_encryption block
  # here if a future compliance requirement demands visibility/rotation
  # control over this table's specific key.
  tags = merge(local.common_tags, { Name = "escrow-ledger-records-${var.environment}" })
}

resource "aws_dynamodb_table" "heads" {
  name         = "escrow-ledger-heads-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "pk"

  # A mutable per-chain head pointer (PK "HOLD#<id>") that legitimately
  # advances on every new record — NOT append-only, unlike `records`.
  deletion_protection_enabled = true

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(local.common_tags, { Name = "escrow-ledger-heads-${var.environment}" })
}
