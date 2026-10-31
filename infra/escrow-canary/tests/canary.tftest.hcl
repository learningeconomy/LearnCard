mock_provider "aws" {
  mock_resource "aws_iam_role" { defaults = { arn = "arn:aws:iam::000000000000:role/canary" } }
  mock_resource "aws_kms_key" { defaults = { arn = "arn:aws:kms:us-east-1:000000000000:key/00000000-1111-2222-3333-444444444444" } }
  mock_resource "aws_secretsmanager_secret" { defaults = { arn = "arn:aws:secretsmanager:us-east-1:000000000000:secret:canary-test" } }
  mock_resource "aws_lambda_function" { defaults = { arn = "arn:aws:lambda:us-east-1:000000000000:function:canary" } }
  mock_resource "aws_cloudwatch_event_rule" { defaults = { arn = "arn:aws:events:us-east-1:000000000000:rule/canary" } }
  mock_resource "aws_sns_topic" { defaults = { arn = "arn:aws:sns:us-east-1:000000000000:canary" } }
  mock_resource "aws_dynamodb_table" { defaults = { arn = "arn:aws:dynamodb:us-east-1:000000000000:table/canary" } }
  mock_resource "aws_s3_bucket" { defaults = { arn = "arn:aws:s3:::canary-inbox" } }
  mock_resource "aws_cloudwatch_log_group" { defaults = { arn = "arn:aws:logs:us-east-1:000000000000:log-group:canary" } }
}
variables {
  monitoring_account_id = "000000000000"
  lca_api_url           = "https://api.example.invalid/api"
  tenant_id             = "test"
  firebase_api_key      = "test-public-key"
  escrow_key_id         = "test"
  authority_generation  = "test"
  account_ids           = ["readonly", "pin-a", "pin-b"]
  alarm_email           = "test@example.invalid"
  # Hash only: the mock provider never opens or deploys this non-ZIP fixture.
  lambda_zip_path = "tests/canary.tftest.hcl"
  measurements    = [{ pcr0 = join("", [for i in range(96) : "a"]), pcr1 = join("", [for i in range(96) : "b"]), pcr2 = join("", [for i in range(96) : "c"]) }]
}
run "monitoring_contract" {
  command = apply
  assert {
    condition     = alltrue([for tier, fn in aws_lambda_function.runner : fn.runtime == "nodejs22.x" && one(fn.architectures) == "arm64" && fn.reserved_concurrent_executions == 1])
    error_message = "Use Node22 arm64 and serialize each tier."
  }
  assert {
    condition     = aws_cloudwatch_metric_alarm.success["1"].evaluation_periods == 3 && aws_cloudwatch_metric_alarm.success["1"].datapoints_to_alarm == 2 && alltrue([for alarm in aws_cloudwatch_metric_alarm.success : alarm.treat_missing_data == "breaching" && alarm.statistic == "Minimum"])
    error_message = "Tier failure and silence must page on the specified windows."
  }
  assert {
    condition     = alltrue([for alarm in aws_cloudwatch_metric_alarm.auth : alarm.treat_missing_data == "notBreaching" && alarm.metric_name == "Runner.AuthFailure" && alarm.statistic == "Maximum"]) && aws_cloudwatch_metric_alarm.silent.evaluation_periods == 5
    error_message = "Runner auth and silence require independent alarms."
  }
  assert {
    condition = alltrue([for account in ["pin-a", "pin-b"] :
      aws_cloudwatch_metric_alarm.success["2-${account}"].period == 3600 &&
      aws_cloudwatch_metric_alarm.success["2-${account}"].evaluation_periods == 2 &&
      aws_cloudwatch_metric_alarm.success["2-${account}"].datapoints_to_alarm == 2 &&
      aws_cloudwatch_metric_alarm.success["2-${account}"].dimensions == tomap({ Tier = "2", Environment = "staging", Account = account }) &&
      aws_cloudwatch_metric_alarm.auth["2-${account}"].period == 3600 &&
      aws_cloudwatch_metric_alarm.auth["2-${account}"].dimensions == aws_cloudwatch_metric_alarm.success["2-${account}"].dimensions &&
      aws_cloudwatch_metric_alarm.auth["2-${account}"].evaluation_periods == 2 &&
      aws_cloudwatch_metric_alarm.auth["2-${account}"].datapoints_to_alarm == 2
    ])
    error_message = "Each alternating account must independently page on two hourly failures, never the other account's success."
  }
  assert {
    condition     = alltrue([for rule in aws_cloudwatch_event_rule.schedule : rule.state == "DISABLED"]) && aws_cloudwatch_event_rule.schedule["1"].schedule_expression == "rate(1 minute)" && aws_cloudwatch_event_rule.schedule["2"].schedule_expression == "rate(30 minutes)"
    error_message = "Schedules must be disabled until provisioning and use the required cadence."
  }
  assert {
    condition = alltrue([for tier, policy in aws_iam_role_policy.runner :
      jsondecode(policy.policy).Statement[0].Resource == local.tier_secrets[tier] &&
      jsondecode(policy.policy).Statement[1].Condition.StringEquals["kms:EncryptionContext:SecretARN"] == local.tier_secrets[tier] &&
      jsondecode(policy.policy).Statement[3].Condition.StringEquals["cloudwatch:namespace"] == "LearnCard/EscrowCanary"
    ])
    error_message = "Secret/KMS rights must be tier-scoped and metric writes namespace-scoped."
  }
  assert {
    condition     = alltrue([for config in aws_lambda_function_event_invoke_config.runner : config.maximum_retry_attempts == 0]) && aws_kms_key.secrets.enable_key_rotation
    error_message = "Never automatically retry a recovery; rotate the monitoring secrets CMK."
  }
}

run "defaults_create_nothing_for_tier3" {
  command = apply
  assert {
    condition = (
      length(aws_secretsmanager_secret.hold) == 0 && length(aws_dynamodb_table.tier3) == 0 &&
      length(aws_lambda_function.tier3) == 0 && length(aws_cloudwatch_event_rule.tier3) == 0 &&
      length(aws_cloudwatch_metric_alarm.tier3) == 0 && length(aws_cloudwatch_metric_alarm.tier3_step) == 0 &&
      length(aws_sns_topic.tickets) == 0 && length(aws_cloudwatch_dashboard.tier3) == 0 &&
      length(aws_s3_bucket.inbox) == 0 && length(aws_kms_key.inbox) == 0 && length(aws_ses_receipt_rule.inbox) == 0 &&
      length(data.aws_ses_active_receipt_rule_set.current) == 0
    )
    error_message = "Without hold ids and inbox_enabled, no tier-3 or inbox resource may exist (production plans no change)."
  }
  assert {
    condition     = keys(aws_lambda_function.runner) == ["1", "2"]
    error_message = "Tier 1/2 resource addresses are unchanged."
  }
}

run "tier3_off_by_default" {
  command = apply
  variables {
    enabled                    = true
    alarm_actions_enabled      = true
    hold_account_ids           = [for i in range(12) : format("hold-%02d", i + 1)]
    inbox_enabled              = true
    inbox_domain               = "inbox.example.com"
    inbox_local_part           = "canary-staging"
    inbox_expected_senders     = ["recovery@vault.notify.example.com"]
    inbox_expected_dkim_domain = "vault.notify.example.com"
  }
  override_data {
    target = data.aws_ses_active_receipt_rule_set.current[0]
    values = { rule_set_name = "escrow-canary-inbox" }
  }
  assert {
    condition     = alltrue([for rule in aws_cloudwatch_event_rule.tier3 : rule.state == "DISABLED"]) && alltrue([for rule in aws_cloudwatch_event_rule.schedule : rule.state == "ENABLED"])
    error_message = "Tier 3 schedules stay disabled until tier3_enabled, independently of tiers 1/2."
  }
  assert {
    condition     = alltrue([for alarm in merge(aws_cloudwatch_metric_alarm.tier3, aws_cloudwatch_metric_alarm.tier3_step) : !alarm.actions_enabled])
    error_message = "Tier 3 alarm actions stay off until tier3_enabled."
  }
}

run "tier3_contract" {
  command = apply
  variables {
    enabled                    = true
    alarm_actions_enabled      = true
    tier3_enabled              = true
    hold_account_ids           = [for i in range(12) : format("hold-%02d", i + 1)]
    inbox_enabled              = true
    inbox_domain               = "inbox.example.com"
    inbox_local_part           = "canary-staging"
    inbox_expected_senders     = ["recovery@vault.notify.example.com"]
    inbox_expected_dkim_domain = "vault.notify.example.com"
  }
  override_data {
    target = data.aws_ses_active_receipt_rule_set.current[0]
    values = { rule_set_name = "escrow-canary-inbox" }
  }
  override_resource {
    target = aws_secretsmanager_secret.account
    values = { arn = "arn:aws:secretsmanager:us-east-1:000000000000:secret:tier12" }
  }
  assert {
    condition = alltrue([for role, fn in aws_lambda_function.tier3 :
      fn.runtime == "nodejs22.x" && one(fn.architectures) == "arm64" && fn.reserved_concurrent_executions == 1 &&
      fn.environment[0].variables.CANARY_TIER == "3" && fn.environment[0].variables.CANARY_ROLE == role
    ]) && aws_lambda_function.tier3["runner"].timeout <= 840 && aws_lambda_function.tier3["evaluator"].timeout == 60
    error_message = "Tier 3 Lambdas: Node22 arm64, serialized, runner within the 15-minute tick."
  }
  assert {
    condition = alltrue([for role, rule in aws_cloudwatch_event_rule.tier3 : rule.schedule_expression == "rate(15 minutes)" && rule.state == "ENABLED"]) && alltrue([
      for role, target in aws_cloudwatch_event_target.tier3 : target.retry_policy[0].maximum_retry_attempts == 0 && target.retry_policy[0].maximum_event_age_in_seconds == 60 &&
      target.input_transformer[0].input_template == "{\"tier\":3,\"role\":\"${role}\",\"time\":<time>}"
    ]) && alltrue([for config in aws_lambda_function_event_invoke_config.tier3 : config.maximum_retry_attempts == 0 && config.maximum_event_age_in_seconds == 60])
    error_message = "15-minute schedules, no automatic retries, 60 s maximum event age, role in the event."
  }
  assert {
    condition = (
      jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[0].Resource == local.hold_secret_arns &&
      length(jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[0].Resource) == 12 &&
      !contains(jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[0].Resource, "arn:aws:secretsmanager:us-east-1:000000000000:secret:tier12") &&
      jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[1].Condition.StringEquals["kms:EncryptionContext:SecretARN"] == local.hold_secret_arns &&
      !contains(jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[4].Action, "dynamodb:Scan") &&
      !contains(jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[4].Action, "dynamodb:DeleteItem") &&
      jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[5].Condition.StringLike["s3:prefix"] == ["inbox/*"] &&
      jsondecode(aws_iam_role_policy.tier3_runner[0].policy).Statement[7].Condition.StringEquals["kms:ViaService"] == "s3.us-east-1.amazonaws.com"
    )
    error_message = "Runner: exactly the 12 hold secrets, ledger without Scan/Delete, inbox prefix read only."
  }
  assert {
    condition = (
      aws_lambda_function.tier3["runner"].environment[0].variables.CANARY_HOLD_ACCOUNTS_JSON == jsonencode([for i in range(12) : format("hold-%02d", i + 1)]) &&
      aws_lambda_function.tier3["runner"].environment[0].variables.TIER3_HOLD_SECRET_PREFIX == "escrow-canary-staging/tier3/" &&
      alltrue([for id, secret in aws_secretsmanager_secret.hold : secret.name == "escrow-canary-staging/tier3/${id}"]) &&
      aws_lambda_function.tier3["runner"].environment[0].variables.INBOX_LOCAL_PART == "canary-staging" &&
      local.tier3_runner_env_bytes <= 3800
    )
    error_message = "Runner gets hold ids only (secrets addressed by name), the exact inbox local part, and fits Lambda's 4 KB environment."
  }
  assert {
    condition = (
      length(jsondecode(aws_iam_role_policy.tier3_evaluator[0].policy).Statement) == 3 &&
      jsondecode(aws_iam_role_policy.tier3_evaluator[0].policy).Statement[0].Action == ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem"] &&
      !strcontains(aws_iam_role_policy.tier3_evaluator[0].policy, "secretsmanager") &&
      !strcontains(aws_iam_role_policy.tier3_evaluator[0].policy, "s3:") &&
      !strcontains(aws_iam_role_policy.tier3_evaluator[0].policy, "PutItem") &&
      !contains(keys(aws_lambda_function.tier3["evaluator"].environment[0].variables), "CANARY_HOLD_ACCOUNTS_JSON")
    )
    error_message = "Evaluator: ledger reads and metrics only."
  }
  assert {
    condition = alltrue([for role, policy in aws_iam_role_policy.runner :
      jsondecode(policy.policy).Statement[0].Resource == local.tier_secrets[role] && length(jsondecode(policy.policy).Statement) == 4
    ])
    error_message = "Tier 1/2 roles are unchanged and never gain hold secrets."
  }
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.tier3["overdue"].treat_missing_data == "notBreaching" && aws_cloudwatch_metric_alarm.tier3["overdue"].period == 900 &&
      aws_cloudwatch_metric_alarm.tier3["evaluator-silent"].statistic == "SampleCount" && aws_cloudwatch_metric_alarm.tier3["evaluator-silent"].period * aws_cloudwatch_metric_alarm.tier3["evaluator-silent"].evaluation_periods == 2700 &&
      aws_cloudwatch_metric_alarm.tier3["evaluator-silent"].treat_missing_data == "breaching" &&
      aws_cloudwatch_metric_alarm.tier3["start-silent"].threshold == 1560 && aws_cloudwatch_metric_alarm.tier3["start-silent"].period >= 1800 &&
      aws_cloudwatch_metric_alarm.tier3["pool-low"].threshold == 2 && aws_cloudwatch_metric_alarm.tier3["pool-low"].period >= 1800 &&
      aws_cloudwatch_metric_alarm.tier3["email-slow"].dimensions == tomap({ Environment = "staging", Tier = "3", Kind = "code" }) &&
      aws_cloudwatch_metric_alarm.tier3["email-slow"].treat_missing_data == "ignore" &&
      length(aws_cloudwatch_metric_alarm.tier3_step) == 6 &&
      alltrue([for alarm in aws_cloudwatch_metric_alarm.tier3_step : alarm.treat_missing_data == "notBreaching" && alarm.statistic == "Minimum" && alarm.dimensions == tomap({ Environment = "staging", Tier = "3" })]) &&
      alltrue([for alarm in merge(aws_cloudwatch_metric_alarm.tier3, aws_cloudwatch_metric_alarm.tier3_step) : alarm.actions_enabled])
    )
    error_message = "Tier 3 alarm table (CANARY.md §9 with jitter-tolerant breaching periods)."
  }
  assert {
    condition = (
      aws_cloudwatch_metric_alarm.tier3["pool-low"].alarm_actions == toset([aws_sns_topic.tickets[0].arn]) &&
      aws_cloudwatch_metric_alarm.tier3["email-slow"].alarm_actions == toset([aws_sns_topic.tickets[0].arn]) &&
      aws_cloudwatch_metric_alarm.tier3["overdue"].alarm_actions == toset([aws_sns_topic.alarms.arn]) &&
      aws_sns_topic_subscription.tickets[0].endpoint == "test@example.invalid"
    )
    error_message = "Pool-low and email-slow are tickets; everything else pages."
  }
  assert {
    condition     = aws_dynamodb_table.tier3[0].point_in_time_recovery[0].enabled && aws_dynamodb_table.tier3[0].ttl[0].attribute_name == "expiresAt" && !aws_dynamodb_table.tier3[0].deletion_protection_enabled
    error_message = "Ledger: PITR and TTL; deletion protection is production-only."
  }
  assert {
    condition = alltrue([for label, rule in aws_ses_receipt_rule.inbox :
      startswith(rule.name, "escrow-canary-staging-inbox-hold-") && one(rule.recipients) == "canary-staging+${tonumber(substr(label, 5, 2))}@inbox.example.com" &&
      rule.rule_set_name == "escrow-canary-inbox" && rule.tls_policy == "Require" && rule.scan_enabled &&
      one(rule.s3_action).object_key_prefix == "inbox/${label}/" && one(rule.s3_action).kms_key_arn == null
    ]) && length(aws_ses_receipt_rule.inbox) == 12
    error_message = "Twelve exact-recipient rules, own prefixes, no SES client-side encryption."
  }
  assert {
    condition = (
      strcontains(aws_s3_bucket_policy.inbox[0].policy, "receipt-rule-set/escrow-canary-inbox:receipt-rule/escrow-canary-staging-inbox-hold-*") &&
      strcontains(aws_s3_bucket_policy.inbox[0].policy, "aws:SecureTransport") &&
      strcontains(aws_kms_key.inbox[0].policy, "escrow-canary-staging-inbox-hold-*") &&
      aws_kms_key.inbox[0].enable_key_rotation &&
      one(aws_s3_bucket_lifecycle_configuration.inbox[0].rule).expiration[0].days == 7 &&
      one(aws_s3_bucket_ownership_controls.inbox[0].rule).object_ownership == "BucketOwnerEnforced"
    )
    error_message = "Inbox: SES writes scoped to this environment's rules, TLS only, rotated key, 7-day retention."
  }
  assert {
    condition = alltrue([for f in fileset(path.module, "*.tf") :
      !strcontains(file("${path.module}/${f}"), "resource \"aws_ses_receipt_rule_set\"") &&
      !strcontains(file("${path.module}/${f}"), "resource \"aws_ses_active_receipt_rule_set\"")
    ])
    error_message = "An environment stack must never own the account's single active receipt rule set."
  }
}

run "rejects_inactive_shared_rule_set" {
  command = plan
  variables {
    hold_account_ids           = [for i in range(12) : format("hold-%02d", i + 1)]
    inbox_enabled              = true
    inbox_domain               = "inbox.example.com"
    inbox_local_part           = "canary-staging"
    inbox_expected_senders     = ["recovery@vault.notify.example.com"]
    inbox_expected_dkim_domain = "vault.notify.example.com"
  }
  override_data {
    target = data.aws_ses_active_receipt_rule_set.current[0]
    values = { rule_set_name = "someone-elses-rule-set" }
  }
  expect_failures = [aws_ses_receipt_rule.inbox]
}

run "rejects_staging_local_part_without_suffix" {
  command = plan
  variables {
    inbox_local_part = "canary"
  }
  expect_failures = [var.inbox_local_part]
}

run "rejects_overlap_with_tier12_accounts" {
  command = plan
  variables {
    hold_account_ids = concat(["pin-a"], [for i in range(11) : format("hold-%02d", i + 1)])
  }
  expect_failures = [var.hold_account_ids]
}

run "rejects_tier3_without_inbox" {
  command = plan
  variables {
    tier3_enabled    = true
    hold_account_ids = [for i in range(12) : format("hold-%02d", i + 1)]
  }
  expect_failures = [var.tier3_enabled]
}

run "rejects_sender_outside_dkim_domain" {
  command = plan
  variables {
    inbox_expected_senders     = ["recovery@evil.example.net"]
    inbox_expected_dkim_domain = "vault.notify.example.com"
  }
  expect_failures = [var.inbox_expected_senders]
}

run "max_inputs_fit_runner_environment" {
  command = plan
  variables {
    environment                = "production"
    tenant_id                  = "learncard-production-tenant"
    firebase_api_key           = join("", [for i in range(39) : "k"])
    escrow_key_id              = join("", [for i in range(64) : "e"])
    authority_generation       = join("", [for i in range(64) : "g"])
    account_ids                = [for i in range(3) : format("tier12-account-%017d", i)]
    measurements               = [for t in range(3) : { pcr0 = join("", [for i in range(96) : "a"]), pcr1 = join("", [for i in range(96) : "b"]), pcr2 = join("", [for i in range(96) : "c"]) }]
    hold_account_ids           = [for i in range(12) : format("hold-account-%019d", i)]
    inbox_enabled              = true
    inbox_domain               = "canary-inbox.example.com"
    inbox_local_part           = "canary"
    inbox_expected_senders     = ["recovery@vault.notify.example.com", "recovery@new.vault.notify.example.com", "recovery@next.vault.notify.example.com"]
    inbox_expected_dkim_domain = "vault.notify.example.com"
  }
  override_data {
    target = data.aws_ses_active_receipt_rule_set.current[0]
    values = { rule_set_name = "escrow-canary-inbox" }
  }
  assert {
    condition     = alltrue([for id in var.hold_account_ids : length(id) == 32]) && local.tier3_runner_env_bytes <= 3800
    error_message = "Three measurement tuples, three senders and maximum-length hold ids must fit the runner environment."
  }
}

run "rejects_oversized_runner_environment" {
  command = plan
  variables {
    tenant_id                  = format("%02500d", 0)
    hold_account_ids           = [for i in range(12) : format("hold-%02d", i + 1)]
    inbox_enabled              = true
    inbox_domain               = "inbox.example.com"
    inbox_local_part           = "canary-staging"
    inbox_expected_senders     = ["recovery@vault.notify.example.com"]
    inbox_expected_dkim_domain = "vault.notify.example.com"
  }
  override_data {
    target = data.aws_ses_active_receipt_rule_set.current[0]
    values = { rule_set_name = "escrow-canary-inbox" }
  }
  expect_failures = [aws_lambda_function.tier3]
}

run "rejects_long_hold_ids" {
  command = plan
  variables {
    hold_account_ids = [for i in range(12) : format("hold-account-%021d", i)]
  }
  expect_failures = [var.hold_account_ids]
}

