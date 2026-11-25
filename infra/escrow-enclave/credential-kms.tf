# Separate key; deliberately does not alter kms.tf or its escrow-key semantics.
locals {
  credential_principals = merge({ "authority-writer" = local.authority_writer_arn }, var.enable_enclave_email ? { "email-sender" = local.email_sender_arn } : {})
  credential_contexts = {
    for purpose, principal in local.credential_principals : purpose => {
      "kms:EncryptionContext:purpose"             = purpose
      "kms:EncryptionContext:tenant"              = var.authority_tenant
      "kms:EncryptionContext:environment"         = var.environment
      "kms:EncryptionContext:authorityGeneration" = var.authority_generation
      "kms:EncryptionContext:principalArn"        = principal
    }
  }
  credential_key_policy = {
    Version = "2012-10-17"
    Statement = concat([
      { Sid = "RootBreakGlassAdministration", Effect = "Allow", Principal = { AWS = local.account_root_arn }, Action = local.kms_admin_actions, Resource = "*",
      Condition = { ArnEquals = { "aws:PrincipalArn" = local.account_root_arn } } },
      { Sid = "AdminManagement", Effect = "Allow", Principal = { AWS = var.kms_admin_role_arn }, Action = local.kms_admin_actions, Resource = "*" },
      { Sid = "DenyRootPolicyChangeWithoutMfa", Effect = "Deny", Principal = "*", Action = ["kms:PutKeyPolicy"], Resource = "*",
      Condition = { ArnEquals = { "aws:PrincipalArn" = local.account_root_arn }, BoolIfExists = { "aws:MultiFactorAuthPresent" = "false" } } },
      { Sid = "DenyGrantsAndAlternativeCrypto", Effect = "Deny", Principal = "*", Action = ["kms:CreateGrant", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DeriveSharedSecret", "kms:GenerateRandom"], Resource = "*" },
      { Sid = "DenyEncryptExceptProvisioner", Effect = "Deny", Principal = "*", Action = ["kms:Encrypt"], Resource = "*",
      Condition = { ArnNotEquals = { "aws:PrincipalArn" = var.kms_admin_role_arn } } },
      { Sid = "DenyDecryptExceptHost", Effect = "Deny", Principal = "*", Action = ["kms:Decrypt"], Resource = "*",
      Condition = { ArnNotEquals = { "aws:PrincipalArn" = aws_iam_role.enclave_host.arn } } },
      { Sid = "DenyUnattestedDecrypt", Effect = "Deny", Principal = "*", Action = ["kms:Decrypt"], Resource = "*",
      Condition = { Null = { "kms:RecipientAttestation:ImageSha384" = "true" } } },
      ], [for pcr in ["PCR0", "PCR1", "PCR2", "ImageSha384"] : {
        Sid       = "DenyDebug${pcr}", Effect = "Deny", Principal = "*", Action = ["kms:Decrypt"], Resource = "*",
        Condition = { StringEqualsIgnoreCase = { "kms:RecipientAttestation:${pcr}" = local.debug_enclave_zero_measurement } }
        }], [for key in ["purpose", "tenant", "environment", "authorityGeneration", "principalArn"] : {
        Sid       = "DenyMissingContext${key}", Effect = "Deny", Principal = "*", Action = ["kms:Encrypt", "kms:Decrypt"], Resource = "*",
        Condition = { Null = { "kms:EncryptionContext:${key}" = "true" } }
        }], [for purpose, context in local.credential_contexts : {
        Sid       = "Provision${replace(purpose, "-", "")}", Effect = "Allow", Principal = { AWS = var.kms_admin_role_arn }, Action = ["kms:Encrypt"], Resource = "*",
        Condition = { StringEquals = context }
        }], flatten([for label, measurement in local.enclave_measurements_by_label : [for purpose, context in local.credential_contexts : {
          Sid = "Decrypt${replace(label, "/[^a-zA-Z0-9]/", "")}${replace(purpose, "-", "")}", Effect = "Allow", Principal = { AWS = aws_iam_role.enclave_host.arn }, Action = ["kms:Decrypt"], Resource = "*",
          Condition = {
            StringEquals = context
            StringEqualsIgnoreCase = {
              "kms:RecipientAttestation:PCR0" = measurement.pcr0
              "kms:RecipientAttestation:PCR1" = measurement.pcr1
              "kms:RecipientAttestation:PCR2" = measurement.pcr2
            }
          }
    }]]))
  }
}
resource "aws_kms_key" "credentials" {
  count                   = var.enable_enrollment_authority ? 1 : 0
  description             = "Attested dedicated authority/email credentials; never the escrow key"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy                  = jsonencode(local.credential_key_policy)
  tags                    = local.common_tags
}
resource "aws_kms_alias" "credentials" {
  count         = var.enable_enrollment_authority ? 1 : 0
  name          = "alias/${local.name_prefix}-credentials"
  target_key_id = aws_kms_key.credentials[0].key_id
}
resource "aws_iam_role_policy" "host_credential_decrypt" {
  count  = var.enable_enrollment_authority ? 1 : 0
  name   = "attested-credential-decrypt"
  role   = aws_iam_role.enclave_host.id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = ["kms:Decrypt"], Resource = aws_kms_key.credentials[0].arn }] })
}
