# Human-applied before the service root. Existing deploy_services already grants
# WAF (including association/logging), named SNS/Events/alarms/metric filters and
# cross-region named backup vaults. PassRole to Backup is in deploy-iam.tf.
data "aws_iam_policy_document" "deploy_observability" {
  statement {
    sid       = "CreateBackupCopyKey"
    actions   = ["kms:CreateKey"]
    resources = ["*"]
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Project"
      values   = ["learncard-keycloak"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Environment"
      values   = [var.environment]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:RequestTag/Purpose"
      values   = ["keycloak-backup-copy"]
    }
  }
  statement {
    sid = "ManageBackupCopyKey"
    actions = [
      "kms:DescribeKey", "kms:GetKeyPolicy", "kms:PutKeyPolicy", "kms:GetKeyRotationStatus",
      "kms:EnableKeyRotation", "kms:DisableKeyRotation", "kms:UpdateKeyDescription",
      "kms:ListResourceTags", "kms:TagResource", "kms:UntagResource",
      "kms:ScheduleKeyDeletion", "kms:CancelKeyDeletion", "kms:GenerateDataKey", "kms:Decrypt"
    ]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["learncard-keycloak"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = [var.environment]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Purpose"
      values   = ["keycloak-backup-copy"]
    }
  }
  statement {
    sid       = "BackupCopyKeyGrant"
    actions   = ["kms:CreateGrant"]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["learncard-keycloak"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = [var.environment]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Purpose"
      values   = ["keycloak-backup-copy"]
    }
    condition {
      test     = "Bool"
      variable = "kms:GrantIsForAWSResource"
      values   = ["true"]
    }
  }
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
    condition {
      test     = "StringEquals"
      variable = "aws:RequestedRegion"
      values   = [var.aws_region]
    }
  }
  statement {
    sid       = "BackupVaultStorage"
    actions   = ["backup-storage:MountCapsule"]
    resources = ["*"]
  }
  statement {
    sid       = "BackupVaultManagedKey"
    actions   = ["kms:GenerateDataKey", "kms:Decrypt"]
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
    sid       = "DescribeBackupVaultKey"
    actions   = ["kms:DescribeKey"]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "ForAnyValue:StringEquals"
      variable = "kms:ResourceAliases"
      values   = ["alias/aws/backup"]
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
  # RDS has no tag-on-create discriminator. Reject foreign existing ownership
  # tags, including attempts to change them to our values. Untagged AWS-generated
  # snapshot ARNs remain a documented service-controlled namespace exception.
  dynamic "statement" {
    for_each = { Project = "learncard-keycloak", Environment = var.environment }
    content {
      effect    = "Deny"
      actions   = ["rds:AddTagsToResource", "rds:CopyDBClusterSnapshot", "rds:DeleteDBClusterSnapshot"]
      resources = ["arn:${local.partition}:rds:*:${local.account_id}:cluster-snapshot:awsbackup:job-*"]
      condition {
        test     = "Null"
        variable = "aws:ResourceTag/${statement.key}"
        values   = ["false"]
      }
      condition {
        test     = "StringNotEquals"
        variable = "aws:ResourceTag/${statement.key}"
        values   = [statement.value]
      }
    }
  }
  statement {
    actions   = ["kms:DescribeKey", "kms:Decrypt", "kms:GenerateDataKey*", "kms:ReEncrypt*", "kms:CreateGrant"]
    resources = ["arn:${local.partition}:kms:*:${local.account_id}:key/*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-backup"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Project"
      values   = ["learncard-keycloak"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Environment"
      values   = [var.environment]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:ResourceTag/Purpose"
      values   = ["keycloak-backup-copy"]
    }
  }
  statement {
    actions   = ["rds:CreateDBClusterSnapshot", "rds:CopyDBClusterSnapshot", "rds:DeleteDBClusterSnapshot", "rds:AddTagsToResource"]
    resources = ["arn:${local.partition}:rds:*:${local.account_id}:cluster-snapshot:awsbackup:job-*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-backup"]
    }
  }
  statement {
    actions   = ["backup:CopyFromBackupVault", "backup:DescribeBackupVault"]
    resources = ["arn:${local.partition}:backup:*:${local.account_id}:backup-vault:${local.name}-*"]
    condition {
      test     = "ArnEquals"
      variable = "aws:PrincipalArn"
      values   = ["${local.iam_prefix}:role/${local.name}-backup"]
    }
  }
  statement {
    actions   = ["kms:Decrypt", "kms:GenerateDataKey*", "kms:ReEncrypt*"]
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
    actions   = ["kms:DescribeKey"]
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
  }
  statement {
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
