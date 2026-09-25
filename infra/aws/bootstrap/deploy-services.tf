data "aws_iam_policy_document" "deploy_network" {
  statement {
    sid = "NetworkLifecycle"
    actions = [
      "ec2:Describe*", "ec2:CreateVpc", "ec2:DeleteVpc", "ec2:ModifyVpcAttribute",
      "ec2:CreateSubnet", "ec2:DeleteSubnet", "ec2:ModifySubnetAttribute",
      "ec2:CreateRouteTable", "ec2:DeleteRouteTable", "ec2:AssociateRouteTable", "ec2:DisassociateRouteTable", "ec2:ReplaceRouteTableAssociation",
      "ec2:CreateRoute", "ec2:DeleteRoute", "ec2:ReplaceRoute",
      "ec2:CreateInternetGateway", "ec2:DeleteInternetGateway", "ec2:AttachInternetGateway", "ec2:DetachInternetGateway",
      "ec2:CreateNatGateway", "ec2:DeleteNatGateway", "ec2:AllocateAddress", "ec2:ReleaseAddress",
      "ec2:CreateSecurityGroup", "ec2:DeleteSecurityGroup", "ec2:AuthorizeSecurityGroupIngress", "ec2:AuthorizeSecurityGroupEgress",
      "ec2:RevokeSecurityGroupIngress", "ec2:RevokeSecurityGroupEgress", "ec2:ModifySecurityGroupRules",
      "ec2:CreateVpcEndpoint", "ec2:DeleteVpcEndpoints", "ec2:ModifyVpcEndpoint",
      "ec2:CreateFlowLogs", "ec2:DeleteFlowLogs", "ec2:CreateTags", "ec2:DeleteTags"
    ]
    resources = ["*"]
  }
}

data "aws_iam_policy_document" "deploy_services" {
  statement {
    sid       = "DescribeManagedSecretKey"
    actions   = ["kms:DescribeKey"]
    resources = ["arn:${local.partition}:kms:${local.regional_arn}:key/*"]
    # Alias conditions avoid resolving a not-yet-created AWS-managed key during
    # bootstrap. No decrypt or grant-management permission is added.
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/aws/secretsmanager"]
    }
  }
  statement {
    sid       = "NamedDatabaseResources"
    actions   = ["rds:*"]
    resources = ["arn:${local.partition}:rds:${local.regional_arn}:*:${local.name}*"]
  }
  statement {
    sid     = "NamedContainerResources"
    actions = ["ecs:*"]
    resources = [
      "arn:${local.partition}:ecs:${local.regional_arn}:cluster/${local.name}*",
      "arn:${local.partition}:ecs:${local.regional_arn}:service/${local.name}*/*",
      "arn:${local.partition}:ecs:${local.regional_arn}:task/${local.name}*/*",
      "arn:${local.partition}:ecs:${local.regional_arn}:task-definition/${local.name}*:*"
    ]
  }
  statement {
    sid = "ContainerAndDatabaseDiscovery"
    # ECS registration/deregistration do not support resource-level authorization.
    actions   = ["ecs:List*", "ecs:Describe*", "ecs:RegisterTaskDefinition", "ecs:DeregisterTaskDefinition", "rds:Describe*", "rds:ListTagsForResource"]
    resources = ["*"]
  }
  # These control planes have create/list calls with no resource ARN. The
  # companion guard policy protects supported existing-resource mutations.
  statement {
    sid       = "ServiceControlPlanes"
    actions   = ["elasticloadbalancing:*", "acm:RequestCertificate", "acm:DescribeCertificate", "acm:ListCertificates", "acm:ListTagsForCertificate", "acm:AddTagsToCertificate", "acm:RemoveTagsFromCertificate", "acm:DeleteCertificate"]
    resources = ["*"]
  }
  statement {
    sid     = "NamedObservabilityAndAutomation"
    actions = ["logs:*", "cloudwatch:*", "sns:*", "events:*", "codebuild:*", "backup:*"]
    resources = [
      "arn:${local.partition}:logs:${local.regional_arn}:log-group:/aws/vpc-flow-log/${local.name}*",
      "arn:${local.partition}:logs:${local.regional_arn}:log-group:/ecs/${local.name}*",
      "arn:${local.partition}:logs:${local.regional_arn}:log-group:/aws/codebuild/${local.name}*",
      "arn:${local.partition}:logs:${local.regional_arn}:log-group:aws-waf-logs-${local.name}*",
      "arn:${local.partition}:cloudwatch:${local.regional_arn}:alarm:${local.name}*",
      "arn:${local.partition}:sns:${local.regional_arn}:${local.name}*",
      "arn:${local.partition}:events:${local.regional_arn}:rule/${local.name}*",
      "arn:${local.partition}:codebuild:${local.regional_arn}:project/${local.name}-*",
      "arn:${local.partition}:codebuild:${local.regional_arn}:build/${local.name}-*",
      "arn:${local.partition}:backup:*:${local.account_id}:backup-vault:${local.name}*"
    ]
  }
  statement {
    sid       = "ControlPlaneDiscovery"
    actions   = ["logs:DescribeLogGroups", "cloudwatch:List*", "cloudwatch:Get*", "cloudwatch:Describe*", "sns:ListTopics", "events:ListRules", "codebuild:ListProjects", "backup:List*", "backup:Describe*", "backup:Get*", "backup:CreateBackupPlan", "backup:UpdateBackupPlan", "backup:DeleteBackupPlan", "backup:CreateBackupSelection", "backup:DeleteBackupSelection", "backup:TagResource", "backup:UntagResource"]
    resources = ["*"]
  }
  statement {
    sid       = "EnvironmentParameters"
    actions   = ["ssm:GetParameter*", "ssm:PutParameter", "ssm:DeleteParameter*", "ssm:AddTagsToResource", "ssm:RemoveTagsFromResource", "ssm:ListTagsForResource"]
    resources = ["arn:${local.partition}:ssm:${local.regional_arn}:parameter${local.ssm_prefix}/*"]
  }
  statement {
    sid       = "EnvironmentSecrets"
    actions   = ["secretsmanager:*"]
    resources = local.secret_arns
  }
  statement {
    sid       = "KeycloakDatabaseSecret"
    actions   = ["secretsmanager:*"]
    resources = [local.rds_secret_arn]
    condition {
      test     = "StringEquals"
      variable = local.rds_secret_owner
      values   = [local.rds_cluster_arn]
    }
  }
  # CreateDBCluster (managed master password) creates and tags the secret before
  # RDS's ownership tag exists. Every existing RDS secret carries that tag.
  statement {
    sid       = "KeycloakDatabaseSecretCreation"
    actions   = ["secretsmanager:CreateSecret", "secretsmanager:TagResource"]
    resources = [local.rds_secret_arn]
    condition {
      test     = "Null"
      variable = local.rds_secret_owner
      values   = ["true"]
    }
  }
  statement {
    sid       = "WafDiscovery"
    actions   = ["wafv2:Get*", "wafv2:List*", "wafv2:Describe*", "wafv2:CheckCapacity"]
    resources = ["*"]
  }
  statement {
    sid     = "KeycloakWebAcl"
    actions = ["wafv2:*"]
    resources = [
      "arn:${local.partition}:wafv2:${local.regional_arn}:regional/webacl/${local.name}*/*",
      "arn:${local.partition}:wafv2:${local.regional_arn}:regional/managedruleset/*/*",
      "arn:${local.partition}:elasticloadbalancing:${local.regional_arn}:loadbalancer/app/${local.name}/*",
    ]
  }
  statement {
    sid       = "AutoscalingDiscovery"
    actions   = ["application-autoscaling:Describe*", "application-autoscaling:ListTagsForResource"]
    resources = ["*"]
  }
  statement {
    sid       = "EcsAutoscaling"
    actions   = ["application-autoscaling:*"]
    resources = ["arn:${local.partition}:application-autoscaling:${local.regional_arn}:scalable-target/*"]
    condition {
      test     = "StringEquals"
      variable = "application-autoscaling:service-namespace"
      values   = ["ecs"]
    }
  }
  statement {
    sid       = "AlbAccessLogBuckets"
    actions   = ["s3:*"]
    resources = ["arn:${local.partition}:s3:::${local.name}-alb-logs-*", "arn:${local.partition}:s3:::${local.name}-alb-logs-*/*"]
  }
  statement {
    sid       = "EcrPull"
    actions   = ["ecr:BatchGetImage", "ecr:GetDownloadUrlForLayer", "ecr:BatchCheckLayerAvailability", "ecr:DescribeImages", "ecr:DescribeRepositories", "ecr:ListImages"]
    resources = [aws_ecr_repository.keycloak.arn]
  }
  statement {
    actions   = ["ecr:GetAuthorizationToken"]
    resources = ["*"]
  }
  dynamic "statement" {
    for_each = var.environment == "staging" ? [true] : []
    content {
      sid       = "PublishStagingImages"
      actions   = ["ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload", "ecr:PutImage"]
      resources = [aws_ecr_repository.keycloak.arn]
    }
  }
}

data "aws_iam_policy_document" "deploy_dns" {
  statement {
    actions   = ["route53:CreateHostedZone", "route53:ListHostedZones", "route53:ListHostedZonesByName", "route53:GetChange", "route53:ListTagsForResource", "route53:GetHostedZone", "route53:ListResourceRecordSets"]
    resources = ["*"]
  }
  statement {
    actions   = ["route53:ChangeResourceRecordSets"]
    resources = ["arn:${local.partition}:route53:::hostedzone/*"]
    condition {
      test     = "ForAllValues:StringLike"
      variable = "route53:ChangeResourceRecordSetsNormalizedRecordNames"
      values   = [local.auth_hostname, "*.${local.auth_hostname}"]
    }
  }
  # Hosted zones do not support tag-based IAM authorization. Zone lifecycle is
  # broader than record changes; keep this exception visible for human review.
  statement {
    actions   = ["route53:DeleteHostedZone", "route53:UpdateHostedZoneComment", "route53:ChangeTagsForResource", "route53:AssociateVPCWithHostedZone", "route53:DisassociateVPCFromHostedZone"]
    resources = ["arn:${local.partition}:route53:::hostedzone/*"]
  }
}

locals {
  auth_hostname = var.environment == "production" ? "auth.learncard.app" : "auth.staging.learncard.app"
}

resource "aws_iam_policy" "deploy_services" {
  name   = "${local.name}-deploy-services"
  policy = data.aws_iam_policy_document.deploy_services.json
}

resource "aws_iam_policy" "deploy_network" {
  name   = "${local.name}-deploy-network"
  policy = data.aws_iam_policy_document.deploy_network.json
}

resource "aws_iam_role_policy_attachment" "deploy_network" {
  role       = aws_iam_role.github["deploy"].name
  policy_arn = aws_iam_policy.deploy_network.arn
}

resource "aws_iam_policy" "deploy_dns" {
  name   = "${local.name}-deploy-dns"
  policy = data.aws_iam_policy_document.deploy_dns.json
}

resource "aws_iam_role_policy_attachment" "deploy_services" {
  role       = aws_iam_role.github["deploy"].name
  policy_arn = aws_iam_policy.deploy_services.arn
}

resource "aws_iam_role_policy_attachment" "deploy_dns" {
  role       = aws_iam_role.github["deploy"].name
  policy_arn = aws_iam_policy.deploy_dns.arn
}
