# =============================================================================
# escrow-enclave-bootstrap: one-off, per-account prerequisites for the
# escrow-enclave-network and escrow-enclave stacks.
#
# - Terraform state bucket (versioned, KMS-encrypted, TLS-only, S3 native locking)
# - escrow-kms-admin role, assumable only with an MFA-authenticated session
# - IAM users for the humans who hold that role (no inline access; MFA enforced)
# - Alarm SNS topic with an email subscription
#
# First apply runs with local state (this stack creates the state bucket);
# afterwards the state is migrated into that bucket with
# `terraform init -migrate-state -backend-config=backend-<env>.hcl`.
# Run with the account's OrganizationAccountAccessRole (profile escrow-staging).
# =============================================================================

terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "learncard-escrow-enclave"
      ManagedBy   = "terraform"
      Environment = var.environment
      Stack       = "bootstrap"
    }
  }
}

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  account_id  = data.aws_caller_identity.current.account_id
  partition   = data.aws_partition.current.partition
  name_prefix = "escrow-enclave-${var.environment}"
}

# -----------------------------------------------------------------------------
# Terraform state bucket
# -----------------------------------------------------------------------------

resource "aws_s3_bucket" "tfstate" {
  bucket = "learncard-escrow-tfstate-${var.environment}-${local.account_id}"
}

resource "aws_s3_bucket_versioning" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "tfstate" {
  bucket                  = aws_s3_bucket.tfstate.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

data "aws_iam_policy_document" "tfstate_bucket" {
  statement {
    sid     = "DenyInsecureTransport"
    effect  = "Deny"
    actions = ["s3:*"]
    resources = [
      aws_s3_bucket.tfstate.arn,
      "${aws_s3_bucket.tfstate.arn}/*",
    ]
    principals {
      type        = "*"
      identifiers = ["*"]
    }
    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }
}

resource "aws_s3_bucket_policy" "tfstate" {
  bucket = aws_s3_bucket.tfstate.id
  policy = data.aws_iam_policy_document.tfstate_bucket.json

  depends_on = [aws_s3_bucket_public_access_block.tfstate]
}

# -----------------------------------------------------------------------------
# escrow-kms-admin role
#
# The escrow CMK's key policy grants this role the admin action list and
# denies kms:PutKeyPolicy to any session without aws:MultiFactorAuthPresent.
# SSO and OrganizationAccountAccessRole sessions don't carry that flag, so
# the only working path is an IAM user signing in with MFA, then assuming
# this role (which requires MFA at assume time too).
# -----------------------------------------------------------------------------

data "aws_iam_policy_document" "kms_admin_trust" {
  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [for u in aws_iam_user.kms_admin : u.arn]
    }
    condition {
      test     = "Bool"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["true"]
    }
    condition {
      test     = "NumericLessThan"
      variable = "aws:MultiFactorAuthAge"
      values   = ["3600"]
    }
  }
}

resource "aws_iam_role" "kms_admin" {
  name                 = "escrow-kms-admin"
  description          = "Two-person-controlled administration of the escrow CMK and escrow Terraform applies. Assumable only by the listed IAM users with MFA."
  assume_role_policy   = data.aws_iam_policy_document.kms_admin_trust.json
  max_session_duration = 3600
}

# Terraform plan/apply for the escrow stacks needs broad account access; the
# CMK itself is additionally governed by its own key policy (kms.tf), which is
# the only authorization source for key administration.
resource "aws_iam_role_policy_attachment" "kms_admin_administrator" {
  role       = aws_iam_role.kms_admin.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/AdministratorAccess"
}

# -----------------------------------------------------------------------------
# Human IAM users who may assume escrow-kms-admin
#
# No permissions beyond managing their own MFA/credentials and assuming the
# role; everything else is denied until an MFA device is registered. Access
# keys and console passwords are created by the human, not by Terraform, so no
# secret ever lands in state.
# -----------------------------------------------------------------------------

resource "aws_iam_user" "kms_admin" {
  for_each = toset(var.kms_admin_users)

  name          = each.value
  force_destroy = false
}

data "aws_iam_policy_document" "kms_admin_user" {
  statement {
    sid    = "ManageOwnCredentialsAndMfa"
    effect = "Allow"
    actions = [
      "iam:GetUser",
      "iam:ListUserTags",
      "iam:ChangePassword",
      "iam:GetLoginProfile",
      "iam:CreateAccessKey",
      "iam:DeleteAccessKey",
      "iam:ListAccessKeys",
      "iam:UpdateAccessKey",
      "iam:GetAccessKeyLastUsed",
      "iam:ListSigningCertificates",
      "iam:ListSSHPublicKeys",
      "iam:ListServiceSpecificCredentials",
      "iam:EnableMFADevice",
      "iam:ResyncMFADevice",
      "iam:ListMFADevices",
      "iam:GetMFADevice",
    ]
    resources = ["arn:${local.partition}:iam::${local.account_id}:user/$${aws:username}"]
  }

  statement {
    sid    = "ManageVirtualMfaDevices"
    effect = "Allow"
    actions = [
      "iam:CreateVirtualMFADevice",
      "iam:DeleteVirtualMFADevice",
      "iam:TagMFADevice",
    ]
    resources = ["arn:${local.partition}:iam::${local.account_id}:mfa/*"]
  }

  statement {
    sid    = "ConsoleAccountReads"
    effect = "Allow"
    actions = [
      "iam:ListVirtualMFADevices",
      "iam:GetAccountPasswordPolicy",
      "iam:GetAccountSummary",
      "iam:ListAccountAliases",
    ]
    resources = ["*"]
  }

  statement {
    sid       = "AssumeEscrowKmsAdmin"
    effect    = "Allow"
    actions   = ["sts:AssumeRole"]
    resources = [aws_iam_role.kms_admin.arn]
  }

  statement {
    sid    = "DenyEverythingElseWithoutMfa"
    effect = "Deny"
    not_actions = [
      "iam:GetUser",
      "iam:ChangePassword",
      "iam:GetLoginProfile",
      "iam:ListUserTags",
      "iam:CreateVirtualMFADevice",
      "iam:DeleteVirtualMFADevice",
      "iam:TagMFADevice",
      "iam:EnableMFADevice",
      "iam:GetMFADevice",
      "iam:ListMFADevices",
      "iam:ListVirtualMFADevices",
      "iam:ResyncMFADevice",
      "sts:GetSessionToken",
    ]
    resources = ["*"]
    condition {
      test     = "BoolIfExists"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }
}

resource "aws_iam_user_policy" "kms_admin_user" {
  for_each = aws_iam_user.kms_admin

  name   = "escrow-kms-admin-user"
  user   = each.value.name
  policy = data.aws_iam_policy_document.kms_admin_user.json
}

# -----------------------------------------------------------------------------
# Alarm topic
# -----------------------------------------------------------------------------

resource "aws_sns_topic" "alarms" {
  name              = "${local.name_prefix}-alarms"
  kms_master_key_id = "alias/aws/sns"
}

data "aws_iam_policy_document" "alarms_topic" {
  statement {
    sid     = "AllowAccountAndCloudWatch"
    effect  = "Allow"
    actions = ["sns:Publish"]
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com", "events.amazonaws.com"]
    }
    resources = [aws_sns_topic.alarms.arn]
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
  }

  statement {
    sid     = "AllowAccountPrincipals"
    effect  = "Allow"
    actions = ["sns:Publish", "sns:GetTopicAttributes", "sns:Subscribe"]
    principals {
      type        = "AWS"
      identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
    }
    resources = [aws_sns_topic.alarms.arn]
  }
}

resource "aws_sns_topic_policy" "alarms" {
  arn    = aws_sns_topic.alarms.arn
  policy = data.aws_iam_policy_document.alarms_topic.json
}

resource "aws_sns_topic_subscription" "alarm_email" {
  for_each = toset(var.alarm_emails)

  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = each.value
}
