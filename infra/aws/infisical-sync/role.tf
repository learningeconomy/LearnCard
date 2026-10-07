data "aws_iam_policy_document" "trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "AWS"
      identifiers = [var.infisical_aws_principal_arn]
    }
    # ExternalId defeats the confused-deputy problem: the shared Infisical account
    # can only assume this role when it presents this tenant's project ID.
    condition {
      test     = "StringEquals"
      variable = "sts:ExternalId"
      values   = [var.infisical_project_id]
    }
  }
}

resource "aws_iam_role" "infisical_sync" {
  name                 = local.name
  assume_role_policy   = data.aws_iam_policy_document.trust.json
  max_session_duration = 3600
}

data "aws_iam_policy_document" "infisical_sync" {
  # ListSecrets and BatchGetSecretValue do not accept resource-level scoping, so
  # they are granted account-wide. No secret values are exposed by ListSecrets;
  # BatchGetSecretValue is itself constrained by the caller's other resource grants.
  statement {
    sid       = "DiscoverSecrets"
    actions   = ["secretsmanager:ListSecrets", "secretsmanager:BatchGetSecretValue"]
    resources = ["*"]
  }
  # No DeleteSecret: this role can create and update but never destroy secrets.
  statement {
    sid = "ManageRuntimeSecrets"
    actions = [
      "secretsmanager:GetSecretValue",
      "secretsmanager:CreateSecret",
      "secretsmanager:UpdateSecret",
      "secretsmanager:PutSecretValue",
      "secretsmanager:DescribeSecret",
      "secretsmanager:TagResource",
      "secretsmanager:UntagResource",
    ]
    resources = local.managed_secret_arns
  }
}

resource "aws_iam_role_policy" "infisical_sync" {
  name   = "${local.name}-secrets"
  role   = aws_iam_role.infisical_sync.id
  policy = data.aws_iam_policy_document.infisical_sync.json
}
