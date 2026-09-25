locals {
  guarded_mutations = {
    acm    = ["acm:DeleteCertificate", "acm:AddTagsToCertificate", "acm:RemoveTagsFromCertificate"]
    backup = ["backup:UpdateBackupPlan", "backup:DeleteBackupPlan", "backup:CreateBackupSelection", "backup:DeleteBackupSelection", "backup:TagResource", "backup:UntagResource"]
    ec2 = [
      "ec2:DeleteVpc", "ec2:ModifyVpcAttribute", "ec2:DeleteSubnet", "ec2:ModifySubnetAttribute",
      "ec2:DeleteRouteTable", "ec2:CreateRoute", "ec2:DeleteRoute", "ec2:ReplaceRoute",
      "ec2:DeleteInternetGateway", "ec2:AttachInternetGateway", "ec2:DetachInternetGateway", "ec2:DeleteNatGateway", "ec2:ReleaseAddress",
      "ec2:DeleteSecurityGroup", "ec2:AuthorizeSecurityGroupIngress", "ec2:AuthorizeSecurityGroupEgress",
      "ec2:RevokeSecurityGroupIngress", "ec2:RevokeSecurityGroupEgress", "ec2:ModifySecurityGroupRules",
      "ec2:DeleteVpcEndpoints", "ec2:ModifyVpcEndpoint"
    ]
    rds                  = ["rds:ModifyDB*", "rds:DeleteDB*", "rds:RebootDBInstance", "rds:StartDB*", "rds:StopDB*", "rds:FailoverDBCluster", "rds:RemoveTagsFromResource"]
    ecs                  = ["ecs:UpdateService", "ecs:DeleteService", "ecs:DeleteCluster", "ecs:UpdateCluster", "ecs:UpdateClusterSettings", "ecs:PutClusterCapacityProviders", "ecs:StopTask", "ecs:ExecuteCommand", "ecs:DeregisterTaskDefinition", "ecs:DeleteTaskDefinitions", "ecs:UntagResource"]
    elasticloadbalancing = ["elasticloadbalancing:Delete*", "elasticloadbalancing:Modify*", "elasticloadbalancing:Set*", "elasticloadbalancing:RegisterTargets", "elasticloadbalancing:DeregisterTargets", "elasticloadbalancing:RemoveTags"]
  }
}

data "aws_iam_policy_document" "deploy_guards" {
  statement {
    sid       = "NoEcsTagTakeover"
    effect    = "Deny"
    actions   = ["ecs:TagResource"]
    resources = ["*"]
    condition {
      test     = "Null"
      variable = "ecs:CreateAction"
      values   = ["true"]
    }
    condition {
      test     = "StringNotEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["learncard-keycloak"]
    }
  }
  # RDS has no CreateAction discriminator. Restrict tagging to namespaced ARNs
  # in the allow policy and reject existing foreign Project values here.
  statement {
    sid       = "NoRdsForeignProjectRetagging"
    effect    = "Deny"
    actions   = ["rds:AddTagsToResource"]
    resources = ["*"]
    condition {
      test     = "Null"
      variable = "aws:ResourceTag/Project"
      values   = ["false"]
    }
    condition {
      test     = "StringNotEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["learncard-keycloak"]
    }
  }
  dynamic "statement" {
    for_each = local.guarded_mutations
    content {
      effect    = "Deny"
      actions   = statement.value
      resources = ["*"]
      condition {
        test     = "StringNotEquals"
        variable = "aws:ResourceTag/Project"
        values   = ["learncard-keycloak"]
      }
    }
  }
  # EC2 exposes CreateAction only during tag-on-create authorization. Existing
  # untagged resources cannot be claimed by adding our Project tag afterwards.
  statement {
    sid       = "NoEc2TagTakeover"
    effect    = "Deny"
    actions   = ["ec2:CreateTags", "ec2:DeleteTags"]
    resources = ["*"]
    condition {
      test     = "Null"
      variable = "ec2:CreateAction"
      values   = ["true"]
    }
    condition {
      test     = "StringNotEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["learncard-keycloak"]
    }
  }
  statement {
    sid       = "NoElbTagTakeover"
    effect    = "Deny"
    actions   = ["elasticloadbalancing:AddTags"]
    resources = ["*"]
    condition {
      test     = "Null"
      variable = "elasticloadbalancing:CreateAction"
      values   = ["true"]
    }
    condition {
      test     = "StringNotEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["learncard-keycloak"]
    }
  }
  statement {
    sid       = "ProductionImagesAreReplicationOnly"
    effect    = "Deny"
    actions   = var.environment == "production" ? ["ecr:PutImage", "ecr:InitiateLayerUpload", "ecr:UploadLayerPart", "ecr:CompleteLayerUpload"] : ["ecr:DeleteRepository"]
    resources = [aws_ecr_repository.keycloak.arn]
  }
}

resource "aws_iam_policy" "deploy_guards" {
  name   = "${local.name}-deploy-guards"
  policy = data.aws_iam_policy_document.deploy_guards.json
}

resource "aws_iam_role_policy_attachment" "deploy_guards" {
  role       = aws_iam_role.github["deploy"].name
  policy_arn = aws_iam_policy.deploy_guards.arn
}
