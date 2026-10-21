mock_provider "aws" {
  mock_data "aws_organizations_organization" {
    defaults = { master_account_id = "999999999999", accounts = [{ id = "123456789012", arn = "arn:aws:organizations::999999999999:account/o-test/123456789012", email = "test@example.com", name = "escrow", status = "ACTIVE" }] }
  }
}
run "disabled_has_no_resources" {
  command = apply
  assert {
    condition     = length(aws_organizations_policy.authority) == 0 && length(aws_organizations_policy_attachment.authority) == 0 && output.authority_guardrail_policy_id == null && length(aws_organizations_policy.authority_monitor) == 0 && length(aws_organizations_policy_attachment.authority_monitor) == 0 && output.authority_monitor_guardrail_policy_id == null
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
    condition = alltrue([for action in ["cloudtrail:StopLogging", "cloudtrail:DeleteTrail", "cloudtrail:UpdateTrail", "cloudtrail:PutEventSelectors", "cloudtrail:PutInsightSelectors"] :
      anytrue([for s in local.monitor_guardrail.Statement : s.Sid == "DenyTrailTampering" && s.Effect == "Deny" && contains(try(s.Action, []), action) && s.Resource == "arn:aws:cloudtrail:*:123456789012:trail/escrow-enclave-staging-audit" && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == local.admin])
      ]) && alltrue([for action in ["s3:PutBucketPolicy", "s3:DeleteBucketPolicy", "s3:PutLifecycleConfiguration", "s3:PutBucketObjectLockConfiguration", "s3:PutBucketPublicAccessBlock", "s3:PutBucketOwnershipControls", "s3:PutBucketAcl", "s3:PutObjectAcl", "s3:PutObjectVersionAcl"] :
      anytrue([for s in local.monitor_guardrail.Statement : s.Sid == "DenyTrailBucketReconfiguration" && s.Effect == "Deny" && contains(try(s.Action, []), action) && toset(s.Resource) == toset(["arn:aws:s3:::learncard-escrow-cloudtrail-staging-123456789012", "arn:aws:s3:::learncard-escrow-cloudtrail-staging-123456789012/*"]) && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == local.admin])
    ])
    error_message = "Trail and log-bucket tampering must be denied with exactly the existing MFA-admin ARN exception."
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
    condition     = anytrue([for s in local.guardrail.Statement : s.Sid == "DenyLeavingOrganization" && s.Action == ["organizations:LeaveOrganization"] && s.Resource == "*" && !can(s.Condition)]) && anytrue([for s in local.guardrail.Statement : s.Sid == "DenyUntrustedAuthorityApis" && s.Action == ["dynamodb:*"] && try(toset(s.Condition.ArnNotEquals["aws:PrincipalArn"]), toset([])) == toset([local.writer, local.admin, local.monitor])]) && anytrue([for s in local.guardrail.Statement : s.Sid == "DenyAlternateAuthorityData" && contains(s.Action, "dynamodb:EnableKinesisStreamingDestination") && !can(s.Condition)])
    error_message = "Member departure, Kinesis extraction and new untrusted table APIs must not bypass the guardrail."
  }
  assert {
    condition     = anytrue([for s in local.guardrail.Statement : s.Sid == "DenyNonSenderSesAccess" && s.Action == ["ses:*"] && s.Resource == "*" && try(toset(s.Condition.ArnNotEquals["aws:PrincipalArn"]), toset([])) == toset([local.sender, local.admin])])
    error_message = "Untrusted account administrators must not reconfigure/archive recovery email."
  }
  assert {
    condition     = length(aws_organizations_policy.authority_monitor[0].content) <= 5120 && aws_organizations_policy_attachment.authority_monitor[0].target_id == "123456789012" && alltrue([for sid in ["DenyMonitorNonReads", "DenyUntrustedReads", "DenyNonMonitorEnumeration", "DenyMonitorRoleTakeover", "DenyMonitorCodeTakeover", "DenyMonitorTrustTampering"] : anytrue([for s in local.monitor_guardrail.Statement : s.Sid == sid && s.Effect == "Deny"])]) && !strcontains(aws_organizations_policy.authority_monitor[0].content, "OrganizationAccountAccessRole")
    error_message = "The second attached SCP must fence read access, IAM/PassRole, Lambda code and SSM trust takeover."
  }
  assert {
    condition     = anytrue([for s in local.monitor_guardrail.Statement : s.Sid == "DenyMonitorNonReads" && try(toset(s.NotAction), toset([])) == toset(["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]) && try(s.Condition.ArnEquals["aws:PrincipalArn"], "") == local.monitor]) && anytrue([for s in local.monitor_guardrail.Statement : s.Sid == "DenyUntrustedReads" && try(toset(s.Condition.ArnNotEquals["aws:PrincipalArn"]), toset([])) == toset([local.writer, local.monitor])])
    error_message = "Read-only exceptions must not include administrators or let the monitor mutate authority."
  }
}
