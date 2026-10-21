resource "aws_kms_key" "secrets" {
  description             = "Monitoring account canary secrets only"
  enable_key_rotation     = true
  deletion_window_in_days = 30
}
resource "aws_kms_alias" "secrets" {
  name          = "alias/${local.name}"
  target_key_id = aws_kms_key.secrets.key_id
}
resource "aws_secretsmanager_secret" "account" {
  for_each                = toset(var.account_ids)
  name                    = "${local.name}/${each.value}"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = 30
}
# No real value ever enters Terraform inputs or state. The placeholder makes
# provisioning explicit; out-of-band versions and runner rotations are ignored.
resource "aws_secretsmanager_secret_version" "placeholder" {
  for_each      = aws_secretsmanager_secret.account
  secret_id     = each.value.id
  secret_string = "{}"
  lifecycle {
    ignore_changes = [secret_string, version_stages]
  }
}
resource "aws_cloudwatch_log_group" "runner" {
  for_each          = local.tiers
  name              = "/aws/lambda/${local.name}-tier${each.key}"
  retention_in_days = 30
}
resource "aws_iam_role" "runner" {
  for_each = local.tiers
  name     = "${local.name}-tier${each.key}"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole"
  }] })
}
locals {
  tier_secrets = {
    "1" = [aws_secretsmanager_secret.account[var.account_ids[0]].arn]
    "2" = [for id in slice(var.account_ids, 1, 3) : aws_secretsmanager_secret.account[id].arn]
  }
}
resource "aws_iam_role_policy" "runner" {
  for_each = local.tiers
  role     = aws_iam_role.runner[each.key].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["secretsmanager:GetSecretValue", "secretsmanager:PutSecretValue"], Resource = local.tier_secrets[each.key] },
    { Effect = "Allow", Action = ["kms:Decrypt", "kms:GenerateDataKey"], Resource = aws_kms_key.secrets.arn,
    Condition = { StringEquals = { "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com", "kms:EncryptionContext:SecretARN" = local.tier_secrets[each.key] } } },
    { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.runner[each.key].arn}:*" },
    { Effect = "Allow", Action = "cloudwatch:PutMetricData", Resource = "*", Condition = { StringEquals = { "cloudwatch:namespace" = local.namespace } } }
  ] })
}
resource "aws_lambda_function" "runner" {
  for_each                       = local.tiers
  function_name                  = "${local.name}-tier${each.key}"
  role                           = aws_iam_role.runner[each.key].arn
  runtime                        = "nodejs22.x"
  architectures                  = ["arm64"]
  handler                        = "handler.handler"
  filename                       = var.lambda_zip_path
  source_code_hash               = filebase64sha256(var.lambda_zip_path)
  timeout                        = each.key == "1" ? 55 : 240
  memory_size                    = 1024
  reserved_concurrent_executions = 1
  environment {
    variables = {
      CANARY_ENVIRONMENT       = var.environment
      LCA_API_URL              = var.lca_api_url
      TENANT_ID                = var.tenant_id
      FIREBASE_API_KEY         = var.firebase_api_key
      ESCROW_KEY_ID            = var.escrow_key_id
      AUTHORITY_GENERATION     = var.authority_generation
      ESCROW_MEASUREMENTS_JSON = jsonencode(var.measurements)
      CANARY_ACCOUNTS_JSON     = jsonencode([for id in var.account_ids : { id = id, secretArn = aws_secretsmanager_secret.account[id].arn }])
    }
  }
  depends_on = [aws_iam_role_policy.runner, aws_cloudwatch_log_group.runner]
}
resource "aws_lambda_function_event_invoke_config" "runner" {
  for_each                     = local.tiers
  function_name                = aws_lambda_function.runner[each.key].function_name
  maximum_retry_attempts       = 0
  maximum_event_age_in_seconds = 60
}
resource "aws_cloudwatch_event_rule" "schedule" {
  for_each            = local.tiers
  name                = "${local.name}-tier${each.key}"
  schedule_expression = each.key == "1" ? "rate(1 minute)" : "rate(30 minutes)"
  state               = var.enabled ? "ENABLED" : "DISABLED"
}
resource "aws_cloudwatch_event_target" "runner" {
  for_each = local.tiers
  rule     = aws_cloudwatch_event_rule.schedule[each.key].name
  arn      = aws_lambda_function.runner[each.key].arn
  input_transformer {
    input_paths    = { time = "$.time" }
    input_template = "{\"tier\":${each.key},\"time\":<time>}"
  }
  retry_policy {
    maximum_event_age_in_seconds = 60
    maximum_retry_attempts       = 0
  }
}
resource "aws_lambda_permission" "schedule" {
  for_each       = local.tiers
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.runner[each.key].function_name
  principal      = "events.amazonaws.com"
  source_arn     = aws_cloudwatch_event_rule.schedule[each.key].arn
  source_account = var.monitoring_account_id
}
