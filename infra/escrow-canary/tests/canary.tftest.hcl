mock_provider "aws" {
  mock_resource "aws_iam_role" { defaults = { arn = "arn:aws:iam::000000000000:role/canary" } }
  mock_resource "aws_kms_key" { defaults = { arn = "arn:aws:kms:us-east-1:000000000000:key/00000000-1111-2222-3333-444444444444" } }
  mock_resource "aws_secretsmanager_secret" { defaults = { arn = "arn:aws:secretsmanager:us-east-1:000000000000:secret:canary-test" } }
  mock_resource "aws_lambda_function" { defaults = { arn = "arn:aws:lambda:us-east-1:000000000000:function:canary" } }
  mock_resource "aws_cloudwatch_event_rule" { defaults = { arn = "arn:aws:events:us-east-1:000000000000:rule/canary" } }
  mock_resource "aws_sns_topic" { defaults = { arn = "arn:aws:sns:us-east-1:000000000000:canary" } }
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
    condition     = aws_cloudwatch_metric_alarm.success["1"].evaluation_periods == 3 && aws_cloudwatch_metric_alarm.success["1"].datapoints_to_alarm == 2 && aws_cloudwatch_metric_alarm.success["2"].period == 1800 && aws_cloudwatch_metric_alarm.success["2"].evaluation_periods == 2 && alltrue([for alarm in aws_cloudwatch_metric_alarm.success : alarm.treat_missing_data == "breaching"])
    error_message = "Tier failure and silence must page on the specified windows."
  }
  assert {
    condition     = alltrue([for alarm in aws_cloudwatch_metric_alarm.auth : alarm.treat_missing_data == "breaching" && alarm.metric_name == "Runner.AuthFailure"]) && aws_cloudwatch_metric_alarm.silent.evaluation_periods == 5
    error_message = "Runner auth and silence require independent alarms."
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
