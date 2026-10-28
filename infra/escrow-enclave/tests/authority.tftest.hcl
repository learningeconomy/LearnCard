# ALL provider calls are mocked. New policies use local jsonencode, so assertions
# inspect real policy computations rather than mocked aws_iam_policy_document JSON.
mock_provider "aws" {
  mock_resource "aws_launch_template" { defaults = { id = "lt-0123456789abcdef0", latest_version = 7 } }
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

# All mocked CMKs share one id; give the storage CMK its own so governance
# assertions can tell its branch from the escrow/credentials branch.
override_resource {
  target = aws_kms_key.s3
  values = { arn = "arn:aws:kms:us-east-1:123456789012:key/55555555-6666-7777-8888-999999999999", key_id = "55555555-6666-7777-8888-999999999999" }
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
  authority_monitor_guardrail_policy_id = "p-monitor123"
  environment                           = "staging"
  vpc_id                                = "vpc-0123456789abcdef0"
  private_subnet_ids                    = ["subnet-0000000000000001", "subnet-0000000000000002"]
  lca_api_security_group_id             = "sg-0123456789abcdef0"
  eif_s3_uri                            = "s3://test-artifacts/test.eif"
  enclave_image_version                 = "test"
  kms_admin_role_arn                    = "arn:aws:iam::123456789012:role/escrow-kms-admin"
  host_binary_s3_uri                    = "s3://test-artifacts/host"
  host_binary_sha256                    = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  escrow_key_id                         = "test-key"
  host_bearer_token_parameter_name      = "/test/bearer"
  host_tls_certificate_parameter_name   = "/test/cert"
  host_tls_private_key_parameter_name   = "/test/key"
  monitor_zip_path                      = "tests/fixtures/monitor-bootstrap.zip"
  monitor_tenant                        = "learncard"
  monitor_public_key_parameter_name     = "/test/monitor"
  enclave_measurements = [
    { label = "n", pcr0 = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", pcr1 = "bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb", pcr2 = "cccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccccc" },
    { label = "n1", pcr0 = "dddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddddd", pcr1 = "eeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee", pcr2 = "ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff" },
  ]
}

run "disabled_is_structurally_a_noop" {
  command = apply
  assert {
    condition = (
      toset(jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][0].detail.eventName) == toset(["StopLogging", "DeleteTrail", "UpdateTrail", "PutEventSelectors", "PutInsightSelectors"]) &&
      jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][0].detail.requestParameters.name[0] == "escrow-enclave-staging-audit" &&
      jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][1].detail.requestParameters.trailName[0] == "escrow-enclave-staging-audit" &&
      # Denied-call fallback (LC incident 2026-10-23): requestParameters is
      # null once an SCP/IAM deny short-circuits the call, so these two
      # branches key off errorCode instead and must NOT also require
      # requestParameters, or they'd go right back to matching nothing.
      toset(jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][2].detail.eventName) == toset(["StopLogging", "DeleteTrail", "UpdateTrail", "PutEventSelectors", "PutInsightSelectors"]) &&
      jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][2].detail.errorCode[0].prefix == "AccessDenied" &&
      !contains(keys(jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][2].detail), "requestParameters") &&
      jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][3].detail.requestParameters.bucketName == ["learncard-escrow-cloudtrail-staging-123456789012"] &&
      alltrue([for name in ["PutBucketPolicy", "DeleteBucketPolicy", "PutObjectLockConfiguration", "DeleteBucketEncryption", "DeleteBucketLifecycle", "DeleteBucketReplication", "PutBucketPublicAccessBlock", "DeleteBucketPublicAccessBlock", "PutBucketOwnershipControls", "DeleteBucketOwnershipControls", "PutBucketAcl", "PutObjectAcl"] : contains(jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][3].detail.eventName, name)]) &&
      toset(jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][4].detail.eventName) == toset(jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][3].detail.eventName) &&
      jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][4].detail.errorCode[0].prefix == "AccessDenied" &&
      !contains(keys(jsondecode(aws_cloudwatch_event_rule.trail_tamper.event_pattern)["$or"][4].detail), "requestParameters") &&
      jsondecode(aws_cloudwatch_event_target.trail_tamper.input).alarm == "EscrowCloudTrailTamper" &&
      aws_cloudwatch_event_target.trail_tamper.arn == aws_sns_topic.monitor.arn &&
      aws_cloudwatch_event_target.trail_tamper.dead_letter_config[0].arn == aws_sqs_queue.monitor_dlq.arn
    )
    error_message = "Always-on tamper monitoring must cover the exact trail/bucket APIs, both CloudTrail parameter names, the denied-call errorCode fallback branches (null requestParameters), and fixed SNS/DLQ delivery."
  }
  assert {
    condition = (
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][0].detail.requestParameters.keyId) == jsonencode([{ suffix = aws_kms_key.escrow.key_id }]) &&
      length(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"]) == 5 &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][3].detail.requestParameters.keyId) == jsonencode([{ suffix = "55555555-6666-7777-8888-999999999999" }]) &&
      toset(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][3].detail.eventName) == toset(["PutKeyPolicy", "ScheduleKeyDeletion", "CancelKeyDeletion", "DisableKey", "DisableKeyRotation"]) &&
      jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][4].detail.eventName == ["CreateGrant"] &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][4].detail.requestParameters.keyId) == jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][3].detail.requestParameters.keyId) &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][4].detail["$or"]) == jsonencode([{ userIdentity = { invokedBy = [{ exists = false }] } }, { userIdentity = { invokedBy = [{ "anything-but" = "dynamodb.amazonaws.com" }] } }, { requestParameters = { granteePrincipal = [{ "anything-but" = { prefix = "dynamodb." } }] } }, { requestParameters = { granteeServicePrincipal = [{ exists = true }] } }]) &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][2].detail["$or"][1]) == "{\"errorCode\":[{\"prefix\":\"AccessDenied\"}],\"requestParameters\":[null]}" &&
      toset(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][0].detail.eventName) == toset(["PutKeyPolicy", "CreateGrant", "ScheduleKeyDeletion", "CancelKeyDeletion", "DisableKey", "DisableKeyRotation"]) &&
      toset(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][1].detail.eventName) == toset(["PutKeyPolicy", "CreateGrant", "ScheduleKeyDeletion", "CancelKeyDeletion", "DisableKey", "DisableKeyRotation"]) &&
      jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][2].detail["$or"][0].requestParameters.aliasName == [aws_kms_alias.escrow.name, aws_kms_alias.s3.name] &&
      toset(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][2].detail.eventName) == toset(["CreateAlias", "UpdateAlias", "DeleteAlias"]) &&
      jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][1].detail.errorCode[0].prefix == "AccessDenied" &&
      !contains(keys(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][1].detail), "requestParameters") &&
      jsondecode(aws_cloudwatch_event_target.escrow_kms_changes.input).alarm == "EscrowKmsGovernanceChange"
    )
    error_message = "Disabled KMS governance must match the escrow and storage CMKs and their aliases, plus denied calls without requestParameters."
  }
  assert {
    condition     = var.host_ami_id == null && length(data.aws_ssm_parameter.al2023_ami) == 1 && aws_launch_template.enclave_host.image_id == data.aws_ssm_parameter.al2023_ami[0].value
    error_message = "Default staging must retain the same latest-AL2023 lookup and launch-template image."
  }
  assert {
    condition = (
      aws_autoscaling_group.enclave_host.launch_template[0].version == "$Latest" &&
      aws_autoscaling_group.enclave_host.instance_refresh[0].preferences[0].min_healthy_percentage == 50 &&
      aws_autoscaling_group.enclave_host.instance_refresh[0].preferences[0].max_healthy_percentage == 100 &&
      !aws_lb.enclave_host.enable_deletion_protection
    )
    error_message = "Production safety settings must not change staging behavior."
  }
  assert {
    condition = alltrue([
      length(aws_dynamodb_table.authority) == 0, length(aws_dynamodb_resource_policy.authority) == 0,
      length(aws_iam_user.authority_writer) == 0, length(aws_iam_user.email_sender) == 0,
      length(aws_iam_user_policy.authority_writer) == 0, length(aws_iam_user_policy.email_sender) == 0,
      length(aws_kms_key.credentials) == 0, length(aws_kms_alias.credentials) == 0,
      length(aws_iam_role_policy.host_credential_decrypt) == 0,
      length(aws_iam_role_policy.authority_monitor) == 0,
      length(aws_cloudwatch_metric_alarm.authority_integrity) == 0,
      length(aws_cloudwatch_metric_alarm.authority_heartbeat) == 0,
      length(aws_cloudwatch_metric_alarm.authority_repeated_pin_clear) == 0,
      output.authority_monitor_trust_parameter_name == null,
      !contains(keys(aws_lambda_function.monitor.environment[0].variables), "AUTHORITY_TABLE"),
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
    condition     = length(local.bucket_extra_policy_documents.artifacts) == 1 && length(jsondecode(aws_sns_topic_policy.monitor.policy).Statement) == 2 && length(jsondecode(aws_sqs_queue_policy.monitor_dlq.policy).Statement[0].Condition.ArnEquals["aws:SourceArn"]) == 4 && !strcontains(base64decode(aws_launch_template.enclave_host.user_data), "CREDENTIAL_OBJECT")
    error_message = "Disabled authority must retain bucket/SNS/host settings; DLQ also admits the always-on trail tamper and PrivateLink governance rules."
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
    condition = (
      jsondecode(aws_cloudwatch_event_rule.authority_governance["unexpected_write"].event_pattern).detail.userIdentity.arn[0]["anything-but"] == aws_iam_user.authority_writer[0].arn &&
      jsondecode(aws_cloudwatch_event_rule.authority_governance["unexpected_write"].event_pattern).detail.resources.ARN == [local.authority_table_arn] &&
      jsondecode(aws_cloudwatch_event_rule.authority_governance["unexpected_write"].event_pattern).detail.readOnly == [false, "false"] &&
      jsondecode(aws_cloudwatch_event_rule.authority_governance["denied_write"].event_pattern).detail.errorCode[0].prefix == "AccessDenied" &&
      !can(jsondecode(aws_cloudwatch_event_rule.authority_governance["denied_write"].event_pattern).detail.userIdentity)
    )
    error_message = "All authority data writes by non-writers, and denied writes including the writer, must alarm."
  }
  assert {
    condition = alltrue([for name in ["unexpected_write", "denied_write"] :
      aws_cloudwatch_event_target.authority_governance[name].arn == aws_sns_topic.monitor.arn &&
      jsondecode(aws_cloudwatch_event_target.authority_governance[name].input).alarm == "AuthorityGovernance:${name}" &&
      aws_cloudwatch_event_target.authority_governance[name].dead_letter_config[0].arn == aws_sqs_queue.monitor_dlq.arn &&
      contains(jsondecode(aws_sqs_queue_policy.monitor_dlq.policy).Statement[0].Condition.ArnEquals["aws:SourceArn"], aws_cloudwatch_event_rule.authority_governance[name].arn)
    ]) && aws_cloudwatch_event_target.trail_tamper.arn == aws_sns_topic.monitor.arn
    error_message = "Write/tamper alerts must target monitor SNS with fixed messages and authorized DLQ delivery."
  }
  assert {
    condition     = aws_dynamodb_table.authority[0].billing_mode == "PAY_PER_REQUEST" && aws_dynamodb_table.authority[0].deletion_protection_enabled && aws_dynamodb_table.authority[0].point_in_time_recovery[0].enabled && aws_dynamodb_table.authority[0].server_side_encryption[0].enabled && !anytrue([for ttl in aws_dynamodb_table.authority[0].ttl : try(ttl.enabled, false)])
    error_message = "Authority must be on-demand, encrypted, deletion-protected, PITR-enabled, and have no TTL."
  }
  assert {
    condition     = alltrue([for s in jsondecode(aws_dynamodb_resource_policy.authority[0].policy).Statement : s.Effect != "Allow" || try(s.Principal.AWS, "") == local.authority_writer_arn || (try(s.Principal.AWS, "") == local.authority_monitor_arn && toset(try(s.Action, [])) == toset(["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]))]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyNonWriterData" && s.Effect == "Deny" && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == local.authority_writer_arn && contains(try(s.Action, []), "dynamodb:PutItem")])
    error_message = "Only the writer may mutate; only the exact observer gains read-only access."
  }
  assert {
    condition     = alltrue([for principal in [aws_iam_role.enclave_host.arn, "arn:aws:iam::123456789012:role/OrganizationAccountAccessRole", var.kms_admin_role_arn] : principal != local.authority_writer_arn && principal != local.authority_monitor_arn]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyLifecycleExceptBreakGlass" && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == var.kms_admin_role_arn && contains(try(s.Action, []), "dynamodb:DeleteResourcePolicy") && contains(try(s.Action, []), "dynamodb:RestoreTableToPointInTime") && !contains(try(s.Action, []), "dynamodb:ImportTable") && !contains(try(s.Action, []), "dynamodb:CreateTable")])
    error_message = "Host/org-admin must be denied data and lifecycle operations; only break-glass is excepted for lifecycle."
  }
  assert {
    condition     = anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyAlternateDataApis" && contains(try(s.Action, []), "dynamodb:PartiQL*") && contains(try(s.Action, []), "dynamodb:BatchWriteItem")]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyTtlAlways" && s.Effect == "Deny"]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyNonTransactionalWrites" && try(s.Condition.StringNotEqualsIfExists["dynamodb:EnclosingOperation"], "") == "TransactWriteItems"])
    error_message = "PartiQL/batch/TTL and standalone mutations must be denied."
  }
  assert {
    condition     = anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyAlternateDataApis" && alltrue([for a in ["dynamodb:EnableKinesisStreamingDestination", "dynamodb:UpdateKinesisStreamingDestination", "dynamodb:DisableKinesisStreamingDestination"] : contains(try(s.Action, []), a)])]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyUntrustedPrincipalsAllApis" && try(s.Action, []) == ["dynamodb:*"] && try(toset(s.Condition.ArnNotEquals["aws:PrincipalArn"]), toset([])) == toset([local.authority_writer_arn, var.kms_admin_role_arn, local.authority_monitor_arn])])
    error_message = "Kinesis and future table APIs must not provide a nonwriter/org-admin extraction path."
  }
  assert {
    condition     = alltrue([for s in jsondecode(aws_iam_user_policy.authority_writer[0].policy).Statement : (s.Resource == local.authority_table_arn && alltrue([for a in s.Action : contains(local.authority_item_actions, a)])) || (s.Resource == aws_kms_key.s3.arn && s.Condition.StringEquals["kms:ViaService"] == "dynamodb.us-east-1.amazonaws.com")]) && strcontains(base64decode(aws_launch_template.enclave_host.user_data), "vsock-proxy 8001 dynamodb.us-east-1.amazonaws.com 443") && !strcontains(base64decode(aws_launch_template.enclave_host.user_data), "vsock-proxy 8002") && !strcontains(base64decode(aws_launch_template.enclave_host.user_data), "CREDENTIAL_OBJECT")
    error_message = "Writer privileges and disabled-email/delivery proxy settings must be narrow."
  }
  assert {
    condition     = length(aws_iam_role_policy.authority_monitor) == 1 && alltrue([for s in jsondecode(aws_iam_role_policy.authority_monitor[0].policy).Statement : alltrue([for a in s.Action : contains(["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan", "ssm:GetParameter"], a)])]) && aws_lambda_function.monitor.environment[0].variables.AUTHORITY_TABLE == local.authority_table_name && aws_lambda_function.monitor.environment[0].variables.AUTHORITY_GENERATION == "g1" && aws_lambda_function.monitor.environment[0].variables.AUTHORITY_TRUST_PARAMETER == "/escrow-enclave-staging/authority-monitor-trust"
    error_message = "Observer grants and fixed table/generation/trust wiring must be read-only."
  }
  assert {
    condition     = anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyMonitorNonReads" && try(toset(s.NotAction), toset([])) == toset(["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"]) && try(s.Condition.ArnEquals["aws:PrincipalArn"], "") == local.authority_monitor_arn]) && anytrue([for s in local.authority_resource_policy.Statement : s.Sid == "DenyEnumerationExceptMonitor" && try(s.Condition.ArnNotEquals["aws:PrincipalArn"], "") == local.authority_monitor_arn]) && length(aws_cloudwatch_metric_alarm.authority_integrity) == 2 && aws_cloudwatch_metric_alarm.authority_repeated_pin_clear[0].metric_name == "AuthorityRepeatedPinClear" && aws_cloudwatch_metric_alarm.authority_heartbeat[0].treat_missing_data == "breaching"
    error_message = "Monitor must have no write/control escape and must alarm on failures or missing coverage."
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
    condition = (
      # The mock gives both CMKs the same ids, so assert the ordered list.
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][0].detail.requestParameters.keyId) == jsonencode([{ suffix = aws_kms_key.escrow.key_id }, { suffix = aws_kms_key.credentials[0].key_id }]) &&
      length(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"]) == 5 &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][3].detail.requestParameters.keyId) == jsonencode([{ suffix = "55555555-6666-7777-8888-999999999999" }]) &&
      toset(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][3].detail.eventName) == toset(["PutKeyPolicy", "ScheduleKeyDeletion", "CancelKeyDeletion", "DisableKey", "DisableKeyRotation"]) &&
      jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][4].detail.eventName == ["CreateGrant"] &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][4].detail.requestParameters.keyId) == jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][3].detail.requestParameters.keyId) &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][4].detail["$or"]) == jsonencode([{ userIdentity = { invokedBy = [{ exists = false }] } }, { userIdentity = { invokedBy = [{ "anything-but" = "dynamodb.amazonaws.com" }] } }, { requestParameters = { granteePrincipal = [{ "anything-but" = { prefix = "dynamodb." } }] } }, { requestParameters = { granteeServicePrincipal = [{ exists = true }] } }]) &&
      jsonencode(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][2].detail["$or"][1]) == "{\"errorCode\":[{\"prefix\":\"AccessDenied\"}],\"requestParameters\":[null]}" &&
      toset(jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][0].detail.eventName) == toset(["PutKeyPolicy", "CreateGrant", "ScheduleKeyDeletion", "CancelKeyDeletion", "DisableKey", "DisableKeyRotation"]) &&
      jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][1].detail.errorCode[0].prefix == "AccessDenied" &&
      jsondecode(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern)["$or"][2].detail["$or"][0].requestParameters.aliasName == [aws_kms_alias.escrow.name, aws_kms_alias.credentials[0].name, aws_kms_alias.s3.name] &&
      toset(jsondecode(aws_cloudwatch_event_rule.authority_governance["credential_key"].event_pattern).detail.eventName) == toset(["PutKeyPolicy", "CreateGrant", "ScheduleKeyDeletion", "CancelKeyDeletion", "DisableKey", "DisableKeyRotation"]) &&
      # Stay well inside EventBridge's event pattern size limit.
      length(aws_cloudwatch_event_rule.escrow_kms_changes.event_pattern) <= 2048
    )
    error_message = "KMS governance must match the escrow, credentials and storage CMKs by key ID, ARN and alias, rotation/deletion-cancel changes, plus denied calls."
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
    condition     = length(aws_route53_zone.sending) == 0 && length(aws_route53_record.sending) == 0 && length(output.sending_dns_records) == 7 && output.sending_dns_records["dmarc"].records == ["v=DMARC1; p=none"] && aws_ses_domain_mail_from.enclave[0].mail_from_domain == "bounce.staging.notify.learncard.com" && aws_ses_domain_mail_from.enclave[0].behavior_on_mx_failure == "RejectMessage" && toset(aws_ses_event_destination.enclave[0].matching_types) == toset(["bounce", "complaint"])
    error_message = "External DNS mode must output all records and configure fail-closed MAIL FROM and feedback."
  }
  assert {
    condition     = jsondecode(aws_iam_user_policy.email_sender[0].policy).Statement[0].Action == ["ses:SendEmail"] && jsondecode(aws_iam_user_policy.email_sender[0].policy).Statement[0].Condition.StringEquals["ses:FromAddress"] == "recovery@staging.notify.learncard.com" && toset(jsondecode(aws_iam_user_policy.email_sender[0].policy).Statement[0].Resource) == toset([local.email_identity_arn, local.email_configuration_set_arn])
    error_message = "Email sender must only SendEmail from the approved identity/address."
  }
  assert {
    condition     = length([for s in jsondecode(aws_iam_user_policy.authority_writer[0].policy).Statement : s if anytrue([for a in flatten([s.Action]) : startswith(a, "kms:")])]) == 1 && alltrue([for s in jsondecode(aws_iam_user_policy.authority_writer[0].policy).Statement : !anytrue([for a in flatten([s.Action]) : startswith(a, "kms:")]) || (toset(flatten([s.Action])) == toset(["kms:Decrypt", "kms:DescribeKey"]) && s.Resource == aws_kms_key.s3.arn && s.Condition.StringEquals["kms:ViaService"] == "dynamodb.us-east-1.amazonaws.com")])
    error_message = "Authority writer may use only the table key, only through DynamoDB."
  }
  assert {
    condition     = strcontains(base64decode(aws_launch_template.enclave_host.user_data), "vsock-proxy 8002 email.us-east-1.amazonaws.com 443") && strcontains(base64decode(aws_launch_template.enclave_host.user_data), "ESCROW_AUTHORITY_CREDENTIAL_OBJECT=credentials/authority-writer/g1") && strcontains(base64decode(aws_launch_template.enclave_host.user_data), "ESCROW_EMAIL_CREDENTIAL_OBJECT=credentials/email-sender/g1") && length(aws_cloudwatch_event_rule.authority_governance) == 7 && strcontains(aws_cloudwatch_event_rule.authority_governance["table_control"].event_pattern, "DeleteResourcePolicy")
    error_message = "Enabled proxy/delivery paths and governance alarm coverage must be present."
  }
}
run "production_safety_and_domain" {
  command = apply
  variables {
    environment                   = "production"
    host_ami_id                   = "ami-0123456789abcdef0"
    enable_enrollment_authority   = true
    enable_enclave_email          = true
    authority_generation          = "g1"
    authority_tenant              = "learncard"
    authority_guardrail_policy_id = "p-12345678"
    sending_domain                = "vault.notify.learncard.com"
    create_sending_zone           = true
    email_dmarc_policy            = "reject"
  }
  assert {
    condition     = aws_launch_template.enclave_host.image_id == var.host_ami_id && length(data.aws_ssm_parameter.al2023_ami) == 0
    error_message = "Production must use the pinned AMI without any latest-AMI lookup."
  }
  assert {
    condition = (
      aws_autoscaling_group.enclave_host.min_size >= 2 &&
      aws_autoscaling_group.enclave_host.launch_template[0].version == "7" &&
      aws_autoscaling_group.enclave_host.instance_refresh[0].preferences[0].min_healthy_percentage == 100 &&
      aws_autoscaling_group.enclave_host.instance_refresh[0].preferences[0].max_healthy_percentage == 200 &&
      aws_lb.enclave_host.enable_deletion_protection
    )
    error_message = "Production must roll new-host-first on numeric template changes and protect the NLB."
  }
  assert {
    condition     = aws_route53_record.sending["dmarc"].records == toset(["v=DMARC1; p=reject"]) && aws_ses_domain_mail_from.enclave[0].mail_from_domain == "bounce.vault.notify.learncard.com"
    error_message = "Production sending domain and DMARC policy must be independent of staging."
  }
}

run "production_requires_pinned_ami" {
  command = plan
  variables {
    environment = "production"
  }
  expect_failures = [var.host_ami_id]
}

run "reject_malformed_ami" {
  command = plan
  variables {
    host_ami_id = "ami-latest"
  }
  expect_failures = [var.host_ami_id]
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
    condition     = length(aws_route53_zone.sending) == 1 && aws_route53_zone.sending[0].name == "staging.notify.learncard.com" && length(aws_route53_record.sending) == 7 && length(output.sending_zone_name_servers) == 2 && alltrue([for r in aws_route53_record.sending : endswith(r.name, "staging.notify.learncard.com")]) && aws_route53_record.sending["dmarc"].records == toset(["v=DMARC1; p=none"]) && length(aws_cloudwatch_event_target.authority_global) == 1
    error_message = "Only the delegated child zone/records should be created; global IAM events must be forwarded cross-region."
  }
  assert {
    condition     = length(aws_sqs_queue.authority_global_dlq) == 1 && aws_cloudwatch_event_target.authority_global[0].dead_letter_config[0].arn == aws_sqs_queue.authority_global_dlq[0].arn && length(aws_cloudwatch_metric_alarm.authority_global_failures) == 1 && !strcontains(aws_cloudwatch_event_rule.authority_governance["access_keys"].event_pattern, "userName")
    error_message = "Global delivery failures must have an independent DLQ/alarm, and implicit-username key operations must be monitored."
  }
}

run "privatelink_admission_and_capacity_page" {
  command = apply

  variables {
    lca_api_security_group_id      = null
    privatelink_allowed_principals = ["arn:aws:iam::206533012615:root"]
  }

  override_resource {
    target = aws_vpc_endpoint_service.enclave_host
    values = { arn = "arn:aws:ec2:us-east-1:123456789012:vpc-endpoint-service/vpce-svc-0123456789abcdef0", id = "vpce-svc-0123456789abcdef0" }
  }

  assert {
    condition = (
      length(aws_vpc_endpoint_connection_notification.enclave_host) == 1 &&
      aws_vpc_endpoint_connection_notification.enclave_host[0].vpc_endpoint_service_id == "vpce-svc-0123456789abcdef0" &&
      aws_vpc_endpoint_connection_notification.enclave_host[0].connection_notification_arn == aws_sns_topic.monitor.arn &&
      toset(aws_vpc_endpoint_connection_notification.enclave_host[0].connection_events) == toset(["Connect", "Accept", "Reject", "Delete"])
    )
    error_message = "Every endpoint connection request, acceptance, rejection and deletion must page the monitor topic."
  }
  assert {
    condition = length([
      for s in jsondecode(aws_sns_topic_policy.monitor.policy).Statement : s
      if s.Sid == "AllowEndpointServiceConnectionNotifications" && s.Principal.Service == "vpce.amazonaws.com" && s.Action == "sns:Publish" &&
      s.Condition.ArnEquals["aws:SourceArn"] == "arn:aws:ec2:us-east-1:123456789012:vpc-endpoint-service/vpce-svc-0123456789abcdef0" &&
      s.Condition.StringEquals["aws:SourceAccount"] == "123456789012"
    ]) == 1
    error_message = "The monitor topic must accept connection notifications only from this account's endpoint service."
  }
  assert {
    condition = (
      toset(jsondecode(aws_cloudwatch_event_rule.privatelink_governance.event_pattern).detail.eventName) == toset([
        "CreateVpcEndpointServiceConfiguration", "ModifyVpcEndpointServiceConfiguration", "DeleteVpcEndpointServiceConfigurations",
        "ModifyVpcEndpointServicePermissions", "ModifyVpcEndpointServicePayerResponsibility", "StartVpcEndpointServicePrivateDnsVerification",
        "AcceptVpcEndpointConnections", "RejectVpcEndpointConnections", "CreateVpcEndpointConnectionNotification",
        "ModifyVpcEndpointConnectionNotification", "DeleteVpcEndpointConnectionNotifications",
      ]) &&
      strcontains(aws_cloudwatch_event_target.privatelink_governance.input_transformer[0].input_template, "\"alarm\":\"EscrowPrivateLinkChange\"") &&
      aws_cloudwatch_event_target.privatelink_governance.input_transformer[0].input_paths.eventName == "$.detail.eventName" &&
      aws_cloudwatch_event_target.privatelink_governance.arn == aws_sns_topic.monitor.arn &&
      aws_cloudwatch_event_target.privatelink_governance.dead_letter_config[0].arn == aws_sqs_queue.monitor_dlq.arn &&
      contains(jsondecode(aws_sqs_queue_policy.monitor_dlq.policy).Statement[0].Condition.ArnEquals["aws:SourceArn"], aws_cloudwatch_event_rule.privatelink_governance.arn)
    )
    error_message = "Endpoint-service permission, configuration, notification and acceptance changes must page with DLQ delivery."
  }
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.namespace == "AWS/NetworkELB" &&
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.metric_name == "HealthyHostCount" &&
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.statistic == "Maximum" &&
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.ok_actions == toset([aws_sns_topic.monitor.arn]) &&
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.threshold == var.asg_min_size &&
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.comparison_operator == "LessThanThreshold" &&
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.treat_missing_data == "breaching" &&
      aws_cloudwatch_metric_alarm.nlb_healthy_hosts.alarm_actions == toset([aws_sns_topic.monitor.arn])
    )
    error_message = "Fewer healthy NLB targets than the ASG minimum (or missing metrics) must page."
  }
}

run "same_vpc_mode_has_no_connection_notification" {
  command = plan

  assert {
    condition     = length(aws_vpc_endpoint_connection_notification.enclave_host) == 0 && length([for s in jsondecode(aws_sns_topic_policy.monitor.policy).Statement : s if s.Sid == "AllowEndpointServiceConnectionNotifications"]) == 0
    error_message = "Same-VPC mode has no endpoint service, so no connection notification or vpce publish grant."
  }
}
