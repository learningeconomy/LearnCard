# Offline, credential-free assertions on the rendered escrow CMK key policy
# JSON (kms.tf's data.aws_iam_policy_document.escrow_kms_key_policy) — the
# C1 fix's actual security contract.
#
# Why a REAL (unmocked) "aws" provider plus a long list of blank
# override_resource/override_data blocks, instead of a single
# `mock_provider "aws" {}`:
#
#   aws_iam_policy_document's "json" attribute is pure local computation —
#   it never calls the AWS API at all. A full `mock_provider "aws" {}`
#   replaces EVERY resource/data source of that provider, INCLUDING this
#   one, with Terraform's generic schema-driven fake-data generator, which
#   has no idea "json" is derived from the statement blocks below and
#   simply returns a random 8-character string for it. That would make
#   this test assert against garbage, not the real rendered policy.
#
#   Instead, this file keeps the REAL provider (so every
#   aws_iam_policy_document data source in the module computes its actual
#   JSON), supplies fake static credentials + skip_* flags so the provider
#   never needs real AWS access to "configure", and uses `override_data`/
#   `override_resource` to bypass the real provider call for every OTHER
#   resource/data source that would otherwise need genuine AWS
#   credentials/network access (S3, DynamoDB, KMS key CREATION, Lambda,
#   NLB, ASG, CloudWatch, SNS/SQS, and the account/VPC/AMI lookups). Data
#   sources that are ALSO pure local computation (the other
#   aws_iam_policy_document data sources, and aws_partition — confirmed to
#   make no API call) are deliberately left un-overridden too.
#
#   `command = apply` (not `plan`) is required: a data source that depends
#   on a managed resource's computed attribute (here,
#   aws_iam_role.enclave_host.arn, used as this policy's principal) is
#   always deferred to apply time by Terraform's own dependency-graph
#   rules — regardless of mocking — so its "json" stays unknown during a
#   plan-only run. `override_resource`'s auto-generated (fake, but
#   concrete) arn becomes available once this run block actually applies,
#   which is what lets the real aws_iam_policy_document compute a fully
#   known JSON string. Because every resource below is overridden, no real
#   AWS API call happens even though this is an "apply".

provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_region_validation      = true
  skip_metadata_api_check     = true
}

variables {
  environment                         = "staging"
  vpc_id                              = "vpc-0123456789abcdef0"
  private_subnet_ids                  = ["subnet-0000000000000001", "subnet-0000000000000002"]
  lca_api_security_group_id           = "sg-0123456789abcdef0"
  eif_s3_uri                          = "s3://learncard-escrow-eif-test/escrow-enclave-v1.2.3.eif"
  enclave_image_version               = "v1.2.3"
  kms_admin_role_arn                  = "arn:aws:iam::123456789012:role/escrow-kms-admin"
  host_binary_s3_uri                  = "s3://learncard-escrow-eif-test/escrow-enclave-host-v1.2.3"
  host_binary_sha256                  = "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  escrow_key_id                       = "escrow-key-v1"
  host_bearer_token_parameter_name    = "/learncard/escrow-enclave/staging/bearer-token"
  host_tls_certificate_parameter_name = "/learncard/escrow-enclave/staging/tls-cert"
  host_tls_private_key_parameter_name = "/learncard/escrow-enclave/staging/tls-key"

  monitor_zip_path                  = "tests/fixtures/monitor-bootstrap.zip"
  monitor_tenant                    = "test-tenant"
  monitor_public_key_parameter_name = "/learncard/escrow-enclave/staging/ledger-public-key"

  enclave_measurements = [
    {
      label = "v1-test"
      pcr0  = "aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11aa11"
      pcr1  = "bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22bb22"
      pcr2  = "cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33cc33"
    },
    {
      label = "v2-test"
      pcr0  = "dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44dd44"
      pcr1  = "ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55ee55"
      pcr2  = "ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66ff66"
    },
  ]
}

# --- Data sources that make a real AWS API call: overridden (blank =
#     auto-generated fake values; none of this test's assertions depend on
#     their concrete content). aws_partition.current is deliberately NOT
#     overridden here — confirmed to require no API call at all. Every
#     aws_iam_policy_document data source is also deliberately NOT
#     overridden, so it computes its real JSON. ---

override_data {
  target = data.aws_caller_identity.current
}

override_data {
  target = data.aws_subnet.selected
}

override_data {
  target = data.aws_ssm_parameter.al2023_ami
}

# --- Managed resources: every one of them calls a real AWS API on create
#     (and destroy), so every one is overridden. Blank overrides are fine
#     throughout — this test only asserts on the escrow key policy JSON,
#     which only transitively depends on aws_iam_role.enclave_host.arn. ---

override_resource {
  target = aws_launch_template.enclave_host
  values = {
    id = "lt-0123456789abcdef0"
  }
}

override_resource {
  target = aws_autoscaling_group.enclave_host
}

override_resource {
  target = aws_iam_role.enclave_host
}

override_resource {
  target = aws_iam_instance_profile.enclave_host
}

override_resource {
  target = aws_iam_role_policy.enclave_host
}

override_resource {
  target = aws_iam_role.ledger_monitor
  values = {
    arn = "arn:aws:iam::123456789012:role/example-ledger-monitor-role"
  }
}

override_resource {
  target = aws_iam_role_policy_attachment.ledger_monitor_basic_execution
}

override_resource {
  target = aws_iam_role_policy.ledger_monitor
}

override_resource {
  target = aws_kms_key.escrow
}

override_resource {
  target = aws_kms_alias.escrow
}

override_resource {
  target = aws_dynamodb_table.records
}

override_resource {
  target = aws_dynamodb_table.heads
}

override_resource {
  target = aws_cloudwatch_log_group.enclave_host
}

override_resource {
  target = aws_sns_topic.monitor
  values = {
    arn = "arn:aws:sns:us-east-1:123456789012:example-monitor-topic"
  }
}

override_resource {
  target = aws_sqs_queue.monitor_dlq
  values = {
    arn = "arn:aws:sqs:us-east-1:123456789012:example-monitor-dlq"
  }
}

override_resource {
  target = aws_iam_role_policy.monitor_notifications
}

override_resource {
  target = aws_cloudwatch_log_group.monitor
}

override_resource {
  target = aws_lambda_function.monitor
  values = {
    arn = "arn:aws:lambda:us-east-1:123456789012:function:example-monitor"
  }
}

override_resource {
  target = aws_lambda_event_source_mapping.monitor
}

override_resource {
  target = aws_cloudwatch_event_rule.monitor_sweep
  values = {
    arn = "arn:aws:events:us-east-1:123456789012:rule/example-monitor-sweep"
  }
}

override_resource {
  target = aws_cloudwatch_event_target.monitor_sweep
}

override_resource {
  target = aws_lambda_permission.monitor_sweep
}

override_resource {
  target = aws_lambda_function_event_invoke_config.monitor
}

override_resource {
  target = aws_cloudwatch_event_rule.escrow_kms_changes
}

override_resource {
  target = aws_cloudwatch_event_target.escrow_kms_changes
}

override_resource {
  target = aws_sqs_queue_policy.monitor_dlq
}

override_resource {
  target = aws_sns_topic_policy.monitor
}

override_resource {
  target = aws_cloudwatch_metric_alarm.monitor
}

override_resource {
  target = aws_cloudwatch_metric_alarm.monitor_service
}

override_resource {
  target = aws_cloudwatch_metric_alarm.monitor_heartbeat
}

override_resource {
  target = aws_cloudwatch_dashboard.monitor
}

override_resource {
  target = aws_security_group.enclave_host
  values = {
    id = "sg-0000000000000host"
  }
}

override_resource {
  target = aws_vpc_security_group_ingress_rule.nlb_from_lca_api
}

override_resource {
  target = aws_vpc_security_group_egress_rule.nlb_to_hosts
}

override_resource {
  target = aws_security_group.nlb
  values = {
    id = "sg-00000000000000nlb"
  }
}

override_resource {
  target = aws_vpc_endpoint_service.enclave_host
  values = {
    service_name = "com.amazonaws.vpce.us-east-1.vpce-svc-0123456789abcdef0"
  }
}

override_resource {
  target = aws_lb.enclave_host
  values = {
    arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/net/example-nlb/0123456789abcdef"
  }
}

override_resource {
  target = aws_lb_target_group.enclave_host
  values = {
    arn = "arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/example-tg/0123456789abcdef"
  }
}

override_resource {
  target = aws_lb_listener.enclave_host
}

override_resource {
  target = aws_kms_key.s3
}

override_resource {
  target = aws_kms_alias.s3
}

override_resource {
  target = aws_s3_bucket.audit
}

override_resource {
  target = aws_s3_bucket_versioning.audit
}

override_resource {
  target = aws_s3_bucket_server_side_encryption_configuration.audit
}

override_resource {
  target = aws_s3_bucket_public_access_block.audit
}

override_resource {
  target = aws_s3_bucket_object_lock_configuration.audit
}

override_resource {
  target = aws_s3_bucket.artifacts
}

override_resource {
  target = aws_s3_bucket_versioning.artifacts
}

override_resource {
  target = aws_s3_bucket_server_side_encryption_configuration.artifacts
}

override_resource {
  target = aws_s3_bucket_public_access_block.artifacts
}

override_resource {
  target = aws_s3_bucket_policy.deny_insecure_transport
}

run "escrow_kms_key_policy_provenance" {
  command = apply

  assert {
    condition     = strcontains(base64decode(aws_launch_template.enclave_host.user_data), "ROUGHTIME_ALLOWLIST_JSON='{\"cloudflare\":\"roughtime.cloudflare.com:2003\",\"int08h\":\"roughtime.int08h.com:2002\",\"txryan\":\"time.txryan.com:2002\"}'") && strcontains(base64decode(aws_launch_template.enclave_host.user_data), "Environment='ESCROW_ROUGHTIME_ALLOWLIST_JSON=$ROUGHTIME_ALLOWLIST_JSON'")
    error_message = "user-data must preserve the exact measured Roughtime IDs/endpoints and JSON systemd quoting"
  }

  assert {
    condition     = toset([for rule in aws_security_group.enclave_host.egress : rule.from_port if rule.protocol == "udp"]) == toset([2002, 2003]) && length([for rule in aws_security_group.enclave_host.egress : rule if rule.protocol == "udp"]) == 2
    error_message = "Roughtime UDP egress must contain exactly ports 2002 and 2003 without duplicate rules"
  }

  # Sanity check: the policy actually rendered as real JSON, not an
  # unknown/placeholder value, and it carries more than one statement (this
  # would fail loudly if the override wiring above were broken).
  assert {
    condition     = length(jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement) >= 8
    error_message = "expected the full escrow key policy to render (>=8 statements); got: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # No Allow statement anywhere may grant any of the prohibited actions.
  assert {
    condition = alltrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Effect, "") != "Allow" || length(setintersection(
        toset(flatten([try(s.Action, [])])),
        toset([
          "kms:Encrypt",
          "kms:ReEncryptFrom",
          "kms:ReEncryptTo",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:GenerateDataKeyPair",
          "kms:GenerateDataKeyPairWithoutPlaintext",
        ]),
      )) == 0
    ])
    error_message = "an Allow statement grants a prohibited KMS action (Encrypt/ReEncrypt*/GenerateDataKeyWithoutPlaintext/GenerateDataKeyPair*): ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # Every Allow of kms:Decrypt or kms:GenerateDataKey must carry
  # StringEqualsIgnoreCase conditions on all three RecipientAttestation PCR
  # variables (decisions.md D7's per-measurement gate).
  assert {
    condition = alltrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Effect, "") != "Allow" || length(setintersection(
        toset(flatten([try(s.Action, [])])),
        toset(["kms:Decrypt", "kms:GenerateDataKey"]),
        )) == 0 || (
        contains(keys(try(s.Condition.StringEqualsIgnoreCase, {})), "kms:RecipientAttestation:PCR0") &&
        contains(keys(try(s.Condition.StringEqualsIgnoreCase, {})), "kms:RecipientAttestation:PCR1") &&
        contains(keys(try(s.Condition.StringEqualsIgnoreCase, {})), "kms:RecipientAttestation:PCR2")
      )
    ])
    error_message = "an Allow of kms:Decrypt/kms:GenerateDataKey is missing a PCR0/PCR1/PCR2 attestation condition: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # Every such Allow must ALSO carry the encryption-context purpose marker.
  assert {
    condition = alltrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Effect, "") != "Allow" || length(setintersection(
        toset(flatten([try(s.Action, [])])),
        toset(["kms:Decrypt", "kms:GenerateDataKey"]),
        )) == 0 || (
        try(s.Condition.StringEquals["kms:EncryptionContext:purpose"], "") == "escrow-enclave-key"
      )
    ])
    error_message = "an Allow of kms:Decrypt/kms:GenerateDataKey is missing the escrow-enclave-key encryption-context condition: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # There must be exactly one Allow-of-Decrypt-or-GenerateDataKey statement
  # PER pinned measurement tuple (2, in this run's variables).
  assert {
    condition = length([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      s if try(s.Effect, "") == "Allow" && length(setintersection(
        toset(flatten([try(s.Action, [])])),
        toset(["kms:Decrypt", "kms:GenerateDataKey"]),
      )) > 0
    ]) == 2
    error_message = "expected exactly 2 Allow-of-key-material statements (one per pinned measurement): ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # An explicit Deny (for all principals) must cover every prohibited
  # action — it does not matter whether this is one combined statement or
  # split across several, only that each prohibited action is Denied
  # somewhere with no attestation/condition escape hatch required.
  assert {
    condition = alltrue([
      for action in [
        "kms:Encrypt",
        "kms:ReEncryptFrom",
        "kms:ReEncryptTo",
        "kms:GenerateDataKeyWithoutPlaintext",
        "kms:GenerateDataKeyPair",
        "kms:GenerateDataKeyPairWithoutPlaintext",
      ] :
      anytrue([
        for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
        try(s.Effect, "") == "Deny" && contains(flatten([try(s.Action, [])]), action)
      ])
    ])
    error_message = "at least one prohibited KMS action has no explicit Deny statement: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # The no-attestation-present Deny must cover both kms:Decrypt and
  # kms:GenerateDataKey (not just Decrypt).
  assert {
    condition = anytrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Effect, "") == "Deny" &&
      contains(keys(try(s.Condition.Null, {})), "kms:RecipientAttestation:ImageSha384") &&
      contains(flatten([try(s.Action, [])]), "kms:Decrypt") &&
      contains(flatten([try(s.Action, [])]), "kms:GenerateDataKey")
    ])
    error_message = "the no-attestation-present Deny does not cover both kms:Decrypt and kms:GenerateDataKey: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # The debug-mode PCR0 Deny must cover both actions too.
  assert {
    condition = anytrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Effect, "") == "Deny" &&
      contains(keys(try(s.Condition.StringEqualsIgnoreCase, {})), "kms:RecipientAttestation:PCR0") &&
      length(try(s.Condition.StringEqualsIgnoreCase["kms:RecipientAttestation:PCR0"], "")) == 96 &&
      can(regex("^0+$", try(s.Condition.StringEqualsIgnoreCase["kms:RecipientAttestation:PCR0"], ""))) &&
      contains(flatten([try(s.Action, [])]), "kms:Decrypt") &&
      contains(flatten([try(s.Action, [])]), "kms:GenerateDataKey")
    ])
    error_message = "the debug-mode PCR0 Deny does not cover both kms:Decrypt and kms:GenerateDataKey: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # The debug-mode ImageSha384 Deny must cover both actions too.
  assert {
    condition = anytrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Effect, "") == "Deny" &&
      contains(keys(try(s.Condition.StringEqualsIgnoreCase, {})), "kms:RecipientAttestation:ImageSha384") &&
      contains(flatten([try(s.Action, [])]), "kms:Decrypt") &&
      contains(flatten([try(s.Action, [])]), "kms:GenerateDataKey")
    ])
    error_message = "the debug-mode ImageSha384 Deny does not cover both kms:Decrypt and kms:GenerateDataKey: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }

  # kms:CreateGrant must still be unconditionally denied (pre-existing
  # control; guards against this test's refactor accidentally dropping it).
  assert {
    condition = anytrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Effect, "") == "Deny" && contains(flatten([try(s.Action, [])]), "kms:CreateGrant")
    ])
    error_message = "kms:CreateGrant is no longer explicitly denied: ${data.aws_iam_policy_document.escrow_kms_key_policy.json}"
  }
}

run "same_vpc_mode_admits_lca_api_only_through_the_nlb" {
  command = apply

  assert {
    condition     = length(aws_vpc_security_group_ingress_rule.nlb_from_lca_api) == 1 && aws_vpc_security_group_ingress_rule.nlb_from_lca_api[0].referenced_security_group_id == "sg-0123456789abcdef0" && aws_vpc_security_group_ingress_rule.nlb_from_lca_api[0].from_port == 8443
    error_message = "Same-VPC mode must admit 8443 to the NLB from the lca-api security group only"
  }

  assert {
    condition     = alltrue([for rule in aws_security_group.enclave_host.ingress : rule.security_groups == toset(["sg-00000000000000nlb"]) && try(length(rule.cidr_blocks), 0) == 0]) && toset([for rule in aws_security_group.enclave_host.ingress : rule.from_port]) == toset([8443, 8444])
    error_message = "Enclave hosts must admit 8443 and 8444 from the NLB security group only"
  }

  assert {
    condition     = length(aws_vpc_endpoint_service.enclave_host) == 0 && output.endpoint_service_name == null
    error_message = "Same-VPC mode must not create a PrivateLink endpoint service"
  }
}

run "privatelink_mode_requires_acceptance_and_named_principals" {
  command = apply

  variables {
    lca_api_security_group_id      = null
    privatelink_allowed_principals = ["arn:aws:iam::206533012615:root"]
  }

  assert {
    condition     = length(aws_vpc_endpoint_service.enclave_host) == 1 && aws_vpc_endpoint_service.enclave_host[0].acceptance_required == true && aws_vpc_endpoint_service.enclave_host[0].allowed_principals == toset(["arn:aws:iam::206533012615:root"])
    error_message = "PrivateLink mode must require manual acceptance and allow only the named principals"
  }

  assert {
    condition     = length(aws_vpc_security_group_ingress_rule.nlb_from_lca_api) == 0 && aws_lb.enclave_host.enforce_security_group_inbound_rules_on_private_link_traffic == "off"
    error_message = "PrivateLink mode must not open the NLB to any security group; admission is the endpoint service"
  }

  assert {
    condition     = alltrue([for rule in aws_security_group.enclave_host.ingress : rule.security_groups == toset(["sg-00000000000000nlb"])])
    error_message = "Enclave hosts must still admit traffic only from the NLB"
  }
}

run "rejects_both_access_modes" {
  command = plan

  variables {
    privatelink_allowed_principals = ["arn:aws:iam::206533012615:root"]
  }

  expect_failures = [var.privatelink_allowed_principals]
}

run "rejects_neither_access_mode" {
  command = plan

  variables {
    lca_api_security_group_id = null
  }

  expect_failures = [var.privatelink_allowed_principals]
}

run "rejects_wildcard_principals" {
  command = plan

  variables {
    lca_api_security_group_id      = null
    privatelink_allowed_principals = ["*"]
  }

  expect_failures = [var.privatelink_allowed_principals]
}

run "aws_facing_descriptions_are_latin1" {
  command = plan

  # IAM and KMS reject descriptions outside tab/CR/LF, printable ASCII and
  # Latin-1; mocked providers never call AWS, so assert it here.
  assert {
    condition     = alltrue([for d in [aws_iam_role.enclave_host.description, aws_iam_role.ledger_monitor.description, aws_kms_key.escrow.description] : can(regex("^[\\t\\n\\r\\x{20}-\\x{7E}\\x{A1}-\\x{FF}]*$", d))])
    error_message = "IAM role and KMS key descriptions must contain only characters AWS accepts (no em-dashes or other non-Latin-1 characters)"
  }
}

run "put_key_policy_mfa_deny_targets_root_only" {
  command = apply

  # An MFA deny that also matches escrow-kms-admin locks the key (role
  # sessions report no MFA), and KMS rejects it. It must target root only.
  assert {
    condition = length([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement : s
      if try(s.Sid, "") == "DenyRootPutKeyPolicyWithoutMFA" && try(s.Effect, "") == "Deny" && try(s.Action, "") == "kms:PutKeyPolicy" && try(s.Condition.StringEquals["aws:PrincipalArn"], "") == one([for r in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement : try(r.Principal.AWS, "") if try(r.Sid, "") == "RootAccountBreakGlassAdministration"]) && endswith(try(s.Condition.StringEquals["aws:PrincipalArn"], ""), ":root") && try(s.Condition.BoolIfExists["aws:MultiFactorAuthPresent"], "") == "false"
    ]) == 1
    error_message = "DenyRootPutKeyPolicyWithoutMFA must deny kms:PutKeyPolicy only to the root user without MFA"
  }

  assert {
    condition = length([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement : s
      if try(s.Effect, "") == "Deny" && contains(flatten([try(s.Action, [])]), "kms:PutKeyPolicy") && !can(s.Condition.StringEquals["aws:PrincipalArn"])
    ]) == 0
    error_message = "No PutKeyPolicy deny may apply to every principal: it would lock escrow-kms-admin out of the key"
  }
}

run "no_statement_delegates_key_administration_to_iam" {
  command = apply

  # A key-policy principal of "arn:...:root" means the whole account, so
  # without an aws:PrincipalArn condition any IAM admin could rewrite the
  # policy. Every account-root Allow must be pinned to the root user.
  assert {
    condition = alltrue([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement :
      try(s.Condition.StringEquals["aws:PrincipalArn"], "") == try(s.Principal.AWS, "")
      if try(s.Effect, "") == "Allow" && endswith(try(tostring(s.Principal.AWS), ""), ":root")
    ])
    error_message = "Every Allow naming the account root must be restricted to the root user with aws:PrincipalArn"
  }

  assert {
    condition = toset(flatten([
      for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement : [try(s.Principal.AWS, "")]
      if try(s.Effect, "") == "Allow" && contains(flatten([try(s.Action, [])]), "kms:PutKeyPolicy")
    ])) == toset([one([for s in jsondecode(data.aws_iam_policy_document.escrow_kms_key_policy.json).Statement : try(s.Principal.AWS, "") if try(s.Sid, "") == "RootAccountBreakGlassAdministration"]), "arn:aws:iam::123456789012:role/escrow-kms-admin"])
    error_message = "Only the root user and escrow-kms-admin may be granted kms:PutKeyPolicy"
  }
}

run "sealed_key_write_is_granted_only_during_first_boot" {
  command = apply

  variables {
    escrow_allow_first_boot = true
  }

  assert {
    condition     = contains([for s in jsondecode(data.aws_iam_policy_document.enclave_host_permissions.json).Statement : s.Sid], "WriteSealedKey")
    error_message = "First boot must be able to persist the sealed key"
  }
}

run "steady_state_host_cannot_write_sealed_keys" {
  command = apply

  variables {
    escrow_allow_first_boot = false
  }

  assert {
    condition = !anytrue([
      for s in jsondecode(data.aws_iam_policy_document.enclave_host_permissions.json).Statement :
      contains(flatten([try(s.Action, [])]), "s3:PutObject") && anytrue([for r in flatten([try(s.Resource, [])]) : strcontains(r, "sealed-keys")])
    ])
    error_message = "With first boot disabled the host role must hold no PutObject on sealed-keys/"
  }
}

run "host_cannot_read_other_ssm_parameters" {
  command = apply

  assert {
    condition = anytrue([
      for s in jsondecode(data.aws_iam_policy_document.enclave_host_permissions.json).Statement :
      try(s.Effect, "") == "Deny" && contains(flatten([try(s.Action, [])]), "ssm:GetParameters") && length(flatten([try(s.NotResource, [])])) == 3
    ])
    error_message = "The host role must explicitly deny SSM parameter reads outside its three host parameters"
  }
}
