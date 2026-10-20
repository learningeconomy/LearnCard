# Run ONLY from the Organizations management account (or authorized delegated
# administrator). IAM users cannot carry resource policies protecting their keys
# from other callers. This SCP is a prerequisite, not an identity-policy imitation.
terraform {
  required_version = ">= 1.9"
  required_providers {
    aws = { source = "hashicorp/aws", version = "~> 5.0" }
  }
  backend "s3" {}
}
variable "enable_enrollment_authority" {
  type    = bool
  default = false
}
variable "account_id" {
  type    = string
  default = null
  validation {
    condition     = !var.enable_enrollment_authority || can(regex("^[0-9]{12}$", var.account_id))
    error_message = "Provide the escrow MEMBER account ID. SCPs do not protect the management account."
  }
}
variable "environment" {
  type    = string
  default = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Use staging or production."
  }
}
variable "admin_user_arns" {
  type        = list(string)
  default     = []
  description = "Exact existing bootstrap human MFA-user ARNs. Protect their credentials/MFA against organization-account admin takeover."
  validation {
    condition     = !var.enable_enrollment_authority || (length(var.admin_user_arns) > 0 && alltrue([for arn in var.admin_user_arns : can(regex("^arn:aws:iam::${coalesce(var.account_id, "invalid")}:user/[A-Za-z0-9_+=,.@-]+$", arn))]))
    error_message = "Provide the exact bootstrap MFA users in the escrow member account."
  }
}
locals {
  account = coalesce(var.account_id, "000000000000")
  prefix  = "escrow-enclave-${var.environment}"
  admin   = "arn:aws:iam::${local.account}:role/escrow-kms-admin"
  writer  = "arn:aws:iam::${local.account}:user/${local.prefix}-authority-writer"
  sender  = "arn:aws:iam::${local.account}:user/${local.prefix}-email-sender"
  monitor = "arn:aws:iam::${local.account}:role/${local.prefix}-ledger-monitor-role"
  tables  = "arn:aws:dynamodb:*:${local.account}:table/${local.prefix}-authority-*"
  guardrail = {
    Version = "2012-10-17"
    Statement = [
      { Sid = "DenyLeavingOrganization", Effect = "Deny", Action = ["organizations:LeaveOrganization"], Resource = "*" },
      # In this dedicated escrow account, block untrusted SES configuration /
      # archiving changes as well as forged sends, not just sender-key creation.
      { Sid = "DenyNonSenderSesAccess", Effect = "Deny", Action = ["ses:*"], Resource = "*", Condition = { ArnNotEquals = { "aws:PrincipalArn" = [local.sender, local.admin] } } },
      { Sid = "DenyUntrustedAuthorityApis", Effect = "Deny", Action = ["dynamodb:*"], Resource = local.tables, Condition = { ArnNotEquals = { "aws:PrincipalArn" = [local.writer, local.admin, local.monitor] } } },
      { Sid = "DenyAccessKeyManagementExceptMfaAdmin", Effect = "Deny", Action = ["iam:CreateAccessKey", "iam:UpdateAccessKey", "iam:DeleteAccessKey"], Resource = [local.writer, local.sender], Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyDedicatedConsole", Effect = "Deny", Action = ["iam:CreateLoginProfile", "iam:UpdateLoginProfile"], Resource = [local.writer, local.sender] },
      { Sid = "DenyDedicatedUserTakeover", Effect = "Deny", Action = ["iam:*"], Resource = [local.writer, local.sender], Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyAdminRoleTakeover", Effect = "Deny", Action = ["iam:*"], Resource = local.admin, Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyCredentialBucketReconfiguration", Effect = "Deny", Action = ["s3:PutBucketPolicy", "s3:DeleteBucketPolicy", "s3:PutLifecycleConfiguration", "s3:PutBucketVersioning"], Resource = "arn:aws:s3:::learncard-escrow-enclave-${var.environment}-${local.account}-artifacts", Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyBootstrapUserTakeover", Effect = "Deny", Action = ["iam:*"], Resource = var.admin_user_arns, Condition = { ArnNotEquals = { "aws:PrincipalArn" = concat([local.admin], var.admin_user_arns) } } },
      { Sid = "DenyNonWriterAuthorityData", Effect = "Deny", Action = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:ConditionCheckItem"], Resource = local.tables, Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.writer } } },
      { Sid = "DenyAlternateAuthorityData", Effect = "Deny", Action = ["dynamodb:PartiQL*", "dynamodb:BatchWriteItem", "dynamodb:BatchGetItem", "dynamodb:ExportTableToPointInTime", "dynamodb:UpdateTimeToLive", "dynamodb:EnableKinesisStreamingDestination", "dynamodb:UpdateKinesisStreamingDestination", "dynamodb:DisableKinesisStreamingDestination"], Resource = local.tables },
      { Sid = "DenyStandaloneAuthorityWrites", Effect = "Deny", Action = ["dynamodb:PutItem", "dynamodb:UpdateItem", "dynamodb:DeleteItem", "dynamodb:ConditionCheckItem"], Resource = local.tables, Condition = { StringNotEqualsIfExists = { "dynamodb:EnclosingOperation" = "TransactWriteItems" } } },
      { Sid = "DenyAuthorityLifecycleExceptAdmin", Effect = "Deny", Action = ["dynamodb:CreateTable", "dynamodb:DeleteTable", "dynamodb:UpdateTable", "dynamodb:UpdateContinuousBackups", "dynamodb:RestoreTableFromBackup", "dynamodb:RestoreTableToPointInTime", "dynamodb:ImportTable", "dynamodb:PutResourcePolicy", "dynamodb:DeleteResourcePolicy", "dynamodb:CreateGlobalTable", "dynamodb:UpdateGlobalTable*", "dynamodb:TagResource", "dynamodb:UntagResource"], Resource = local.tables, Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
    ]
  }
}

# A second reviewed SCP keeps both documents below 5120 bytes. BOTH attachments
# are mandatory: this closes the observer exception in the first policy.
locals {
  monitor_guardrail = {
    Version = "2012-10-17"
    Statement = [
      { Sid = "DenyMonitorNonReads", Effect = "Deny", NotAction = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"], Resource = local.tables, Condition = { ArnEquals = { "aws:PrincipalArn" = local.monitor } } },
      { Sid = "DenyUntrustedReads", Effect = "Deny", Action = ["dynamodb:GetItem"], Resource = local.tables, Condition = { ArnNotEquals = { "aws:PrincipalArn" = [local.writer, local.monitor] } } },
      { Sid = "DenyNonMonitorEnumeration", Effect = "Deny", Action = ["dynamodb:Query", "dynamodb:Scan"], Resource = local.tables, Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.monitor } } },
      { Sid = "DenyMonitorRoleTakeover", Effect = "Deny", Action = ["iam:*"], Resource = local.monitor, Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyMonitorCodeTakeover", Effect = "Deny", Action = ["lambda:UpdateFunction*", "lambda:DeleteFunction", "lambda:AddPermission", "lambda:RemovePermission", "lambda:PublishVersion", "lambda:CreateAlias", "lambda:UpdateAlias", "lambda:DeleteAlias"], Resource = ["arn:aws:lambda:*:${local.account}:function:${local.prefix}-ledger-monitor", "arn:aws:lambda:*:${local.account}:function:${local.prefix}-ledger-monitor:*"], Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyMonitorTrustTampering", Effect = "Deny", Action = ["ssm:PutParameter", "ssm:DeleteParameter", "ssm:DeleteParameters", "ssm:LabelParameterVersion"], Resource = "arn:aws:ssm:*:${local.account}:parameter/${local.prefix}/authority-monitor-trust", Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyTrailTampering", Effect = "Deny", Action = ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail", "cloudtrail:UpdateTrail", "cloudtrail:PutEventSelectors", "cloudtrail:PutInsightSelectors"], Resource = "arn:aws:cloudtrail:*:${local.account}:trail/${local.prefix}-audit", Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
      { Sid = "DenyTrailBucketReconfiguration", Effect = "Deny", Action = ["s3:PutBucketPolicy", "s3:DeleteBucketPolicy", "s3:PutLifecycleConfiguration", "s3:PutBucketObjectLockConfiguration", "s3:PutBucketVersioning", "s3:PutEncryptionConfiguration", "s3:PutReplicationConfiguration"], Resource = "arn:aws:s3:::learncard-escrow-cloudtrail-${var.environment}-${local.account}", Condition = { ArnNotEquals = { "aws:PrincipalArn" = local.admin } } },
    ]
  }
}
resource "aws_organizations_policy" "authority_monitor" {
  count   = var.enable_enrollment_authority ? 1 : 0
  name    = "${local.prefix}-authority-monitor-guardrail"
  type    = "SERVICE_CONTROL_POLICY"
  content = jsonencode(local.monitor_guardrail)
  lifecycle {
    precondition {
      condition     = data.aws_organizations_organization.current[0].master_account_id != var.account_id && contains([for account in data.aws_organizations_organization.current[0].accounts : account.id], var.account_id)
      error_message = "The target must be an organization member, never management."
    }
    precondition {
      condition     = length(jsonencode(local.monitor_guardrail)) <= 5120
      error_message = "Monitor guardrail exceeds the SCP size limit."
    }
  }
}
resource "aws_organizations_policy_attachment" "authority_monitor" {
  count     = var.enable_enrollment_authority ? 1 : 0
  policy_id = aws_organizations_policy.authority_monitor[0].id
  target_id = var.account_id
}
output "authority_monitor_guardrail_policy_id" {
  value = try(aws_organizations_policy.authority_monitor[0].id, null)
}
resource "aws_organizations_policy" "authority" {
  count      = var.enable_enrollment_authority ? 1 : 0
  name       = "${local.prefix}-authority-guardrail"
  type       = "SERVICE_CONTROL_POLICY"
  content    = jsonencode(local.guardrail)
  depends_on = [aws_organizations_policy_attachment.authority_monitor]
  lifecycle {
    precondition {
      condition     = data.aws_organizations_organization.current[0].master_account_id != var.account_id && contains([for account in data.aws_organizations_organization.current[0].accounts : account.id], var.account_id)
      error_message = "The target must be a member of this organization, never its SCP-exempt management account."
    }
    precondition {
      condition     = length(jsonencode(local.guardrail)) <= 5120
      error_message = "Guardrail exceeds the SCP size limit; split reviewed policies rather than removing denies."
    }
  }
}
data "aws_organizations_organization" "current" {
  count = var.enable_enrollment_authority ? 1 : 0
}
resource "aws_organizations_policy_attachment" "authority" {
  count     = var.enable_enrollment_authority ? 1 : 0
  policy_id = aws_organizations_policy.authority[0].id
  target_id = var.account_id
}
output "authority_guardrail_policy_id" {
  value = try(aws_organizations_policy.authority[0].id, null)
}
