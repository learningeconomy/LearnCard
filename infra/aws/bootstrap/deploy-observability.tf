# Human-applied before the service root. Existing deploy_services already grants
# WAF (including association/logging), named SNS/Events/alarms/metric filters and
# cross-region named backup vaults. PassRole to Backup is in deploy-iam.tf.
data "aws_iam_policy_document" "deploy_observability" {
  statement {
    sid = "SavedQueriesAndWafLogDelivery"
    # These APIs do not support resource-level authorization. In particular,
    # PutResourcePolicy can affect account log delivery: review this exception.
    actions = [
      "logs:PutQueryDefinition", "logs:DeleteQueryDefinition", "logs:DescribeQueryDefinitions",
      "logs:CreateLogDelivery", "logs:DeleteLogDelivery", "logs:GetLogDelivery",
      "logs:UpdateLogDelivery", "logs:ListLogDeliveries",
      "logs:PutResourcePolicy", "logs:DescribeResourcePolicies"
    ]
    resources = ["*"]
  }
  statement {
    sid       = "BackupVaultStorage"
    actions   = ["backup-storage:MountCapsule"]
    resources = ["*"]
  }
  statement {
    sid       = "BackupVaultManagedKey"
    actions   = ["kms:DescribeKey", "kms:GenerateDataKey", "kms:Decrypt"]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/aws/backup"]
    }
    condition {
      test     = "StringLike"
      variable = "kms:ViaService"
      values   = ["backup.*.amazonaws.com"]
    }
  }
  statement {
    sid       = "BackupVaultManagedKeyGrant"
    actions   = ["kms:CreateGrant"]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/aws/backup"]
    }
    condition {
      test     = "Bool"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }
}

resource "aws_iam_policy" "deploy_observability" {
  name   = "${local.name}-deploy-observability"
  policy = data.aws_iam_policy_document.deploy_observability.json
}

resource "aws_iam_role_policy_attachment" "deploy_observability" {
  role       = aws_iam_role.github["deploy"].name
  policy_arn = aws_iam_policy.deploy_observability.arn
}

# Only the Backup role receives the extended ceiling. Generated RDS snapshot
# identifiers are awsbackup:job-*, not our namespaced prefix (AWS controls this).
data "aws_iam_policy_document" "observability_workload_boundary" {
  source_policy_documents = [data.aws_iam_policy_document.workload_boundary.json]
  statement {
    sid       = "BackupGeneratedSnapshots"
    actions   = ["rds:CreateDBClusterSnapshot", "rds:CopyDBClusterSnapshot", "rds:DeleteDBClusterSnapshot", "rds:AddTagsToResource"]
    resources = ["arn:${local.partition}:rds:*:${local.account_id}:cluster-snapshot:awsbackup:job-*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-backup"]
    }
  }
  statement {
    sid       = "BackupSourceVaultCopy"
    actions   = ["backup:CopyFromBackupVault"]
    resources = ["arn:${local.partition}:backup:*:${local.account_id}:backup-vault:${local.name}-*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-backup"]
    }
  }
  statement {
    sid       = "BackupManagedKeyUse"
    actions   = ["kms:DescribeKey", "kms:Decrypt", "kms:GenerateDataKey*", "kms:ReEncrypt*"]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-backup"]
    }
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/aws/rds", "alias/aws/backup"]
    }
    condition {
      test     = "StringLike"
      variable = "kms:ViaService"
      values   = ["rds.*.amazonaws.com", "backup.*.amazonaws.com"]
    }
  }
  statement {
    sid       = "BackupManagedKeyGrant"
    actions   = ["kms:CreateGrant"]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-backup"]
    }
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/aws/rds", "alias/aws/backup"]
    }
    condition {
      test     = "Bool"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }
}
