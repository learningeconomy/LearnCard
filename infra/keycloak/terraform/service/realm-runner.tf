data "aws_iam_policy_document" "realm_runner_trust" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["codebuild.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
    condition {
      test     = "ArnEquals"
      variable = "aws:SourceArn"
      values   = ["arn:${local.partition}:codebuild:${var.aws_region}:${local.account_id}:project/${local.name}-realm"]
    }
  }
}

resource "aws_iam_role" "realm_runner" {
  name                 = "${local.name}-realm-runner"
  assume_role_policy   = data.aws_iam_policy_document.realm_runner_trust.json
  permissions_boundary = local.workload_boundary
}

resource "aws_cloudwatch_log_group" "realm_runner" {
  name              = "/aws/codebuild/${local.name}-realm"
  retention_in_days = var.log_retention_days
}

data "aws_iam_policy_document" "realm_runner" {
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents"]
    resources = ["${aws_cloudwatch_log_group.realm_runner.arn}:*"]
  }
  statement {
    actions   = ["s3:GetBucketLocation"]
    resources = ["arn:${local.partition}:s3:::${local.state_bucket_name}"]
  }
  statement {
    actions   = ["s3:ListBucket"]
    resources = ["arn:${local.partition}:s3:::${local.state_bucket_name}"]
    condition {
      test     = "StringLike"
      variable = "s3:prefix"
      values   = ["keycloak/${var.environment}/realm.tfstate*", "env:/*"]
    }
  }
  statement {
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["arn:${local.partition}:s3:::${local.state_bucket_name}/keycloak/${var.environment}/realm.tfstate"]
  }
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["arn:${local.partition}:s3:::${local.state_bucket_name}/keycloak/${var.environment}/realm.tfstate.tflock"]
  }
  statement {
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = ["arn:${local.partition}:secretsmanager:${var.aws_region}:${local.account_id}:secret:learncard-keycloak/${var.environment}/*"]
  }
  statement {
    actions   = ["kms:Decrypt"]
    resources = ["arn:${local.partition}:kms:${var.aws_region}:${local.account_id}:key/*"]
    condition {
      test     = "StringEquals"
      variable = "kms:ViaService"
      values   = ["secretsmanager.${var.aws_region}.amazonaws.com"]
    }
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/aws/secretsmanager"]
    }
  }
  statement {
    actions   = ["ec2:DescribeNetworkInterfaces", "ec2:DescribeSubnets", "ec2:DescribeSecurityGroups", "ec2:DescribeDhcpOptions", "ec2:DescribeVpcs"]
    resources = ["*"]
  }
  statement {
    actions = ["ec2:CreateNetworkInterface"]
    resources = concat([
      "arn:${local.partition}:ec2:${var.aws_region}:${local.account_id}:network-interface/*",
      "arn:${local.partition}:ec2:${var.aws_region}:${local.account_id}:security-group/${aws_security_group.keycloak["realm-runner"].id}"
    ], [for subnet in local.private_subnet_ids : "arn:${local.partition}:ec2:${var.aws_region}:${local.account_id}:subnet/${subnet}"])
  }
  statement {
    # CodeBuild's VPC pre-flight authorizes this action against "*" (no ENI ARN or
    # ec2:Subnet context), so anything narrower fails every build at QUEUED.
    actions   = ["ec2:DeleteNetworkInterface"]
    resources = ["*"]
  }
  statement {
    actions = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = [
      "arn:${local.partition}:ssm:${var.aws_region}:${local.account_id}:parameter${local.ssm_prefix}/network/*",
      "arn:${local.partition}:ssm:${var.aws_region}:${local.account_id}:parameter${local.ssm_prefix}/service/*",
      "arn:${local.partition}:ssm:${var.aws_region}:${local.account_id}:parameter${local.ssm_prefix}/bootstrap/state_bucket_name"
    ]
  }
  statement {
    actions   = ["ec2:CreateNetworkInterfacePermission"]
    resources = ["arn:${local.partition}:ec2:${var.aws_region}:${local.account_id}:network-interface/*"]
    condition {
      test     = "StringEquals"
      variable = "ec2:AuthorizedService"
      values   = ["codebuild.amazonaws.com"]
    }
    condition {
      test     = "ArnEquals"
      variable = "ec2:Subnet"
      values   = [for subnet in local.private_subnet_ids : "arn:${local.partition}:ec2:${var.aws_region}:${local.account_id}:subnet/${subnet}"]
    }
  }
}

resource "aws_iam_role_policy" "realm_runner" {
  name   = "${local.name}-realm-runner"
  role   = aws_iam_role.realm_runner.id
  policy = data.aws_iam_policy_document.realm_runner.json
}

resource "aws_codebuild_project" "realm" {
  name                   = "${local.name}-realm"
  description            = "Private realm Terraform runner; reviewed generated tenant inputs and Secrets Manager credentials"
  service_role           = aws_iam_role.realm_runner.arn
  build_timeout          = 30
  queued_timeout         = 30
  concurrent_build_limit = 1
  source_version         = "refs/heads/main"
  source {
    type            = "GITHUB"
    location        = "https://github.com/learningeconomy/LearnCard.git"
    git_clone_depth = 1
    buildspec       = file("${path.module}/buildspec-realm.yml")
  }
  artifacts {
    type = "NO_ARTIFACTS"
  }
  environment {
    compute_type                = "BUILD_GENERAL1_SMALL"
    image                       = "aws/codebuild/standard:7.0"
    type                        = "LINUX_CONTAINER"
    image_pull_credentials_type = "CODEBUILD"
    privileged_mode             = false
    dynamic "environment_variable" {
      for_each = {
        DEPLOY_ENVIRONMENT = var.environment
        TF_STATE_BUCKET    = local.state_bucket_name
        TF_IN_AUTOMATION   = "true"
        TF_INPUT           = "false"
        KEYCLOAK_URL       = "https://${local.network.admin_hostname}"
      }
      content {
        name  = environment_variable.key
        value = environment_variable.value
        type  = "PLAINTEXT"
      }
    }
  }
  vpc_config {
    vpc_id             = local.network.vpc_id
    subnets            = local.private_subnet_ids
    security_group_ids = [aws_security_group.keycloak["realm-runner"].id]
  }
  logs_config {
    cloudwatch_logs {
      group_name = aws_cloudwatch_log_group.realm_runner.name
    }
  }
  depends_on = [aws_iam_role_policy.realm_runner, aws_vpc_security_group_egress_rule.https]
}
