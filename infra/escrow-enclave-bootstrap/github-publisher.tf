# Bootstrap owns IAM only; the core root retains sole ownership of the artifacts
# bucket policy and storage CMK. No remote-state lookup or bucket mutation needed.
locals {
  publisher_bucket_arn = "arn:${local.partition}:s3:::learncard-escrow-enclave-${var.environment}-${local.account_id}-artifacts"
  publisher_object_arn = "${local.publisher_bucket_arn}/eif/*"
  github_provider_arn  = "arn:${local.partition}:iam::${local.account_id}:oidc-provider/token.actions.githubusercontent.com"
}

resource "aws_iam_openid_connect_provider" "github_publisher" {
  count = var.enable_github_publisher && var.github_oidc_provider_arn == null ? 1 : 0

  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # AWS validates GitHub against its trusted CA library; no TLS lookup/thumbprint.
}

data "aws_iam_policy_document" "github_publisher_trust" {
  count = var.enable_github_publisher ? 1 : 0

  statement {
    effect  = "Allow"
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [coalesce(var.github_oidc_provider_arn, local.github_provider_arn)]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:learningeconomy/LearnCard:environment:escrow-production"]
    }
  }
}

resource "aws_iam_role" "github_publisher" {
  count = var.enable_github_publisher ? 1 : 0

  name                 = "${local.name_prefix}-github-publisher"
  description          = "GitHub production EIF create-only publishing and readback; no infrastructure administration."
  assume_role_policy   = data.aws_iam_policy_document.github_publisher_trust[0].json
  max_session_duration = 3600

  depends_on = [aws_iam_openid_connect_provider.github_publisher]

  lifecycle {
    precondition {
      condition     = var.github_oidc_provider_arn == null || var.github_oidc_provider_arn == local.github_provider_arn
      error_message = "The existing GitHub OIDC provider must belong to this account."
    }
    precondition {
      condition     = var.publisher_storage_kms_key_arn == null || startswith(coalesce(var.publisher_storage_kms_key_arn, "disabled"), "arn:${local.partition}:kms:${var.aws_region}:${local.account_id}:key/")
      error_message = "The storage CMK must belong to this account and region."
    }
  }
}

data "aws_iam_policy_document" "github_publisher" {
  count = var.enable_github_publisher ? 1 : 0

  statement {
    sid       = "CreateEifArtifactsOnly"
    effect    = "Allow"
    actions   = ["s3:PutObject"]
    resources = [local.publisher_object_arn]
    condition {
      test     = "StringEquals"
      variable = "s3:if-none-match"
      values   = ["*"]
    }
  }
  # Explicit deny also closes unconditional writes if another policy grants Put.
  statement {
    sid       = "DenyNonCreateEifWrites"
    effect    = "Deny"
    actions   = ["s3:PutObject"]
    resources = [local.publisher_object_arn]
    condition {
      test     = "StringNotEquals"
      variable = "s3:if-none-match"
      values   = ["*"]
    }
  }
  statement {
    sid       = "ReadBackEifArtifactsOnly"
    effect    = "Allow"
    actions   = ["s3:GetObject"] # Also authorizes HeadObject; no ListBucket needed.
    resources = [local.publisher_object_arn]
  }
  dynamic "statement" {
    for_each = var.publisher_storage_kms_key_arn == null ? [] : [var.publisher_storage_kms_key_arn]
    content {
      sid       = "ArtifactStorageEncryptionOnly"
      effect    = "Allow"
      actions   = ["kms:GenerateDataKey", "kms:Decrypt"] # SSE-KMS upload + GET readback, not Encrypt.
      resources = [statement.value]
      condition {
        test     = "StringEquals"
        variable = "kms:ViaService"
        values   = ["s3.${var.aws_region}.amazonaws.com"]
      }
      condition {
        test     = "StringLike"
        variable = "kms:EncryptionContext:aws:s3:arn"
        # S3 Bucket Keys use the bucket ARN; ordinary SSE-KMS uses the object ARN.
        # S3 authorization still restricts all object access to eif/*.
        values = [local.publisher_bucket_arn, local.publisher_object_arn]
      }
    }
  }
}

resource "aws_iam_role_policy" "github_publisher" {
  count = var.enable_github_publisher ? 1 : 0

  name   = "publish-eif-artifacts"
  role   = aws_iam_role.github_publisher[0].name
  policy = data.aws_iam_policy_document.github_publisher[0].json
}

output "github_publisher_role_arn" {
  description = "Set ESCROW_PUBLISH_ROLE_ARN in the escrow-production GitHub environment. Null when disabled."
  value       = try(aws_iam_role.github_publisher[0].arn, null)
}
