# Authority is NOT the host-owned audit ledger. No TTL, no in-place rollback.
locals {
  authority_table_name        = "${local.name_prefix}-authority-${coalesce(var.authority_generation, "disabled")}"
  authority_table_arn         = "arn:${data.aws_partition.current.partition}:dynamodb:${var.aws_region}:${data.aws_caller_identity.current.account_id}:table/${local.authority_table_name}"
  authority_writer_name       = "${local.name_prefix}-authority-writer"
  email_sender_name           = "${local.name_prefix}-email-sender"
  authority_writer_arn        = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:user/${local.authority_writer_name}"
  authority_monitor_arn       = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:role/${local.name_prefix}-ledger-monitor-role"
  email_sender_arn            = "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:user/${local.email_sender_name}"
  authority_item_actions      = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:ConditionCheckItem"]
  authority_mutation_actions  = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:ConditionCheckItem"]
  authority_bypass_actions    = ["dynamodb:PartiQL*", "dynamodb:BatchWriteItem", "dynamodb:BatchGetItem", "dynamodb:ExportTableToPointInTime", "dynamodb:EnableKinesisStreamingDestination", "dynamodb:UpdateKinesisStreamingDestination", "dynamodb:DisableKinesisStreamingDestination"]
  authority_lifecycle_actions = ["dynamodb:CreateTable", "dynamodb:DeleteTable", "dynamodb:UpdateTable", "dynamodb:UpdateTimeToLive", "dynamodb:UpdateContinuousBackups", "dynamodb:RestoreTableFromBackup", "dynamodb:RestoreTableToPointInTime", "dynamodb:ImportTable", "dynamodb:PutResourcePolicy", "dynamodb:DeleteResourcePolicy", "dynamodb:CreateGlobalTable", "dynamodb:UpdateGlobalTable*", "dynamodb:TagResource", "dynamodb:UntagResource"]
  # DynamoDB resource policies reject table-creation actions (they cannot target
  # an existing table). The SCP's DenyAuthorityLifecycleExceptAdmin covers those.
  authority_table_scoped_lifecycle_actions = setsubtract(local.authority_lifecycle_actions, ["dynamodb:CreateTable", "dynamodb:RestoreTableFromBackup", "dynamodb:ImportTable", "dynamodb:CreateGlobalTable", "dynamodb:UpdateGlobalTable*"])
  authority_resource_policy = {
    Version = "2012-10-17"
    Statement = [
      { Sid = "DenyUntrustedPrincipalsAllApis", Effect = "Deny", Principal = "*", Action = ["dynamodb:*"], Resource = [local.authority_table_arn, "${local.authority_table_arn}/*"],
      Condition = { ArnNotEquals = { "aws:PrincipalArn" = [local.authority_writer_arn, var.kms_admin_role_arn, local.authority_monitor_arn] } } },
      { Sid = "AllowMonitorReads", Effect = "Allow", Principal = { AWS = local.authority_monitor_arn }, Action = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"], Resource = local.authority_table_arn },
      { Sid = "DenyMonitorNonReads", Effect = "Deny", Principal = "*", NotAction = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"], Resource = [local.authority_table_arn, "${local.authority_table_arn}/*"], Condition = { ArnEquals = { "aws:PrincipalArn" = local.authority_monitor_arn } } },
      { Sid = "DenyEnumerationExceptMonitor", Effect = "Deny", Principal = "*", Action = ["dynamodb:Query", "dynamodb:Scan"], Resource = local.authority_table_arn, Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.authority_monitor_arn } } },
      { Sid = "DenyNonReaderData", Effect = "Deny", Principal = "*", Action = ["dynamodb:GetItem"], Resource = local.authority_table_arn, Condition = { ArnNotEquals = { "aws:PrincipalArn" = [local.authority_writer_arn, local.authority_monitor_arn] } } },
      { Sid = "AllowWriterRead", Effect = "Allow", Principal = { AWS = local.authority_writer_arn }, Action = ["dynamodb:GetItem"], Resource = local.authority_table_arn },
      { Sid = "AllowWriterTransactions", Effect = "Allow", Principal = { AWS = local.authority_writer_arn }, Action = local.authority_mutation_actions, Resource = local.authority_table_arn,
      Condition = { StringEquals = { "dynamodb:EnclosingOperation" = "TransactWriteItems" } } },
      # Includes root, the host, OrganizationAccountAccessRole and even break-glass.
      { Sid = "DenyNonWriterData", Effect = "Deny", Principal = "*", Action = local.authority_mutation_actions, Resource = local.authority_table_arn,
      Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.authority_writer_arn } } },
      { Sid = "DenyNonTransactionalWrites", Effect = "Deny", Principal = "*", Action = local.authority_mutation_actions, Resource = local.authority_table_arn,
      Condition = { StringNotEqualsIfExists = { "dynamodb:EnclosingOperation" = "TransactWriteItems" } } },
      { Sid = "DenyAlternateDataApis", Effect = "Deny", Principal = "*", Action = local.authority_bypass_actions, Resource = [local.authority_table_arn, "${local.authority_table_arn}/index/*"] },
      { Sid = "DenyLifecycleExceptBreakGlass", Effect = "Deny", Principal = "*", Action = local.authority_table_scoped_lifecycle_actions, Resource = local.authority_table_arn,
      Condition = { ArnNotEquals = { "aws:PrincipalArn" = var.kms_admin_role_arn } } },
      { Sid = "DenyTtlAlways", Effect = "Deny", Principal = "*", Action = ["dynamodb:UpdateTimeToLive"], Resource = local.authority_table_arn },
    ]
  }
  authority_writer_policy = {
    Version = "2012-10-17"
    Statement = [
      # Transaction APIs are authorized by their underlying item actions, NOT
      # fictional IAM actions named TransactGetItems/TransactWriteItems.
      { Effect = "Allow", Action = ["dynamodb:GetItem"], Resource = local.authority_table_arn },
      { Effect = "Allow", Action = local.authority_mutation_actions, Resource = local.authority_table_arn,
      Condition = { StringEquals = { "dynamodb:EnclosingOperation" = "TransactWriteItems" } } },
      # The table is encrypted with the shared customer-managed key, so every
      # read and write also needs that key, usable only through DynamoDB.
      { Effect = "Allow", Action = ["kms:Decrypt", "kms:DescribeKey"], Resource = aws_kms_key.s3.arn,
      Condition = { StringEquals = { "kms:ViaService" = "dynamodb.${var.aws_region}.amazonaws.com", "kms:CallerAccount" = data.aws_caller_identity.current.account_id } } },
    ]
  }
}
resource "aws_dynamodb_table" "authority" {
  count                       = var.enable_enrollment_authority ? 1 : 0
  name                        = local.authority_table_name
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "pk"
  range_key                   = "sk"
  deletion_protection_enabled = true
  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.s3.arn
  }
  # PITR is for disaster investigation/recovery, NEVER an authority rollback.
  # A restore requires break-glass review and a NEW measured authority generation.
  point_in_time_recovery { enabled = true }
  tags = merge(local.common_tags, { AuthorityGeneration = var.authority_generation })
  lifecycle {
    precondition {
      condition     = data.aws_partition.current.partition == "aws" && var.kms_admin_role_arn == "arn:aws:iam::${data.aws_caller_identity.current.account_id}:role/escrow-kms-admin"
      error_message = "Authority requires the bootstrap MFA escrow-kms-admin role in this commercial AWS member account."
    }
  }
}
resource "aws_dynamodb_resource_policy" "authority" {
  count        = var.enable_enrollment_authority ? 1 : 0
  resource_arn = aws_dynamodb_table.authority[0].arn
  policy       = jsonencode(local.authority_resource_policy)
  depends_on   = [aws_iam_user.authority_writer, aws_iam_role.ledger_monitor]
}
resource "aws_iam_user" "authority_writer" {
  count         = var.enable_enrollment_authority ? 1 : 0
  name          = local.authority_writer_name
  force_destroy = false
  tags          = local.common_tags
}
resource "aws_iam_user_policy" "authority_writer" {
  count  = var.enable_enrollment_authority ? 1 : 0
  name   = "authority-data-plane-only"
  user   = aws_iam_user.authority_writer[0].name
  policy = jsonencode(local.authority_writer_policy)
}
