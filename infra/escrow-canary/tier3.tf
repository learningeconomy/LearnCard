# Tier 3 (7-day recovery). Every resource here is gated by hold_account_ids:
# with the default [] nothing below exists and existing state plans no change.
locals {
  tier3       = length(var.hold_account_ids) > 0
  tier3_roles = local.tier3 ? toset(["runner", "evaluator"]) : toset([])
  # Runner and evaluator share the 15-minute cadence.
  tier3_schedule   = "rate(15 minutes)"
  hold_labels      = { for index, id in var.hold_account_ids : id => format("hold-%02d", index + 1) }
  hold_secret_arns = [for id in var.hold_account_ids : aws_secretsmanager_secret.hold[id].arn]
  tier3_active     = var.enabled && var.tier3_enabled
}

resource "aws_secretsmanager_secret" "hold" {
  for_each                = toset(var.hold_account_ids)
  name                    = "${local.name}/tier3/${each.value}"
  kms_key_id              = aws_kms_key.secrets.arn
  recovery_window_in_days = 30
}
# Same rule as tiers 1/2: no real value ever enters Terraform inputs or state.
resource "aws_secretsmanager_secret_version" "hold_placeholder" {
  for_each      = aws_secretsmanager_secret.hold
  secret_id     = each.value.id
  secret_string = "{}"
  lifecycle {
    ignore_changes = [secret_string, version_stages]
  }
}

# Run ledger: coordination only, no secrets (see services/escrow-canary/TIER3-DESIGN.md §2).
resource "aws_dynamodb_table" "tier3" {
  count                       = local.tier3 ? 1 : 0
  name                        = "${local.name}-tier3"
  billing_mode                = "PAY_PER_REQUEST"
  hash_key                    = "pk"
  range_key                   = "sk"
  deletion_protection_enabled = var.environment == "production"
  attribute {
    name = "pk"
    type = "S"
  }
  attribute {
    name = "sk"
    type = "S"
  }
  point_in_time_recovery {
    enabled = true
  }
  ttl {
    attribute_name = "expiresAt"
    enabled        = true
  }
}

resource "aws_cloudwatch_log_group" "tier3" {
  for_each          = local.tier3_roles
  name              = "/aws/lambda/${local.name}-tier3-${each.key}"
  retention_in_days = 30
}
resource "aws_iam_role" "tier3" {
  for_each = local.tier3_roles
  name     = "${local.name}-tier3-${each.key}"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{
    Effect = "Allow", Principal = { Service = "lambda.amazonaws.com" }, Action = "sts:AssumeRole"
  }] })
}
locals {
  # Statements are JSON-encoded individually (their shapes differ); indexes are asserted in tests.
  tier3_runner_statements = local.tier3 ? concat([
    # 0-1: exactly the 12 hold secrets (never the tier 1/2 secrets).
    jsonencode({ Effect = "Allow", Action = ["secretsmanager:GetSecretValue", "secretsmanager:PutSecretValue"], Resource = local.hold_secret_arns }),
    jsonencode({ Effect = "Allow", Action = ["kms:Decrypt", "kms:GenerateDataKey"], Resource = aws_kms_key.secrets.arn,
    Condition = { StringEquals = { "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com", "kms:EncryptionContext:SecretARN" = local.hold_secret_arns } } }),
    # 2-3: own logs, namespaced metrics.
    jsonencode({ Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.tier3["runner"].arn}:*" }),
    jsonencode({ Effect = "Allow", Action = "cloudwatch:PutMetricData", Resource = "*", Condition = { StringEquals = { "cloudwatch:namespace" = local.namespace } } }),
    # 4: ledger reads and conditional writes (TransactWriteItems authorizes as PutItem/ConditionCheckItem). No Scan, no DeleteItem.
    jsonencode({ Effect = "Allow", Action = ["dynamodb:GetItem", "dynamodb:BatchGetItem", "dynamodb:Query", "dynamodb:PutItem", "dynamodb:ConditionCheckItem"], Resource = aws_dynamodb_table.tier3[0].arn }),
    ], var.inbox_enabled ? [
    # 5-7: read-only on this environment's inbox prefix, decrypt only via S3.
    jsonencode({ Effect = "Allow", Action = "s3:ListBucket", Resource = aws_s3_bucket.inbox[0].arn, Condition = { StringLike = { "s3:prefix" = ["inbox/*"] } } }),
    jsonencode({ Effect = "Allow", Action = "s3:GetObject", Resource = "${aws_s3_bucket.inbox[0].arn}/inbox/*" }),
    jsonencode({ Effect = "Allow", Action = "kms:Decrypt", Resource = aws_kms_key.inbox[0].arn, Condition = { StringEquals = { "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com" } } }),
  ] : []) : []
}
resource "aws_iam_role_policy" "tier3_runner" {
  count  = local.tier3 ? 1 : 0
  role   = aws_iam_role.tier3["runner"].id
  policy = "{\"Version\":\"2012-10-17\",\"Statement\":[${join(",", local.tier3_runner_statements)}]}"
}
# The evaluator can only read the ledger and publish metrics: no secrets, S3, SES or writes.
resource "aws_iam_role_policy" "tier3_evaluator" {
  count = local.tier3 ? 1 : 0
  role  = aws_iam_role.tier3["evaluator"].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [
    { Effect = "Allow", Action = ["dynamodb:Scan", "dynamodb:Query", "dynamodb:GetItem"], Resource = aws_dynamodb_table.tier3[0].arn },
    { Effect = "Allow", Action = ["logs:CreateLogStream", "logs:PutLogEvents"], Resource = "${aws_cloudwatch_log_group.tier3["evaluator"].arn}:*" },
    { Effect = "Allow", Action = "cloudwatch:PutMetricData", Resource = "*", Condition = { StringEquals = { "cloudwatch:namespace" = local.namespace } } }
  ] })
}

locals {
  tier3_common_env = {
    CANARY_ENVIRONMENT = var.environment
    CANARY_TIER        = "3"
    TIER3_LEDGER_TABLE = local.tier3 ? aws_dynamodb_table.tier3[0].name : ""
    TIER3_POOL_SIZE    = "12"
  }
  tier3_runner_env = local.tier3 ? {
    CANARY_ROLE              = "runner"
    LCA_API_URL              = var.lca_api_url
    TENANT_ID                = var.tenant_id
    FIREBASE_API_KEY         = var.firebase_api_key
    ESCROW_KEY_ID            = var.escrow_key_id
    AUTHORITY_GENERATION     = var.authority_generation
    ESCROW_MEASUREMENTS_JSON = jsonencode(var.measurements)
    CANARY_ACCOUNTS_JSON     = jsonencode([for id in var.account_ids : { id = id, secretArn = aws_secretsmanager_secret.account[id].arn }])
    # Ids only: the runner addresses each hold secret by name (<prefix><id>), which
    # keeps twelve full ARNs out of Lambda's 4 KB environment.
    CANARY_HOLD_ACCOUNTS_JSON   = jsonencode(var.hold_account_ids)
    TIER3_HOLD_SECRET_PREFIX    = "${local.name}/tier3/"
    TIER3_START_HOUR_UTC        = tostring(var.tier3_start_hour_utc)
    TIER3_HOLD_DURATION_MS      = tostring(var.tier3_hold_duration_ms)
    TIER3_CANCEL_COOLDOWN_HOURS = tostring(var.tier3_cancel_cooldown_hours)
    INBOX_BUCKET                = var.inbox_enabled ? aws_s3_bucket.inbox[0].bucket : ""
    INBOX_PREFIX                = "inbox/"
    INBOX_DOMAIN                = var.inbox_domain
    INBOX_LOCAL_PART            = var.inbox_local_part
    INBOX_EXPECTED_SENDERS_JSON = jsonencode(var.inbox_expected_senders)
    INBOX_EXPECTED_DKIM_DOMAIN  = var.inbox_expected_dkim_domain
    INBOX_REQUIRE_DMARC         = tostring(var.inbox_require_dmarc)
  } : {}
  # Lambda rejects environments over 4 KB (keys + values). Secret ARNs are only
  # known after apply, so size them from their deterministic shape (name plus
  # the 7-character random suffix); every other value is known at plan.
  tier3_runner_env_bytes = local.tier3 ? sum([for key, value in merge(local.tier3_common_env, local.tier3_runner_env, {
    TIER3_LEDGER_TABLE   = "${local.name}-tier3"
    INBOX_BUCKET         = var.inbox_enabled ? "${local.name}-inbox-${var.monitoring_account_id}" : ""
    CANARY_ACCOUNTS_JSON = jsonencode([for id in var.account_ids : { id = id, secretArn = "arn:aws:secretsmanager:${var.aws_region}:${var.monitoring_account_id}:secret:${local.name}/${id}-XXXXXX" }])
  }) : length(key) + length(value)]) : 0
}
resource "aws_lambda_function" "tier3" {
  for_each                       = local.tier3_roles
  function_name                  = "${local.name}-tier3-${each.key}"
  role                           = aws_iam_role.tier3[each.key].arn
  runtime                        = "nodejs22.x"
  architectures                  = ["arm64"]
  handler                        = "handler.handler"
  filename                       = var.lambda_zip_path
  source_code_hash               = filebase64sha256(var.lambda_zip_path)
  timeout                        = each.key == "runner" ? 840 : 60
  memory_size                    = each.key == "runner" ? 1024 : 256
  reserved_concurrent_executions = 1
  environment {
    variables = each.key == "runner" ? merge(local.tier3_common_env, local.tier3_runner_env) : merge(local.tier3_common_env, { CANARY_ROLE = "evaluator" })
  }
  depends_on = [aws_iam_role_policy.tier3_runner, aws_iam_role_policy.tier3_evaluator, aws_cloudwatch_log_group.tier3]
  lifecycle {
    precondition {
      # 3800 of 4096 bytes leaves headroom for estimate drift (e.g. a longer partition).
      condition     = each.key != "runner" || local.tier3_runner_env_bytes <= 3800
      error_message = "Tier 3 runner environment exceeds 3800 bytes (Lambda limit 4 KB): shorten ids/labels or measurement tuples."
    }
  }
}
resource "aws_lambda_function_event_invoke_config" "tier3" {
  for_each                     = local.tier3_roles
  function_name                = aws_lambda_function.tier3[each.key].function_name
  maximum_retry_attempts       = 0
  maximum_event_age_in_seconds = 60
}
resource "aws_cloudwatch_event_rule" "tier3" {
  for_each            = local.tier3_roles
  name                = "${local.name}-tier3-${each.key}"
  schedule_expression = local.tier3_schedule
  state               = local.tier3_active ? "ENABLED" : "DISABLED"
}
resource "aws_cloudwatch_event_target" "tier3" {
  for_each = local.tier3_roles
  rule     = aws_cloudwatch_event_rule.tier3[each.key].name
  arn      = aws_lambda_function.tier3[each.key].arn
  input_transformer {
    input_paths    = { time = "$.time" }
    input_template = "{\"tier\":3,\"role\":\"${each.key}\",\"time\":<time>}"
  }
  retry_policy {
    maximum_event_age_in_seconds = 60
    maximum_retry_attempts       = 0
  }
}
resource "aws_lambda_permission" "tier3" {
  for_each       = local.tier3_roles
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.tier3[each.key].function_name
  principal      = "events.amazonaws.com"
  source_arn     = aws_cloudwatch_event_rule.tier3[each.key].arn
  source_account = var.monitoring_account_id
}
