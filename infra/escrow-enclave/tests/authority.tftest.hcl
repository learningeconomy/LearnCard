# ALL provider calls are mocked. New policies use local jsonencode, so assertions
# inspect real policy computations rather than mocked aws_iam_policy_document JSON.
mock_provider "aws" {
  mock_resource "aws_launch_template" { defaults = { id = "lt-0123456789abcdef0" } }
  mock_resource "aws_iam_role" { defaults = { arn = "arn:aws:iam::123456789012:role/test" } }
  mock_resource "aws_sns_topic" { defaults = { arn = "arn:aws:sns:us-east-1:123456789012:monitor" } }
  mock_resource "aws_sqs_queue" { defaults = { arn = "arn:aws:sqs:us-east-1:123456789012:dlq", id = "https://sqs.us-east-1.amazonaws.com/123456789012/dlq" } }
  mock_resource "aws_lambda_function" { defaults = { arn = "arn:aws:lambda:us-east-1:123456789012:function:monitor" } }
  mock_resource "aws_lb" { defaults = { arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/net/test/0123456789abcdef" } }
  mock_resource "aws_lb_target_group" { defaults = { arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/0123456789abcdef" } }
  mock_resource "aws_dynamodb_table" { defaults = { arn = "arn:aws:dynamodb:us-east-1:123456789012:table/test", stream_arn = "arn:aws:dynamodb:us-east-1:123456789012:table/test/stream/2026-01-01T00:00:00.000" } }
  mock_resource "aws_kms_key" { defaults = { arn = "arn:aws:kms:us-east-1:123456789012:key/00000000-1111-2222-3333-444444444444", key_id = "00000000-1111-2222-3333-444444444444" } }
  mock_resource "aws_cloudwatch_event_rule" { defaults = { arn = "arn:aws:events:us-east-1:123456789012:rule/test" } }
  mock_resource "aws_s3_bucket" { defaults = { arn = "arn:aws:s3:::test-artifacts" } }
  mock_data "aws_caller_identity" { defaults = { account_id = "123456789012" } }
  mock_data "aws_partition" { defaults = { partition = "aws" } }
  mock_data "aws_subnet" { defaults = { map_public_ip_on_launch = false } }
  mock_data "aws_iam_policy_document" { defaults = { json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}" } }
  mock_resource "aws_ses_domain_dkim" { defaults = { dkim_tokens = ["one", "two", "three"] } }
  mock_resource "aws_route53_zone" { defaults = { name_servers = ["ns1.example.org", "ns2.example.org"], zone_id = "Z123456789" } }
}
mock_provider "aws" {
  alias = "governance"
  mock_resource "aws_sqs_queue" { defaults = { arn = "arn:aws:sqs:us-east-1:123456789012:global-dlq", id = "https://sqs.us-east-1.amazonaws.com/123456789012/global-dlq" } }
  mock_resource "aws_sns_topic" { defaults = { arn = "arn:aws:sns:us-east-1:123456789012:global-failures" } }
  mock_resource "aws_cloudwatch_event_rule" { defaults = { arn = "arn:aws:events:us-east-1:123456789012:rule/global" } }
}
override_data {
  target = data.aws_subnet.selected["subnet-0000000000000001"]
  values = { availability_zone = "us-east-1a", map_public_ip_on_launch = false }
}
override_data {
  target = data.aws_subnet.selected["subnet-0000000000000002"]
  values = { availability_zone = "us-east-1b", map_public_ip_on_launch = false }
}
override_resource {
  target = aws_iam_role.enclave_host
  values = { arn = "arn:aws:iam::123456789012:role/escrow-enclave-staging-host-role" }
}
variables {
  environment                         = "staging"
  vpc_id                              = "vpc-0123456789abcdef0"
  private_subnet_ids                  = ["subnet-0000000000000001", "subnet-0000000000000002"]
  lca_api_security_group_id           = "sg-0123456789abcdef0"
  eif_s3_uri                          = "s3://test-artifacts/test.eif"
  enclave_image_version               = "test"
  kms_admin_role_arn                  = "arn:aws:iam::123456789012:role/escrow-kms-admin"
  host_binary_s3_uri                  = "s3://test-artifacts/host"
  host_binary_sha256                  = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  escrow_key_id                       = "test-key"
  host_bearer_token_parameter_name    = "/test/bearer"
  host_tls_certificate_parameter_name = "/test/cert"
  host_tls_private_key_parameter_name = "/test/key"
  monitor_zip_path                    = "tests/fixtures/monitor-bootstrap.zip"
  monitor_tenant                      = "learncard"
  monitor_public_key_parameter_name   = "/test/monitor"
  enclave_measurements = [
    { label = "n", pcr0 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", pcr1 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", pcr2 = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" },
    { label = "n1", pcr0 = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", pcr1 = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", pcr2 = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" },
  ]
}

run "disabled_is_structurally_a_noop" {
  command = apply
  assert {
    condition = alltrue([
      length(aws_dynamodb_table.authority) == 0, length(aws_dynamodb_resource_policy.authority) == 0,
      length(aws_iam_user.authority_writer) == 0, length(aws_iam_user.email_sender) == 0,
      length(aws_iam_user_policy.authority_writer) == 0, length(aws_iam_user_policy.email_sender) == 0,
      length(aws_kms_key.credentials) == 0, length(aws_kms_alias.credentials) == 0,
      length(aws_iam_role_policy.host_credential_decrypt) == 0,
      length(aws_ses_domain_identity.enclave) == 0, length(aws_ses_domain_dkim.enclave) == 0,
      length(aws_ses_domain_mail_from.enclave) == 0, length(aws_ses_configuration_set.enclave) == 0,
      length(aws_ses_event_destination.enclave) == 0, length(aws_route53_zone.sending) == 0,
      length(aws_route53_record.sending) == 0, length(aws_cloudwatch_event_rule.authority_governance) == 0,
      length(aws_cloudwatch_event_target.authority_governance) == 0,
      length(aws_cloudwatch_event_rule.authority_global) == 0, length(aws_cloudwatch_event_target.authority_global) == 0,
      length(aws_iam_role.authority_global_events) == 0, length(aws_iam_role_policy.authority_global_events) == 0,
      length(aws_sqs_queue.authority_global_dlq) == 0, length(aws_sqs_queue_policy.authority_global_dlq) == 0,
      length(aws_sns_topic.authority_global_failures) == 0, length(aws_sns_topic_policy.authority_global_failures) == 0,
      length(aws_sns_topic_subscription.authority_global_failures) == 0, length(aws_cloudwatch_metric_alarm.authority_global_failures) == 0,
      output.enrollment_authority_configuration == null, output.enclave_email_configuration == null,
      output.credential_ciphertext_objects == null, output.sending_dns_records == null, output.sending_zone_name_servers == null,
      output.global_governance_failure_topic_arn == null,
    ])
    error_message = "Every new resource/output must be absent when disabled."
  }
  assert {
    # Hash of the accepted pre-infrastructure template. The only interpolation
    # added to it renders the empty string when disabled: identical user_data.
    condition     = sha256(replace(file("${path.module}/templates/user-data.sh.tftpl"), "$${authority_setup}", "")) == "4f2c960e21a5276dbaa42aec32ee06369d50238a178767e8d116674e2ad010af"
    error_message = "Disabled user-data must remain byte-identical to the baseline."
  }
  assert {
    condition     = length(local.bucket_extra_policy_documents.artifacts) == 1 && length(jsondecode(aws_sns_topic_policy.monitor.policy).Statement) == 2 && length(jsondecode(aws_sqs_queue_policy.monitor_dlq.policy).Statement[0].Condition.ArnEquals["aws:SourceArn"]) == 2 && !strcontains(base64decode(aws_launch_template.enclave_host.user_data), "CREDENTIAL_OBJECT")
    error_message = "Existing bucket/SNS/DLQ policies and host settings must not change while disabled."
  }
}
run "authority_writer_is_only_data_principal" {
  command = apply
  variables {
    enable_enrollment_authority   = true
    authority_generation          = "g1"
    authority_tenant              = "learncard"
    authority_guardrail_policy_id = "p-12345678"
  }
  assert {
    condition     = aws_dynamodb_table.authority[0].billing_mode == "PAY_PER_REQUEST" && aws_dynamodb_table.authority[0].deletion_protection_enabled && aws_dynamodb_table.authority[0].point_in_time_recovery[0].enabled && aws_dynamodb_table.authority[0].server_side_encryption[0].enabled && !anytrue([for ttl in aws_dynamodb_table.authority[0].ttl : try(ttl.enabled, false)])
    error_message = "Authority must be on-demand, encrypted, deletion-protected, PITR-enabled, and have no TTL."
  }
  assert {
    condition     = alltrue([for s in jsondecode(aws_dynamodb_resource_policy.authority[0].policy).Statement : s.Effect != "Allow" || try(s.Principal.AWS, "") == local.authority_writer_arn]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyNonWriterData" && s.Effect == "Deny" && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == local.authority_writer_arn && contains(s.Action, "dynamodb:PutItem")])
    error_message = "Only the writer may access authority data, including against administrator identity-policy allows."
  }
  assert {
    condition     = alltrue([for principal in [aws_iam_role.enclave_host.arn, "arn:aws:iam::123456789012:role/OrganizationAccountAccessRole", var.kms_admin_role_arn] : principal != local.authority_writer_arn]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyLifecycleExceptBreakGlass" && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == var.kms_admin_role_arn && contains(s.Action, "dynamodb:DeleteResourcePolicy") && contains(s.Action, "dynamodb:RestoreTableToPointInTime") && contains(s.Action, "dynamodb:ImportTable")])
    error_message = "Host/org-admin must be denied data and lifecycle operations; only break-glass is excepted for lifecycle."
  }
  assert {
    condition     = anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyAlternateDataApis" && contains(s.Action, "dynamodb:PartiQL*") && contains(s.Action, "dynamodb:BatchWriteItem")]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyTtlAlways" && s.Effect == "Deny"]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyNonTransactionalWrites" && try(s.Condition.StringNotEqualsIfExists["dynamodb:EnclosingOperation"], "") == "TransactWriteItems"])
    error_message = "PartiQL/batch/TTL and standalone mutations must be denied."
  }
  assert {
    condition     = anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyAlternateDataApis" && alltrue([for a in ["dynamodb:EnableKinesisStreamingDestination", "dynamodb:UpdateKinesisStreamingDestination", "dynamodb:DisableKinesisStreamingDestination"] : contains(s.Action, a)])]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyUntrustedPrincipalsAllApis" && s.Action == ["dynamodb:*"] && try(toset(s.Condition.ArnNotEquals["aws:PrincipalArn"]), toset([])) == toset([local.authority_writer_arn, var.kms_admin_role_arn])])
    error_message = "Kinesis and future table APIs must not provide a nonwriter/org-admin extraction path."
  }
  assert {
    condition     = alltrue([for s in jsondecode(aws_iam_user_policy.authority_writer[0].policy).Statement : s.Resource == local.authority_table_arn && alltrue([for a in s.Action : contains(local.authority_item_actions, a)])]) && strcontains(base64decode(aws_launch_template.enclave_host.user_data), "vsock-proxy 8001 dynamodb.us-east-1.amazonaws.com 443") && !strcontains(base64decode(aws_launch_template.enclave_host.user_data), "vsock-proxy 8002") && !strcontains(base64decode(aws_launch_template.enclave_host.user_data), "CREDENTIAL_OBJECT")
    error_message = "Writer privileges and disabled-email/delivery proxy settings must be narrow."
  }
}
run "credential_cmk_pins_complete_tuples_and_context" {
  command = apply
  variables {
    enable_enrollment_authority   = true
    authority_generation          = "g1"
    authority_tenant              = "learncard"
    authority_guardrail_policy_id = "p-12345678"
  }
  assert {
    condition     = length([for s in local.credential_key_policy.Statement : s if s.Effect == "Allow" && contains(s.Action, "kms:Decrypt")]) == length(var.enclave_measurements) && alltrue([for s in local.credential_key_policy.Statement : !contains(s.Action, "kms:Decrypt") || s.Effect != "Allow" || anytrue([for m in var.enclave_measurements : try(s.Condition.StringEqualsIgnoreCase["kms:RecipientAttestation:PCR0"], "") == m.pcr0 && try(s.Condition.StringEqualsIgnoreCase["kms:RecipientAttestation:PCR1"], "") == m.pcr1 && try(s.Condition.StringEqualsIgnoreCase["kms:RecipientAttestation:PCR2"], "") == m.pcr2])])
    error_message = "Decrypt must use complete pinned PCR tuples, never independent arrays."
  }
  assert {
    condition     = alltrue([for s in local.credential_key_policy.Statement : s.Effect != "Allow" || (!contains(s.Action, "kms:Decrypt") && !contains(s.Action, "kms:Encrypt")) || (try(s.Condition.StringEquals["kms:EncryptionContext:purpose"], "") == "authority-writer" && try(s.Condition.StringEquals["kms:EncryptionContext:tenant"], "") == "learncard" && try(s.Condition.StringEquals["kms:EncryptionContext:environment"], "") == "staging" && try(s.Condition.StringEquals["kms:EncryptionContext:authorityGeneration"], "") == "g1" && try(s.Condition.StringEquals["kms:EncryptionContext:principalArn"], "") == local.authority_writer_arn)]) && alltrue([for s in local.credential_key_policy.Statement : s.Effect != "Allow" || !contains(s.Action, "kms:Encrypt") || try(s.Principal.AWS, "") == var.kms_admin_role_arn])
    error_message = "Crypto grants must bind all context fields; only the MFA-gated admin can Encrypt."
  }
  assert {
    condition     = alltrue([for sid in ["DenyUnattestedDecrypt", "DenyDebugPCR0", "DenyDebugPCR1", "DenyDebugPCR2", "DenyDebugImageSha384", "DenyRootPolicyChangeWithoutMfa", "DenyGrantsAndAlternativeCrypto", "DenyEncryptExceptProvisioner", "DenyDecryptExceptHost"] : anytrue([for s in local.credential_key_policy.Statement : s.Sid == sid && s.Effect == "Deny"])]) && length([for s in local.credential_key_policy.Statement : s if startswith(s.Sid, "DenyMissingContext")]) == 5 && aws_kms_key.credentials[0].enable_key_rotation && aws_kms_key.credentials[0].deletion_window_in_days == 30
    error_message = "Credential CMK must deny grants, missing/debug attestation, missing context and non-MFA root policy changes."
  }
  assert {
    condition     = length(local.bucket_extra_policy_documents.artifacts) == 2 && alltrue([for sid in ["DenyCredentialWritesExceptProvisioner", "DenyNonCreateOnlyCredentials", "DenyCredentialDeletion"] : anytrue([for s in jsondecode(local.bucket_extra_policy_documents.artifacts[1]).Statement : s.Sid == sid && s.Effect == "Deny"])]) && alltrue([for s in local.credential_object_policy.Statement : !strcontains(s.Sid, "NonCreateOnly") || try(s.Condition.StringNotEqualsIfExists["s3:if-none-match"], "") == "*"])
    error_message = "Credential objects must have attached provisioner-only, write-once and nondeletable guards."
  }
  assert {
    condition     = anytrue([for s in local.credential_object_policy.Statement : s.Sid == "DenyCredentialReplication" && toset(s.Action) == toset(["s3:ReplicateObject", "s3:ReplicateDelete"]) && s.Principal == "*" && !can(s.Condition)])
    error_message = "Replication must not overwrite credentials or introduce delete markers."
  }
}
run "email_external_dns_and_delivery" {
  command = apply
  variables {
    enable_enrollment_authority   = true
    enable_enclave_email          = true
    enable_credential_delivery    = true
    authority_generation          = "g1"
    authority_tenant              = "learncard"
    authority_guardrail_policy_id = "p-12345678"
    sending_domain                = "staging.notify.learncard.com"
  }
  assert {
    condition     = length(aws_route53_zone.sending) == 0 && length(aws_route53_record.sending) == 0 && length(output.sending_dns_records) == 6 && aws_ses_domain_mail_from.enclave[0].mail_from_domain == "bounce.staging.notify.learncard.com" && aws_ses_domain_mail_from.enclave[0].behavior_on_mx_failure == "RejectMessage" && toset(aws_ses_event_destination.enclave[0].matching_types) == toset(["bounce", "complaint"])
    error_message = "External DNS mode must output all records and configure fail-closed MAIL FROM and feedback."
  }
  assert {
    condition     = jsondecode(aws_iam_user_policy.email_sender[0].policy).Statement[0].Action == ["ses:SendEmail"] && jsondecode(aws_iam_user_policy.email_sender[0].policy).Statement[0].Condition.StringEquals["ses:FromAddress"] == "recovery@staging.notify.learncard.com" && toset(jsondecode(aws_iam_user_policy.email_sender[0].policy).Statement[0].Resource) == toset([local.email_identity_arn, local.email_configuration_set_arn])
    error_message = "Email sender must only SendEmail from the approved identity/address."
  }
  assert {
    condition     = strcontains(base64decode(aws_launch_template.enclave_host.user_data), "vsock-proxy 8002 email.us-east-1.amazonaws.com 443") && strcontains(base64decode(aws_launch_template.enclave_host.user_data), "ESCROW_AUTHORITY_CREDENTIAL_OBJECT=credentials/authority-writer/g1") && strcontains(base64decode(aws_launch_template.enclave_host.user_data), "ESCROW_EMAIL_CREDENTIAL_OBJECT=credentials/email-sender/g1") && length(aws_cloudwatch_event_rule.authority_governance) == 5 && strcontains(aws_cloudwatch_event_rule.authority_governance["table_control"].event_pattern, "DeleteResourcePolicy")
    error_message = "Enabled proxy/delivery paths and governance alarm coverage must be present."
  }
}
run "delegated_sending_zone_and_cross_region_global_events" {
  command = apply
  variables {
    aws_region                    = "us-west-2"
    enable_enrollment_authority   = true
    enable_enclave_email          = true
    authority_generation          = "g1"
    authority_tenant              = "learncard"
    authority_guardrail_policy_id = "p-12345678"
    sending_domain                = "staging.notify.learncard.com"
    create_sending_zone           = true
  }
  assert {
    condition     = length(aws_route53_zone.sending) == 1 && aws_route53_zone.sending[0].name == "staging.notify.learncard.com" && length(aws_route53_record.sending) == 6 && length(output.sending_zone_name_servers) == 2 && alltrue([for r in aws_route53_record.sending : !strcontains(r.name, "_dmarc") && endswith(r.name, "staging.notify.learncard.com")]) && length(aws_cloudwatch_event_target.authority_global) == 1
    error_message = "Only the delegated child zone/records should be created; global IAM events must be forwarded cross-region."
  }
  assert {
    condition     = length(aws_sqs_queue.authority_global_dlq) == 1 && aws_cloudwatch_event_target.authority_global[0].dead_letter_config[0].arn == aws_sqs_queue.authority_global_dlq[0].arn && length(aws_cloudwatch_metric_alarm.authority_global_failures) == 1 && !strcontains(aws_cloudwatch_event_rule.authority_governance["access_keys"].event_pattern, "userName")
    error_message = "Global delivery failures must have an independent DLQ/alarm, and implicit-username key operations must be monitored."
  }
}
