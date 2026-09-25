provider "aws" {
  alias               = "backup_copy"
  region              = var.backup_copy_region
  allowed_account_ids = [var.expected_account_id]
  default_tags {
    tags = merge(var.tags, {
      Project         = "learncard-keycloak", ManagedBy = "terraform", Environment = var.environment,
      KeycloakVersion = var.keycloak_version, Root = "service"
    })
  }
}

resource "aws_backup_vault" "keycloak" {
  count         = var.enable_aws_backup ? 1 : 0
  name          = "${local.name}-backup"
  force_destroy = false
}

resource "aws_backup_vault" "copy" {
  provider      = aws.backup_copy
  count         = var.enable_aws_backup ? 1 : 0
  name          = "${local.name}-backup-copy"
  kms_key_arn   = aws_kms_key.backup_copy[0].arn
  force_destroy = false
}

# Aurora copies cannot use alias/aws/backup. A dedicated CMK also avoids relying
# on alias/aws/rds having been initialized in the destination region.
resource "aws_kms_key" "backup_copy" {
  provider                = aws.backup_copy
  count                   = var.enable_aws_backup ? 1 : 0
  description             = "${local.name}-backup-copy"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  tags                    = { Name = "${local.name}-backup-copy", Purpose = "keycloak-backup-copy" }
  # Default key policy delegates to this account's constrained IAM identities.
  lifecycle {
    prevent_destroy = true
  }
}

resource "aws_iam_role" "backup" {
  count                = var.enable_aws_backup ? 1 : 0
  name                 = "${local.name}-backup"
  permissions_boundary = local.workload_boundary
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow", Action = "sts:AssumeRole", Principal = { Service = "backup.amazonaws.com" }
      Condition = { StringEquals = { "aws:SourceAccount" = local.account_id } }
    }]
  })
}

resource "aws_iam_role_policy" "backup" {
  count = var.enable_aws_backup ? 1 : 0
  name  = "${local.name}-backup"
  role  = aws_iam_role.backup[0].id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["rds:DescribeDBClusters", "rds:DescribeDBClusterSnapshots", "rds:ListTagsForResource"], Resource = "*" },
      {
        Effect   = "Allow", Action = ["rds:CreateDBClusterSnapshot", "rds:CopyDBClusterSnapshot", "rds:AddTagsToResource"],
        Resource = [aws_rds_cluster.keycloak.arn, "arn:${local.partition}:rds:*:${local.account_id}:cluster-snapshot:awsbackup:job-*"]
      },
      {
        Effect    = "Allow", Action = ["rds:DeleteDBClusterSnapshot"],
        Resource  = "arn:${local.partition}:rds:*:${local.account_id}:cluster-snapshot:awsbackup:job-*",
        Condition = { StringEquals = { "aws:ResourceTag/Project" = "learncard-keycloak", "aws:ResourceTag/Environment" = var.environment } }
      },
      {
        Effect   = "Allow", Action = ["backup:CopyIntoBackupVault", "backup:CopyFromBackupVault", "backup:DescribeBackupVault"],
        Resource = [aws_backup_vault.keycloak[0].arn, aws_backup_vault.copy[0].arn]
      },
      {
        Effect   = "Allow", Action = ["kms:DescribeKey", "kms:Decrypt", "kms:GenerateDataKey*", "kms:ReEncrypt*"],
        Resource = "arn:${local.partition}:kms:*:${local.account_id}:key/*",
        Condition = {
          "ForAnyValue:StringEquals" = { "kms:ResourceAliases" = ["alias/aws/rds", "alias/aws/backup"] },
          StringLike                 = { "kms:ViaService" = ["rds.*.amazonaws.com", "backup.*.amazonaws.com"] }
        }
      },
      {
        Effect = "Allow", Action = ["kms:CreateGrant"], Resource = "arn:${local.partition}:kms:*:${local.account_id}:key/*",
        Condition = {
          "ForAnyValue:StringEquals" = { "kms:ResourceAliases" = ["alias/aws/rds", "alias/aws/backup"] },
          Bool                       = { "kms:GrantIsForAWSResource" = "true" }
        }
      },
      {
        Effect   = "Allow", Action = ["kms:DescribeKey", "kms:Decrypt", "kms:GenerateDataKey*", "kms:ReEncrypt*"],
        Resource = aws_kms_key.backup_copy[0].arn
      },
      {
        Effect    = "Allow", Action = ["kms:CreateGrant"], Resource = aws_kms_key.backup_copy[0].arn,
        Condition = { Bool = { "kms:GrantIsForAWSResource" = "true" } }
      }
    ]
  })
}

resource "aws_backup_plan" "keycloak" {
  count = var.enable_aws_backup ? 1 : 0
  name  = "${local.name}-daily"
  rule {
    rule_name         = "${local.name}-daily"
    target_vault_name = aws_backup_vault.keycloak[0].name
    schedule          = "cron(0 7 * * ? *)"
    start_window      = 60
    completion_window = 180
    recovery_point_tags = {
      Project = "learncard-keycloak", Environment = var.environment, ManagedBy = "terraform"
    }
    lifecycle {
      delete_after = 35
    }
    copy_action {
      destination_vault_arn = aws_backup_vault.copy[0].arn
      lifecycle {
        delete_after = 35
      }
    }
  }
}

resource "aws_backup_selection" "keycloak" {
  count        = var.enable_aws_backup ? 1 : 0
  name         = "${local.name}-aurora"
  plan_id      = aws_backup_plan.keycloak[0].id
  iam_role_arn = aws_iam_role.backup[0].arn
  resources    = [aws_rds_cluster.keycloak.arn]
  depends_on   = [aws_iam_role_policy.backup]
}
