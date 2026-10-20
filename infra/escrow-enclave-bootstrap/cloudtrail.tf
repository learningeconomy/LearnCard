# Owned by bootstrap, not the workload: enable logging before the core apply.
# Names/ARNs are computed so no core-state read (or table existence) is required.
variable "authority_generations" {
  description = "All live/retained authority generations to audit. Add a new generation BEFORE creating its core table; retain old generations through retirement."
  type        = set(string)
  validation {
    condition     = length(var.authority_generations) > 0 && alltrue([for generation in var.authority_generations : can(regex("^[A-Za-z0-9_-]+$", generation))])
    error_message = "Supply at least one approved authority generation."
  }
}

variable "cloudtrail_retention_days" {
  description = "COMPLIANCE retention for new log versions. Staging may explicitly override; existing retention cannot be shortened."
  type        = number
  default     = 365
  validation {
    condition     = var.cloudtrail_retention_days >= 1 && var.cloudtrail_retention_days <= 36500 && floor(var.cloudtrail_retention_days) == var.cloudtrail_retention_days
    error_message = "Retention must be an integer from 1 to 36500 days."
  }
}

locals {
  trail_name           = "${local.name_prefix}-audit"
  trail_arn            = "arn:${local.partition}:cloudtrail:${var.aws_region}:${local.account_id}:trail/${local.trail_name}"
  trail_bucket_name    = "learncard-escrow-cloudtrail-${var.environment}-${local.account_id}"
  trail_bucket_arn     = "arn:${local.partition}:s3:::${local.trail_bucket_name}"
  trail_authority_arns = [for generation in sort(tolist(var.authority_generations)) : "arn:${local.partition}:dynamodb:${var.aws_region}:${local.account_id}:table/${local.name_prefix}-authority-${generation}"]
}

resource "aws_s3_bucket" "cloudtrail" {
  bucket              = local.trail_bucket_name
  object_lock_enabled = true
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_versioning" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_object_lock_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.cloudtrail_retention_days
    }
  }
  depends_on = [aws_s3_bucket_versioning.cloudtrail]
}

resource "aws_s3_bucket_public_access_block" "cloudtrail" {
  bucket                  = aws_s3_bucket.cloudtrail.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule { object_ownership = "BucketOwnerEnforced" }
}

resource "aws_kms_key" "cloudtrail" {
  description             = "Dedicated CloudTrail log encryption; MFA admin-only decryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Sid = "MfaAdminManagement", Effect = "Allow", Principal = { AWS = aws_iam_role.kms_admin.arn }, Resource = "*",
    Action = ["kms:DescribeKey", "kms:GetKeyPolicy", "kms:PutKeyPolicy", "kms:List*", "kms:UpdateKeyDescription", "kms:EnableKey", "kms:DisableKey", "kms:EnableKeyRotation", "kms:DisableKeyRotation", "kms:GetKeyRotationStatus", "kms:ScheduleKeyDeletion", "kms:CancelKeyDeletion", "kms:TagResource", "kms:UntagResource"] },
    { Sid = "CloudTrailEncryption", Effect = "Allow", Principal = { Service = "cloudtrail.amazonaws.com" }, Action = ["kms:GenerateDataKey*"], Resource = "*",
    Condition = { StringEquals = { "aws:SourceArn" = local.trail_arn }, StringLike = { "kms:EncryptionContext:aws:cloudtrail:arn" = local.trail_arn } } },
    { Sid = "CloudTrailDescribe", Effect = "Allow", Principal = { Service = "cloudtrail.amazonaws.com" }, Action = ["kms:DescribeKey"], Resource = "*", Condition = { StringEquals = { "aws:SourceArn" = local.trail_arn } } },
    { Sid = "MfaAdminDecrypt", Effect = "Allow", Principal = { AWS = aws_iam_role.kms_admin.arn }, Action = ["kms:Decrypt"], Resource = "*", Condition = { StringEquals = { "kms:EncryptionContext:aws:cloudtrail:arn" = local.trail_arn } } },
  ] })
  lifecycle { prevent_destroy = true }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = false
  }
}

resource "aws_s3_bucket_policy" "cloudtrail" {
  bucket = aws_s3_bucket.cloudtrail.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Sid = "CloudTrailAclCheck", Effect = "Allow", Principal = { Service = "cloudtrail.amazonaws.com" }, Action = "s3:GetBucketAcl", Resource = local.trail_bucket_arn, Condition = { StringEquals = { "aws:SourceArn" = local.trail_arn } } },
    { Sid = "CloudTrailDelivery", Effect = "Allow", Principal = { Service = "cloudtrail.amazonaws.com" }, Action = "s3:PutObject", Resource = "${local.trail_bucket_arn}/AWSLogs/${local.account_id}/*", Condition = { StringEquals = { "aws:SourceArn" = local.trail_arn, "s3:x-amz-acl" = "bucket-owner-full-control" } } },
    { Sid = "DenyOtherWriters", Effect = "Deny", Principal = "*", Action = ["s3:PutObject"], Resource = "${local.trail_bucket_arn}/*", Condition = { StringNotEqualsIfExists = { "aws:SourceArn" = local.trail_arn } } },
    { Sid = "DenyDeletes", Effect = "Deny", Principal = "*", Action = ["s3:DeleteObject", "s3:DeleteObjectVersion", "s3:DeleteBucket"], Resource = [local.trail_bucket_arn, "${local.trail_bucket_arn}/*"] },
    { Sid = "DenyInsecureTransport", Effect = "Deny", Principal = "*", Action = "s3:*", Resource = [local.trail_bucket_arn, "${local.trail_bucket_arn}/*"], Condition = { Bool = { "aws:SecureTransport" = "false" } } },
  ] })
  depends_on = [aws_s3_bucket_public_access_block.cloudtrail]
}

resource "aws_cloudtrail" "escrow" {
  name                          = local.trail_name
  s3_bucket_name                = aws_s3_bucket.cloudtrail.id
  kms_key_id                    = aws_kms_key.cloudtrail.arn
  is_multi_region_trail         = true
  include_global_service_events = true
  enable_log_file_validation    = true
  enable_logging                = true

  advanced_event_selector {
    name = "All management events including KMS reads and writes"
    field_selector {
      field  = "eventCategory"
      equals = ["Management"]
    }
  }
  advanced_event_selector {
    name = "Authority writes including batch transaction and PartiQL writes"
    field_selector {
      field  = "eventCategory"
      equals = ["Data"]
    }
    field_selector {
      field  = "resources.type"
      equals = ["AWS::DynamoDB::Table"]
    }
    field_selector {
      field  = "resources.ARN"
      equals = local.trail_authority_arns
    }
    # No eventName allowlist: includes all current/future write APIs, including
    # ExecuteStatement/BatchExecuteStatement/ExecuteTransaction when write-only.
    field_selector {
      field  = "readOnly"
      equals = ["false"]
    }
  }
  depends_on = [aws_s3_bucket_policy.cloudtrail, aws_s3_bucket_object_lock_configuration.cloudtrail, aws_s3_bucket_server_side_encryption_configuration.cloudtrail]
  lifecycle { prevent_destroy = true }
}

output "cloudtrail_arn" { value = aws_cloudtrail.escrow.arn }
output "cloudtrail_bucket_name" { value = aws_s3_bucket.cloudtrail.id }
output "cloudtrail_authority_table_arns" { value = local.trail_authority_arns }
