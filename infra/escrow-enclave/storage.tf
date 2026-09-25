# =============================================================================
# escrow-enclave — S3 storage (P3.2)
#
# TWO buckets, not one, because aws_s3_bucket_object_lock_configuration's
# default_retention applies bucket-wide: an EIF and an audit record cannot
# safely share a bucket if only the audit record should be immutable for
# audit_retention_days. So EIFs go in `artifacts` (versioned, not locked,
# app can overwrite/delete a bad build) and ledger audit records go in
# `audit` (Object Lock COMPLIANCE mode — nothing, not even root, can shorten
# or delete retention early).
#
# Both buckets are encrypted with a SEPARATE CMK (aws_kms_key.s3 below) from
# the escrow CMK in kms.tf — this key protects data at rest in S3 using
# AWS's normal IAM-delegated model; it is NOT the attestation-gated escrow
# key and carries no RecipientAttestation conditions.
# =============================================================================

data "aws_iam_policy_document" "s3_kms_key_policy" {
  # Ordinary AWS-default delegation: unlike the escrow CMK (kms.tf), this
  # key protects routine S3 object encryption, not attested secret
  # material, so the standard "let IAM policies grant access" model is
  # appropriate here (the enclave_host/ledger_monitor grants in iam.tf rely
  # on this).
  statement {
    sid    = "EnableIAMUserPermissions"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = ["kms:*"]
    resources = ["*"]
  }
}

resource "aws_kms_key" "s3" {
  description             = "learncard escrow enclave (${var.environment}): SSE-KMS key for the audit + artifacts S3 buckets. Separate from the escrow CMK in kms.tf; delegates to IAM policies normally (no attestation gating)."
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy                  = data.aws_iam_policy_document.s3_kms_key_policy.json

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-s3-cmk" })
}

resource "aws_kms_alias" "s3" {
  name          = "alias/learncard-escrow-enclave-s3-${var.environment}"
  target_key_id = aws_kms_key.s3.key_id
}

locals {
  storage_buckets = {
    audit     = aws_s3_bucket.audit
    artifacts = aws_s3_bucket.artifacts
  }
}

# -----------------------------------------------------------------------
# audit bucket — Object Lock COMPLIANCE, ledger audit records only
# -----------------------------------------------------------------------

resource "aws_s3_bucket" "audit" {
  bucket              = "learncard-escrow-enclave-${var.environment}-${data.aws_caller_identity.current.account_id}-audit"
  object_lock_enabled = true

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-audit" })
}

resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    bucket_key_enabled = true

    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "audit" {
  bucket                  = aws_s3_bucket.audit.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_object_lock_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.audit_retention_days
    }
  }

  # Object Lock requires versioning already Enabled; explicit depends_on
  # avoids a race between the two separate (eventually consistent) API
  # calls on first creation.
  depends_on = [aws_s3_bucket_versioning.audit]
}

# -----------------------------------------------------------------------
# artifacts bucket — EIFs, versioned but NOT Object Lock'd (builds can be
# superseded/deleted; only the audit trail must be immutable)
# -----------------------------------------------------------------------

resource "aws_s3_bucket" "artifacts" {
  bucket = "learncard-escrow-enclave-${var.environment}-${data.aws_caller_identity.current.account_id}-artifacts"

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-artifacts" })
}

resource "aws_s3_bucket_versioning" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "artifacts" {
  bucket = aws_s3_bucket.artifacts.id

  rule {
    bucket_key_enabled = true

    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "artifacts" {
  bucket                  = aws_s3_bucket.artifacts.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# -----------------------------------------------------------------------
# Shared: deny any non-TLS request against either bucket
# -----------------------------------------------------------------------

data "aws_iam_policy_document" "deny_insecure_transport" {
  for_each = local.storage_buckets

  statement {
    sid    = "DenyInsecureTransport"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions = ["s3:*"]
    resources = [
      each.value.arn,
      "${each.value.arn}/*",
    ]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "deny_insecure_transport" {
  for_each = local.storage_buckets

  bucket = each.value.id
  policy = data.aws_iam_policy_document.deny_insecure_transport[each.key].json
}
