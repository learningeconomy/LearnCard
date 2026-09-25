# This is a ceiling, not a grant: each workload still needs a narrower identity
# policy. In particular there is no IAM, STS AssumeRole, or deployment permission.
data "aws_iam_policy_document" "workload_boundary" {
  statement {
    actions   = ["ssmmessages:CreateControlChannel", "ssmmessages:CreateDataChannel", "ssmmessages:OpenControlChannel", "ssmmessages:OpenDataChannel"]
    resources = ["*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-access-task"]
    }
  }
  statement {
    actions   = ["logs:CreateLogStream", "logs:PutLogEvents", "logs:DescribeLogStreams"]
    resources = ["arn:${local.partition}:logs:${local.regional_arn}:log-group:/ecs/${local.name}*", "arn:${local.partition}:logs:${local.regional_arn}:log-group:/aws/codebuild/${local.name}*", "arn:${local.partition}:logs:${local.regional_arn}:log-group:/aws/vpc-flow-log/${local.name}*"]
  }
  statement {
    actions   = ["logs:DescribeLogGroups", "ecr:GetAuthorizationToken", "ec2:Describe*", "cloudwatch:PutMetricData"]
    resources = ["*"]
  }
  statement {
    actions   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability"]
    resources = [aws_ecr_repository.keycloak.arn]
  }
  statement {
    actions   = ["secretsmanager:GetSecretValue", "secretsmanager:DescribeSecret"]
    resources = local.secret_arns
  }
  # A boundary also caps grants from the AWS-managed key policy, so secret reads
  # need decrypt here. Limited to that key, and only when called by Secrets Manager.
  statement {
    actions   = ["kms:Decrypt"]
    resources = ["arn:${local.partition}:kms:${local.regional_arn}:key/*"]
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
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:GetParametersByPath"]
    resources = ["arn:${local.partition}:ssm:${local.regional_arn}:parameter${local.ssm_prefix}/*"]
  }
  statement {
    actions   = ["s3:ListBucket", "s3:GetBucketLocation"]
    resources = [aws_s3_bucket.state.arn]
  }
  statement {
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = ["${aws_s3_bucket.state.arn}/keycloak/${var.environment}/realm.tfstate"]
  }
  statement {
    actions   = ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"]
    resources = ["${aws_s3_bucket.state.arn}/keycloak/${var.environment}/realm.tfstate.tflock"]
  }
  statement {
    # CodeBuild's VPC pre-flight checks DeleteNetworkInterface against "*"; the
    # realm-runner role policy is the only workload policy that grants it.
    actions   = ["ec2:DeleteNetworkInterface"]
    resources = ["*"]
  }
  statement {
    actions   = ["ec2:CreateNetworkInterface", "ec2:DeleteNetworkInterface", "ec2:CreateNetworkInterfacePermission"]
    resources = ["arn:${local.partition}:ec2:${local.regional_arn}:network-interface/*", "arn:${local.partition}:ec2:${local.regional_arn}:subnet/*", "arn:${local.partition}:ec2:${local.regional_arn}:security-group/*"]
  }
  statement {
    actions   = ["rds:Describe*", "rds:ListTagsForResource"]
    resources = ["*"]
  }
  statement {
    actions   = ["rds:CreateDBClusterSnapshot", "rds:CopyDBClusterSnapshot", "rds:DeleteDBClusterSnapshot", "rds:AddTagsToResource"]
    resources = ["arn:${local.partition}:rds:*:${local.account_id}:cluster:${local.name}*", "arn:${local.partition}:rds:*:${local.account_id}:cluster-snapshot:${local.name}*"]
  }
  statement {
    actions   = ["backup:CopyIntoBackupVault"]
    resources = ["arn:${local.partition}:backup:*:${local.account_id}:backup-vault:${local.name}*"]
  }
}

resource "aws_iam_policy" "workload_boundary" {
  name = "${local.name}-workload-boundary"
  # Base ceiling plus Backup-role-only additions (deploy-observability.tf).
  policy = data.aws_iam_policy_document.observability_workload_boundary.json
}
