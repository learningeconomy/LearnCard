# Refresh permissions for network/ and service/ only (including VPC module 6.7.3).
# Enumerate actions: AWS adding a data-read API must not widen this role. ECR,
# DynamoDB and service discovery are not read by these roots or keycloak-drift.yml.
data "aws_iam_policy_document" "plan_read" {
  statement {
    sid = "InfrastructureConfiguration"
    actions = [
      "sts:GetCallerIdentity",
      # VPC, subnets, routes, NAT/EIP, gateway endpoint, flow logs and security groups.
      "ec2:DescribeVpcs", "ec2:DescribeVpcAttribute", "ec2:DescribeSubnets",
      "ec2:DescribeRouteTables", "ec2:DescribeInternetGateways", "ec2:DescribeNatGateways",
      "ec2:DescribeAddresses", "ec2:DescribeAddressesAttribute", "ec2:DescribeNetworkAcls",
      "ec2:DescribeSecurityGroups", "ec2:DescribeSecurityGroupRules", "ec2:DescribeNetworkInterfaces",
      "ec2:DescribeVpcEndpoints", "ec2:DescribeVpcEndpointServices", "ec2:DescribeFlowLogs",
      # Gateway endpoint refresh resolves the S3 service prefix list.
      "ec2:DescribePrefixLists",
      "ec2:DescribeAvailabilityZones", "ec2:DescribeRegions", "ec2:DescribeTags",
      # Hosted zones, DNS records and ACM validation; no certificate export.
      "route53:GetHostedZone", "route53:ListResourceRecordSets", "route53:ListTagsForResource",
      "acm:DescribeCertificate", "acm:ListTagsForCertificate",
      # Includes the running task-definition lookup in the drift workflow.
      "ecs:DescribeClusters", "ecs:DescribeServices", "ecs:DescribeTaskDefinition", "ecs:ListTagsForResource",
      "elasticloadbalancing:DescribeLoadBalancers", "elasticloadbalancing:DescribeLoadBalancerAttributes",
      "elasticloadbalancing:DescribeCapacityReservation",
      "elasticloadbalancing:DescribeListeners", "elasticloadbalancing:DescribeListenerAttributes",
      "elasticloadbalancing:DescribeListenerCertificates", "elasticloadbalancing:DescribeRules",
      "elasticloadbalancing:DescribeTargetGroups", "elasticloadbalancing:DescribeTargetGroupAttributes",
      "elasticloadbalancing:DescribeTags",
      "application-autoscaling:DescribeScalableTargets", "application-autoscaling:DescribeScalingPolicies",
      "application-autoscaling:ListTagsForResource",
      # Aurora configuration and RDS-managed secret rotation metadata, never passwords.
      "rds:DescribeDBClusters", "rds:DescribeDBInstances", "rds:DescribeDBSubnetGroups",
      # Provider 6.66.0 checks global membership even for provisioned regional clusters.
      "rds:DescribeGlobalClusters",
      "rds:DescribeDBClusterParameterGroups", "rds:DescribeDBClusterParameters", "rds:ListTagsForResource",
      "secretsmanager:DescribeSecret",
      # Log configuration and saved queries, never log events or query results.
      "logs:DescribeLogGroups", "logs:ListTagsForResource", "logs:ListTagsLogGroup",
      "logs:DescribeMetricFilters", "logs:DescribeQueryDefinitions",
      "cloudwatch:DescribeAlarms", "cloudwatch:ListTagsForResource",
      "sns:GetTopicAttributes", "sns:GetSubscriptionAttributes", "sns:ListTagsForResource",
      "events:DescribeRule", "events:ListTargetsByRule", "events:ListTagsForResource",
      "wafv2:GetWebACL", "wafv2:GetWebACLForResource", "wafv2:GetLoggingConfiguration",
      "wafv2:ListTagsForResource",
      # Backup includes the cross-region vault/key; do not restrict to the home region.
      "backup:DescribeBackupVault", "backup:GetBackupPlan", "backup:GetBackupSelection", "backup:ListTags",
      "kms:DescribeKey", "kms:GetKeyPolicy", "kms:GetKeyRotationStatus", "kms:ListResourceTags",
      "codebuild:BatchGetProjects",
      # DescribeParameters does not support resource-level permissions. Values below
      # remain scoped to the environment; no history or recursive path reads.
      "ssm:DescribeParameters",
    ]
    resources = ["*"]
  }
  statement {
    sid = "WorkloadRoleConfiguration"
    actions = [
      "iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies",
      "iam:ListAttachedRolePolicies", "iam:ListRoleTags",
    ]
    resources = ["${local.iam_prefix}:role/${local.name}-*"]
  }
  statement {
    sid       = "FlowLogPolicyConfiguration"
    actions   = ["iam:GetPolicy", "iam:GetPolicyVersion", "iam:ListPolicyVersions", "iam:ListPolicyTags"]
    resources = ["${local.iam_prefix}:policy/${local.name}-*"]
  }
  statement {
    sid       = "EnvironmentParameters"
    actions   = ["ssm:GetParameter", "ssm:GetParameters", "ssm:ListTagsForResource"]
    resources = ["arn:${local.partition}:ssm:${local.regional_arn}:parameter${local.ssm_prefix}/*"]
  }
  statement {
    sid = "AlbLogBucketConfiguration"
    # aws_s3_bucket refresh also reads legacy inline configuration attributes.
    # ListBucket authorizes HeadBucket; no object ARN or GetObject permission here.
    actions = [
      # Provider 6.x reads bucket tags via S3 Control ListTagsForResource.
      "s3:ListTagsForResource",
      "s3:ListBucket", "s3:GetBucketLocation", "s3:GetBucketTagging", "s3:GetBucketPolicy",
      "s3:GetBucketAcl", "s3:GetBucketCORS", "s3:GetBucketWebsite", "s3:GetBucketVersioning",
      "s3:GetAccelerateConfiguration", "s3:GetBucketRequestPayment", "s3:GetBucketLogging",
      "s3:GetLifecycleConfiguration", "s3:GetReplicationConfiguration", "s3:GetEncryptionConfiguration",
      "s3:GetBucketObjectLockConfiguration", "s3:GetBucketPublicAccessBlock", "s3:GetBucketOwnershipControls",
    ]
    resources = ["arn:${local.partition}:s3:::${local.name}-alb-logs-*"]
  }
}

resource "aws_iam_policy" "plan_read" {
  name        = "${local.name}-plan-read"
  description = "Configuration-only refresh for Keycloak network and service drift checks"
  policy      = data.aws_iam_policy_document.plan_read.json

  lifecycle {
    precondition {
      condition     = length(jsonencode(jsondecode(data.aws_iam_policy_document.plan_read.json))) <= 6144
      error_message = "Plan read policy exceeds IAM's 6144-character managed-policy limit; split it before adding permissions."
    }
  }
}

resource "aws_iam_role_policy_attachment" "plan_read" {
  role       = aws_iam_role.github["plan"].name
  policy_arn = aws_iam_policy.plan_read.arn
}
