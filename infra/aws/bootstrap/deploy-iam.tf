data "aws_iam_policy_document" "deploy_iam" {
  statement {
    sid       = "DiscoverIam"
    actions   = ["iam:GetRole", "iam:GetRolePolicy", "iam:ListRolePolicies", "iam:ListAttachedRolePolicies", "iam:ListRoleTags", "iam:ListInstanceProfilesForRole", "iam:GetPolicy", "iam:GetPolicyVersion", "iam:ListPolicyVersions", "iam:ListPolicyTags"]
    resources = ["${local.iam_prefix}:role/${local.name}-*", "${local.iam_prefix}:policy/${local.name}-*"]
  }
  statement {
    sid       = "RequireWorkloadBoundary"
    actions   = ["iam:CreateRole", "iam:PutRolePermissionsBoundary", "iam:AttachRolePolicy", "iam:PutRolePolicy"]
    resources = ["${local.iam_prefix}:role/${local.name}-*"]
    condition {
      test     = "ArnEquals"
      variable = "iam:PermissionsBoundary"
      values   = [local.boundary_arn]
    }
  }
  statement {
    sid       = "ManageWorkloadRoles"
    actions   = ["iam:DeleteRole", "iam:UpdateRole", "iam:UpdateAssumeRolePolicy", "iam:DetachRolePolicy", "iam:DeleteRolePolicy", "iam:TagRole", "iam:UntagRole"]
    resources = ["${local.iam_prefix}:role/${local.name}-*"]
  }
  statement {
    sid       = "ManageWorkloadPolicies"
    actions   = ["iam:CreatePolicy", "iam:DeletePolicy", "iam:CreatePolicyVersion", "iam:DeletePolicyVersion", "iam:SetDefaultPolicyVersion", "iam:TagPolicy", "iam:UntagPolicy"]
    resources = ["${local.iam_prefix}:policy/${local.name}-*"]
  }
  statement {
    sid       = "PassOnlyWorkloadRoles"
    actions   = ["iam:PassRole"]
    resources = ["${local.iam_prefix}:role/${local.name}-*"]
    condition {
      test     = "StringEquals"
      variable = "iam:PassedToService"
      values   = ["ecs-tasks.amazonaws.com", "codebuild.amazonaws.com", "rds.amazonaws.com", "monitoring.rds.amazonaws.com", "backup.amazonaws.com", "vpc-flow-logs.amazonaws.com"]
    }
  }
  statement {
    sid       = "ServiceLinkedRoleCreation"
    actions   = ["iam:CreateServiceLinkedRole"]
    resources = ["${local.iam_prefix}:role/aws-service-role/*"]
    condition {
      test     = "StringEquals"
      variable = "iam:AWSServiceName"
      values   = ["ecs.amazonaws.com", "elasticloadbalancing.amazonaws.com", "rds.amazonaws.com", "ecs.application-autoscaling.amazonaws.com", "backup.amazonaws.com"]
    }
  }
  statement {
    sid       = "NeverRemoveBoundary"
    effect    = "Deny"
    actions   = ["iam:DeleteRolePermissionsBoundary"]
    resources = ["*"]
  }
  # Prefix scoping alone would let deploy edit itself or replace its boundary.
  statement {
    sid         = "ProtectBootstrapIam"
    effect      = "Deny"
    not_actions = ["iam:Get*", "iam:List*"]
    resources = [
      "${local.iam_prefix}:role/${local.name}-plan",
      "${local.iam_prefix}:role/${local.name}-deploy",
      local.boundary_arn,
      "${local.iam_prefix}:policy/${local.name}-deploy-*"
    ]
  }
  statement {
    sid       = "ProtectBootstrapDiscovery"
    effect    = "Deny"
    actions   = ["ssm:PutParameter", "ssm:DeleteParameter*", "ssm:AddTagsToResource", "ssm:RemoveTagsFromResource"]
    resources = ["arn:${local.partition}:ssm:${local.regional_arn}:parameter${local.ssm_prefix}/bootstrap/*"]
  }
}

resource "aws_iam_policy" "deploy_iam" {
  name   = "${local.name}-deploy-iam"
  policy = data.aws_iam_policy_document.deploy_iam.json
}

resource "aws_iam_role_policy_attachment" "deploy_iam" {
  role       = aws_iam_role.github["deploy"].name
  policy_arn = aws_iam_policy.deploy_iam.arn
}
