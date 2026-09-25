resource "aws_iam_openid_connect_provider" "github" {
  count          = var.create_github_oidc_provider ? 1 : 0
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  # IAM validates GitHub through its trusted CA store; no rotating thumbprint pin.
}

data "aws_iam_openid_connect_provider" "github" {
  count = var.create_github_oidc_provider ? 0 : 1
  url   = "https://token.actions.githubusercontent.com"
}

locals {
  oidc_arn = var.create_github_oidc_provider ? aws_iam_openid_connect_provider.github[0].arn : data.aws_iam_openid_connect_provider.github[0].arn
  oidc_subjects = {
    # Main only: a pull_request subject would let any repository writer assume this
    # role from PR-controlled workflow code.
    plan   = ["repo:${var.github_repository}:ref:refs/heads/main"]
    deploy = ["repo:${var.github_repository}:environment:keycloak-${var.environment}"]
  }
}

data "aws_iam_policy_document" "github_trust" {
  for_each = local.oidc_subjects
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    principals {
      type        = "Federated"
      identifiers = [local.oidc_arn]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = each.value
    }
  }
}

resource "aws_iam_role" "github" {
  for_each           = local.oidc_subjects
  name               = "${local.name}-${each.key}"
  assume_role_policy = data.aws_iam_policy_document.github_trust[each.key].json
}

# ReadOnlyAccess also reads application data. The plan role only needs resource
# configuration, so deny data-plane reads everywhere outside Keycloak's own state.
data "aws_iam_policy_document" "plan_data_denies" {
  statement {
    sid    = "NoApplicationData"
    effect = "Deny"
    actions = [
      "secretsmanager:GetSecretValue", "ssm:GetParameterHistory", "kms:Decrypt",
      "logs:GetLogEvents", "logs:FilterLogEvents", "logs:StartQuery", "logs:GetQueryResults", "logs:StartLiveTail",
      "dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query", "dynamodb:Scan",
      "sqs:ReceiveMessage", "lambda:GetFunction", "codecommit:GitPull", "athena:GetQueryResults",
      "ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer",
    ]
    resources = ["*"]
  }
  statement {
    sid           = "NoObjectReadsOutsideInfraState"
    effect        = "Deny"
    actions       = ["s3:GetObject", "s3:GetObjectVersion"]
    not_resources = [for key in local.plan_state_keys["plan"] : "${aws_s3_bucket.state.arn}/${key}"]
  }
  statement {
    sid           = "NoParametersOutsideKeycloak"
    effect        = "Deny"
    actions       = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    not_resources = ["arn:${local.partition}:ssm:${local.regional_arn}:parameter${local.ssm_prefix}/*"]
  }
}

resource "aws_iam_role_policy" "plan_data_denies" {
  name   = "${local.name}-plan-data-denies"
  role   = aws_iam_role.github["plan"].id
  policy = data.aws_iam_policy_document.plan_data_denies.json
}

resource "aws_iam_role_policy_attachment" "plan_read_only" {
  role       = aws_iam_role.github["plan"].name
  policy_arn = "arn:${local.partition}:iam::aws:policy/ReadOnlyAccess"
}

data "aws_iam_policy_document" "state_access" {
  for_each = local.oidc_subjects
  statement {
    actions   = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = [aws_s3_bucket.state.arn]
  }
  statement {
    actions   = each.key == "deploy" ? ["s3:GetObject", "s3:PutObject"] : ["s3:GetObject"]
    resources = [for key in local.plan_state_keys[each.key] : "${aws_s3_bucket.state.arn}/${key}"]
  }
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = [for key in local.plan_state_keys[each.key] : "${aws_s3_bucket.state.arn}/${key}.tflock"]
  }
}

resource "aws_iam_role_policy" "state_access" {
  for_each = local.oidc_subjects
  name     = "${local.name}-state-access"
  role     = aws_iam_role.github[each.key].id
  policy   = data.aws_iam_policy_document.state_access[each.key].json
}
