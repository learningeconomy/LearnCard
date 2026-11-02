# Per-environment canary inbox. This stack NEVER owns a receipt rule set or the
# active rule set: those live in infra/escrow-canary-inbox (one per account and
# region, shared by staging and production). Applying or destroying this
# environment touches only its own rules, bucket and key.
locals {
  inbox_rule_prefix = "${local.name}-inbox-hold-"
  inbox_rules       = var.inbox_enabled ? { for index in range(12) : format("hold-%02d", index + 1) => index + 1 } : {}
  inbox_source_arn  = "arn:aws:ses:${var.aws_region}:${var.monitoring_account_id}:receipt-rule-set/${var.inbox_rule_set_name}:receipt-rule/${local.inbox_rule_prefix}*"
}

data "aws_ses_active_receipt_rule_set" "current" {
  count = var.inbox_enabled ? 1 : 0
}

resource "aws_kms_key" "inbox" {
  count                   = var.inbox_enabled ? 1 : 0
  description             = "Canary inbox (${var.environment}) raw recovery emails"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    # Account administration and IAM-delegated use (the runner's decrypt is granted in IAM, via S3 only).
    { Sid = "Account", Effect = "Allow", Principal = { AWS = "arn:aws:iam::${var.monitoring_account_id}:root" }, Action = "kms:*", Resource = "*" },
    { Sid       = "SesReceiptRules", Effect = "Allow", Principal = { Service = "ses.amazonaws.com" }, Action = ["kms:GenerateDataKey*", "kms:Decrypt"], Resource = "*",
      Condition = { StringEquals = { "aws:SourceAccount" = var.monitoring_account_id }, ArnLike = { "aws:SourceArn" = local.inbox_source_arn } }
    }
  ] })
}
resource "aws_kms_alias" "inbox" {
  count         = var.inbox_enabled ? 1 : 0
  name          = "alias/${local.name}-inbox"
  target_key_id = aws_kms_key.inbox[0].key_id
}

resource "aws_s3_bucket" "inbox" {
  count  = var.inbox_enabled ? 1 : 0
  bucket = "${local.name}-inbox-${var.monitoring_account_id}"
}
resource "aws_s3_bucket_ownership_controls" "inbox" {
  count  = var.inbox_enabled ? 1 : 0
  bucket = aws_s3_bucket.inbox[0].id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}
resource "aws_s3_bucket_public_access_block" "inbox" {
  count                   = var.inbox_enabled ? 1 : 0
  bucket                  = aws_s3_bucket.inbox[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
# UNVERIFIED in staging: SES writing through a customer-managed key via bucket
# default encryption. Documented fallback: sse_algorithm = "AES256".
resource "aws_s3_bucket_server_side_encryption_configuration" "inbox" {
  count  = var.inbox_enabled ? 1 : 0
  bucket = aws_s3_bucket.inbox[0].id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.inbox[0].arn
    }
    bucket_key_enabled = true
  }
}
resource "aws_s3_bucket_lifecycle_configuration" "inbox" {
  count  = var.inbox_enabled ? 1 : 0
  bucket = aws_s3_bucket.inbox[0].id
  rule {
    id     = "short-retention"
    status = "Enabled"
    filter {}
    expiration {
      days = 7
    }
    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}
resource "aws_s3_bucket_policy" "inbox" {
  count  = var.inbox_enabled ? 1 : 0
  bucket = aws_s3_bucket.inbox[0].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Sid       = "SesReceiptRulesOnly", Effect = "Allow", Principal = { Service = "ses.amazonaws.com" }, Action = "s3:PutObject",
      Resource  = "${aws_s3_bucket.inbox[0].arn}/inbox/*",
      Condition = { StringEquals = { "aws:SourceAccount" = var.monitoring_account_id }, ArnLike = { "aws:SourceArn" = local.inbox_source_arn } }
    },
    { Sid       = "TlsOnly", Effect = "Deny", Principal = "*", Action = "s3:*",
      Resource  = [aws_s3_bucket.inbox[0].arn, "${aws_s3_bucket.inbox[0].arn}/*"],
      Condition = { Bool = { "aws:SecureTransport" = "false" } }
    }
  ] })
  depends_on = [aws_s3_bucket_public_access_block.inbox]
}

# One rule per pool address with an EXACT plus-addressed recipient (a plus-labelled
# recipient matches only itself), writing to that account's own prefix. Mail to any
# other address matches no rule and is dropped. No kms_key_arn: that is SES
# client-side encryption, which the Node runner cannot decrypt.
resource "aws_ses_receipt_rule" "inbox" {
  for_each      = local.inbox_rules
  name          = "${local.inbox_rule_prefix}${format("%02d", each.value)}"
  rule_set_name = var.inbox_rule_set_name
  recipients    = ["${var.inbox_local_part}+${each.value}@${var.inbox_domain}"]
  enabled       = true
  scan_enabled  = true
  tls_policy    = "Require"
  s3_action {
    bucket_name       = aws_s3_bucket.inbox[0].bucket
    object_key_prefix = "inbox/${each.key}/"
    position          = 1
  }
  lifecycle {
    # Both environments add rules to one shared set; ordering is irrelevant (each
    # rule matches distinct recipients, no stop actions), so never fight over it.
    ignore_changes = [after]
    precondition {
      condition     = data.aws_ses_active_receipt_rule_set.current[0].rule_set_name == var.inbox_rule_set_name
      error_message = "The shared rule set is not active in this account/region. Apply infra/escrow-canary-inbox first."
    }
  }
  depends_on = [aws_s3_bucket_policy.inbox, aws_s3_bucket_server_side_encryption_configuration.inbox, aws_kms_key.inbox]
}
