mock_provider "aws" {
  mock_data "aws_organizations_organization" {
    defaults = { master_account_id = "999999999999", accounts = [{ id = "123456789012", arn = "arn:aws:organizations::999999999999:account/o-test/123456789012", email = "test@example.com", name = "escrow", status = "ACTIVE" }] }
  }
}
run "disabled_has_no_resources" {
  command = apply
  assert {
    condition     = length(aws_organizations_policy.authority) == 0 && length(aws_organizations_policy_attachment.authority) == 0 && output.authority_guardrail_policy_id == null
    error_message = "Guardrail stack must be off by default."
  }
}
run "protects_keys_and_admin_trust_from_org_admin" {
  command = apply
  variables {
    enable_enrollment_authority = true
    account_id                  = "123456789012"
    admin_user_arns             = ["arn:aws:iam::123456789012:user/escrow-security-admin"]
  }
  assert {
    condition     = length(aws_organizations_policy.authority[0].content) <= 5120 && aws_organizations_policy_attachment.authority[0].target_id == "123456789012" && anytrue([for s in local.guardrail.Statement : s.Sid == "DenyAccessKeyManagementExceptMfaAdmin" && s.Effect == "Deny" && alltrue([for action in ["iam:CreateAccessKey", "iam:UpdateAccessKey", "iam:DeleteAccessKey"] : contains(s.Action, action)]) && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == "arn:aws:iam::123456789012:role/escrow-kms-admin"])
    error_message = "SCP must protect all access-key management from everyone except escrow-kms-admin."
  }
  assert {
    condition     = anytrue([for s in local.guardrail.Statement : s.Sid == "DenyAuthorityLifecycleExceptAdmin" && alltrue([for a in ["dynamodb:CreateTable", "dynamodb:ImportTable", "dynamodb:RestoreTableFromBackup", "dynamodb:CreateGlobalTable", "dynamodb:UpdateGlobalTable*"] : contains(s.Action, a)])])
    error_message = "Table-creation actions that DynamoDB resource policies reject must stay in the SCP"
  }

  assert {
    condition     = alltrue([for sid in ["DenyDedicatedConsole", "DenyDedicatedUserTakeover", "DenyAdminRoleTakeover", "DenyBootstrapUserTakeover", "DenyCredentialBucketReconfiguration", "DenyNonWriterAuthorityData", "DenyAlternateAuthorityData", "DenyStandaloneAuthorityWrites", "DenyAuthorityLifecycleExceptAdmin"] : anytrue([for s in local.guardrail.Statement : s.Sid == sid && s.Effect == "Deny"])]) && !strcontains(aws_organizations_policy.authority[0].content, "OrganizationAccountAccessRole")
    error_message = "Org admin must have no deny exception, including takeover, console, policy/lifecycle and alternate API paths."
  }
  assert {
    condition     = anytrue([for s in local.guardrail.Statement : s.Sid == "DenyLeavingOrganization" && s.Action == ["organizations:LeaveOrganization"] && s.Resource == "*" && !can(s.Condition)]) && anytrue([for s in local.guardrail.Statement : s.Sid == "DenyUntrustedAuthorityApis" && s.Action == ["dynamodb:*"] && try(toset(s.Condition.ArnNotEquals["aws:PrincipalArn"]), toset([])) == toset([local.writer, local.admin])]) && anytrue([for s in local.guardrail.Statement : s.Sid == "DenyAlternateAuthorityData" && contains(s.Action, "dynamodb:EnableKinesisStreamingDestination") && !can(s.Condition)])
    error_message = "Member departure, Kinesis extraction and new untrusted table APIs must not bypass the guardrail."
  }
  assert {
    condition     = anytrue([for s in local.guardrail.Statement : s.Sid == "DenyNonSenderSesAccess" && s.Action == ["ses:*"] && s.Resource == "*" && try(toset(s.Condition.ArnNotEquals["aws:PrincipalArn"]), toset([])) == toset([local.sender, local.admin])])
    error_message = "Untrusted account administrators must not reconfigure/archive recovery email."
  }
}
