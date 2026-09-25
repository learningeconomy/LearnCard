# =============================================================================
# escrow-enclave — IAM roles (P3.2)
#
# Two roles, two different trust boundaries:
#   - enclave_host: EC2 instance role for the ASG (compute.tf). Its escrow-CMK
#     grant here (kms:Decrypt/kms:Encrypt) is necessary but NOT sufficient —
#     the CMK's own key policy (kms.tf) is what actually gates Decrypt behind
#     a matching Nitro attestation. This role also holds the S3/DynamoDB
#     permissions the P3.3 parent binary needs.
#   - ledger_monitor: role for the P7.1 monitor Lambda (the function itself
#     is not created by this module; only a stable role ARN is). Read-only
#     on the ledger tables + audit bucket, NO escrow-CMK grant at all.
#
# The escrow-kms-admin role is intentionally NOT created here — see kms.tf
# and var.kms_admin_role_arn.
# =============================================================================

# -----------------------------------------------------------------------
# enclave-host: EC2 role + instance profile
# -----------------------------------------------------------------------

data "aws_iam_policy_document" "enclave_host_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "enclave_host" {
  name        = "${local.name_prefix}-host-role"
  description = "escrow-enclave-host EC2 instance role. kms:Decrypt on the escrow CMK additionally requires a matching Nitro attestation per the CMK's own key policy (kms.tf) — this role's grant alone does not permit reading escrow key material."

  assume_role_policy = data.aws_iam_policy_document.enclave_host_assume_role.json

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-host-role" })
}

resource "aws_iam_instance_profile" "enclave_host" {
  name = "${local.name_prefix}-host-profile"
  role = aws_iam_role.enclave_host.name

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-host-profile" })
}

data "aws_iam_policy_document" "enclave_host_permissions" {
  # Escrow CMK: Decrypt/Encrypt only. The attestation gate lives entirely in
  # kms.tf's key policy, not here.
  statement {
    sid       = "EscrowCmkDecryptEncrypt"
    effect    = "Allow"
    actions   = ["kms:Decrypt", "kms:Encrypt"]
    resources = [aws_kms_key.escrow.arn]
  }

  # SSE-KMS for S3: a DIFFERENT key from the escrow CMK (storage.tf's
  # aws_kms_key.s3). Needed for GetObject/PutObject against KMS-encrypted
  # buckets below; deliberately excludes the escrow CMK.
  statement {
    sid       = "S3BucketKmsUsage"
    effect    = "Allow"
    actions   = ["kms:Decrypt", "kms:GenerateDataKey", "kms:DescribeKey"]
    resources = [aws_kms_key.s3.arn]
  }

  # Artifacts bucket is single-purpose (EIFs only — storage.tf), so the
  # whole bucket IS the "EIF prefix": eif_s3_uri's own documented example
  # (variables.tf) uses a top-level key with no fixed sub-prefix, so
  # restricting to a "eif/*" key pattern here would reject that example.
  statement {
    sid       = "ReadEifArtifacts"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.artifacts.arn}/*"]
  }

  # Audit bucket: PutObject only, restricted to the audit/* key prefix that
  # decisions.md D3 already specifies for ledger audit records
  # (audit/<tenant>/<chainId>/<seq>-<hash>.cbor). No DeleteObject and no
  # unrestricted PutObject — Object Lock COMPLIANCE mode (storage.tf) is the
  # primary immutability control, this is defense in depth on top of it.
  statement {
    sid       = "WriteAuditRecords"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.audit.arn}/audit/*"]
  }

  # Ledger tables: the operations the P3.3 parent's HeadStore needs.
  statement {
    sid    = "LedgerReadWrite"
    effect = "Allow"
    actions = [
      "dynamodb:TransactWriteItems",
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:Query",
    ]
    resources = [aws_dynamodb_table.records.arn, aws_dynamodb_table.heads.arn]
  }

  # DynamoDB authorizes each action WITHIN a TransactWriteItems call
  # individually, against the table it targets (AWS's own "Using IAM with
  # DynamoDB transactions" doc: "Permissions for Put, Update, Delete, and
  # Get actions are governed by the permissions used for the underlying
  # PutItem/UpdateItem/DeleteItem/GetItem operations"). The head-advance
  # half of the ledger's append-record+advance-head transaction is an
  # `Update` on `heads` with a `ConditionExpression` (compare-and-swap on
  # the expected current seq/hash) — that needs `dynamodb:UpdateItem`
  # (LedgerReadWrite doesn't grant it, deliberately, since it's shared with
  # `records`). `dynamodb:ConditionCheckItem` is granted alongside it in
  # case the P3.3 parent's actual transaction shape gates the advance via
  # a standalone `ConditionCheck` transact-item on `heads` rather than
  # folding the condition into the `Update` itself — AWS's own docs are
  # explicit that `ConditionCheckItem` governs ONLY the `ConditionCheck`
  # transact-item type, not a `ConditionExpression` on Put/Update/Delete,
  # so this permission is a no-op unless P3.3 uses that shape; granting it
  # now avoids re-touching this policy once P3.3's exact transaction shape
  # is implemented. Scoped to `heads` ONLY — never add these to `records`.
  statement {
    sid       = "LedgerHeadsConditionalAdvance"
    effect    = "Allow"
    actions   = ["dynamodb:UpdateItem", "dynamodb:ConditionCheckItem"]
    resources = [aws_dynamodb_table.heads.arn]
  }

  # Records table is append-only by design (decisions.md D3): once written,
  # a record must never be mutated or removed by the host. The heads table
  # is a mutable pointer by design (each new record legitimately advances
  # it, via LedgerHeadsConditionalAdvance above) and is deliberately NOT
  # included in this Deny.
  #
  # This Deny applies EQUALLY whether UpdateItem/DeleteItem on `records` is
  # called standalone or as one action inside a TransactWriteItems call —
  # per the same AWS doc cited above, DynamoDB evaluates IAM permissions
  # for the underlying action name regardless of whether it's invoked
  # directly or as a transact-item, so there is no "inside a transaction"
  # loophole around this Deny. (PutItem CAN still overwrite an existing
  # `records` item — IAM has no way to require `attribute_not_exists`; see
  # ledger.tf's header comment and README's "Records overwrite detection"
  # note for why the records stream captures both images so the P7.1
  # monitor can catch this class of tampering instead.)
  statement {
    sid       = "DenyMutateLedgerRecords"
    effect    = "Deny"
    actions   = ["dynamodb:DeleteItem", "dynamodb:UpdateItem"]
    resources = [aws_dynamodb_table.records.arn]
  }

  # CloudWatch Logs: write-only to the P3.1 log group. The modern
  # PutLogEvents API (Feb 2021+) no longer needs a sequence token, so no
  # DescribeLogStreams grant is required.
  statement {
    sid       = "WriteEnclaveHostLogs"
    effect    = "Allow"
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.enclave_host.arn}:*"]
  }
}

resource "aws_iam_role_policy" "enclave_host" {
  name   = "${local.name_prefix}-host-policy"
  role   = aws_iam_role.enclave_host.id
  policy = data.aws_iam_policy_document.enclave_host_permissions.json
}

resource "aws_iam_role_policy_attachment" "enclave_host_ssm" {
  count = var.enable_ssm ? 1 : 0

  role       = aws_iam_role.enclave_host.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# -----------------------------------------------------------------------
# escrow-ledger-monitor: Lambda execution role (P7.1 creates the function;
# this module only creates a stable role ARN for kms.tf/storage.tf/
# ledger.tf's outputs to reference).
# -----------------------------------------------------------------------

data "aws_iam_policy_document" "ledger_monitor_assume_role" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ledger_monitor" {
  name        = "${local.name_prefix}-ledger-monitor-role"
  description = "escrow-ledger-monitor Lambda execution role: read-only on both ledger tables + the records stream, read on the audit bucket. Deliberately holds NO permission on the escrow CMK (kms.tf) — a compromised monitor cannot decrypt escrow key material."

  assume_role_policy = data.aws_iam_policy_document.ledger_monitor_assume_role.json

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-ledger-monitor-role" })
}

resource "aws_iam_role_policy_attachment" "ledger_monitor_basic_execution" {
  role       = aws_iam_role.ledger_monitor.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

data "aws_iam_policy_document" "ledger_monitor_permissions" {
  statement {
    sid    = "ReadLedgerTables"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:Query",
      "dynamodb:Scan",
      "dynamodb:DescribeTable",
    ]
    resources = [aws_dynamodb_table.records.arn, aws_dynamodb_table.heads.arn]
  }

  statement {
    sid    = "ReadLedgerRecordsStream"
    effect = "Allow"
    actions = [
      "dynamodb:DescribeStream",
      "dynamodb:GetRecords",
      "dynamodb:GetShardIterator",
      "dynamodb:ListStreams",
    ]
    resources = [aws_dynamodb_table.records.stream_arn]
  }

  statement {
    sid       = "ReadAuditRecords"
    effect    = "Allow"
    actions   = ["s3:GetObject"]
    resources = ["${aws_s3_bucket.audit.arn}/audit/*"]
  }

  # List (not just Get) is needed to enumerate what exists under audit/* to
  # compare against DynamoDB — scoped to that prefix via the s3:prefix
  # condition rather than granted bucket-wide.
  statement {
    sid       = "ListAuditPrefix"
    effect    = "Allow"
    actions   = ["s3:ListBucket"]
    resources = [aws_s3_bucket.audit.arn]

    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["audit/*"]
    }
  }

  statement {
    sid       = "ReadAuditBucketKmsUsage"
    effect    = "Allow"
    actions   = ["kms:Decrypt", "kms:DescribeKey"]
    resources = [aws_kms_key.s3.arn]
  }

  # cloudwatch:PutMetricData has no resource-level scoping in the AWS IAM
  # action reference — Resource must be "*" for this action regardless of
  # principal; this is not a wildcard-action grant.
  statement {
    sid       = "PublishMetrics"
    effect    = "Allow"
    actions   = ["cloudwatch:PutMetricData"]
    resources = ["*"]
  }

  dynamic "statement" {
    for_each = var.ledger_monitor_sns_topic_arn == null ? [] : [var.ledger_monitor_sns_topic_arn]

    content {
      sid       = "PublishAlarms"
      effect    = "Allow"
      actions   = ["sns:Publish"]
      resources = [statement.value]
    }
  }
}

resource "aws_iam_role_policy" "ledger_monitor" {
  name   = "${local.name_prefix}-ledger-monitor-policy"
  role   = aws_iam_role.ledger_monitor.id
  policy = data.aws_iam_policy_document.ledger_monitor_permissions.json
}
