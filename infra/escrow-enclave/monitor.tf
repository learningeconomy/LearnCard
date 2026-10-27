# Same x86_64 AL2023 bootstrap handles DynamoDB streams and scheduled sweeps.
variable "monitor_zip_path" {
  type        = string
  description = "Local ZIP containing the Linux x86_64 monitor executable named bootstrap."
}

variable "monitor_tenant" {
  type        = string
  description = "Operator-owned tenant identifier for this single-tenant ledger deployment. Never a DID."
  validation {
    condition     = can(regex("^[A-Za-z0-9._-]{1,128}$", var.monitor_tenant))
    error_message = "Use a bounded tenant identifier, not user data."
  }
}

variable "monitor_public_key_parameter_name" {
  type        = string
  description = "Absolute SSM String parameter name containing the attestation-verified ledger public key. Value is a JSON object mapping keyId to a 130-hex-character uncompressed SEC1 public key, e.g. {\"<keyId>\":\"<130-hex>\"} — supports looking up the correct key across an escrow key rotation (decisions.md D18). A legacy bare 130-hex-character value (no JSON wrapper, no keyId) is still accepted by the monitor for backward compatibility. Owned outside this module."
  validation {
    condition     = startswith(var.monitor_public_key_parameter_name, "/")
    error_message = "Use an absolute SSM parameter path."
  }
}

variable "monitor_alarm_email" {
  type        = string
  default     = null
  nullable    = true
  description = "Optional SNS email subscriber; operator must confirm the subscription."
}

variable "monitor_released_hourly_threshold" {
  type        = number
  default     = 100
  description = "Alarm when at-least-once Released count exceeds this hourly total."
  validation {
    condition     = var.monitor_released_hourly_threshold > 0
    error_message = "Threshold must be positive."
  }
}

variable "monitor_pin_failed_hourly_threshold" {
  type        = number
  default     = 100
  description = "Alarm when at-least-once PinAttemptFailed count exceeds this hourly total."
  validation {
    condition     = var.monitor_pin_failed_hourly_threshold > 0
    error_message = "Threshold must be positive."
  }
}

resource "aws_sns_topic" "monitor" {
  name = "${local.name_prefix}-ledger-alerts"
}

resource "aws_sns_topic_subscription" "monitor_email" {
  count     = var.monitor_alarm_email == null ? 0 : 1
  topic_arn = aws_sns_topic.monitor.arn
  protocol  = "email"
  endpoint  = var.monitor_alarm_email
}

resource "aws_sqs_queue" "monitor_dlq" {
  name                      = "${local.name_prefix}-monitor-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}

resource "aws_iam_role_policy" "monitor_notifications" {
  name = "${local.name_prefix}-monitor-notifications"
  role = aws_iam_role.ledger_monitor.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["sns:Publish"], Resource = aws_sns_topic.monitor.arn },
      { Effect = "Allow", Action = ["sqs:SendMessage"], Resource = aws_sqs_queue.monitor_dlq.arn },
      {
        Effect   = "Allow", Action = ["ssm:GetParameter"],
        Resource = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.monitor_public_key_parameter_name}"
      }
    ]
  })
}

resource "aws_cloudwatch_log_group" "monitor" {
  name              = "/aws/lambda/${local.name_prefix}-ledger-monitor"
  retention_in_days = 365
}

resource "aws_lambda_function" "monitor" {
  function_name    = "${local.name_prefix}-ledger-monitor"
  role             = aws_iam_role.ledger_monitor.arn
  runtime          = "provided.al2023"
  handler          = "bootstrap"
  architectures    = ["x86_64"]
  filename         = var.monitor_zip_path
  source_code_hash = filebase64sha256(var.monitor_zip_path)
  timeout          = 900
  memory_size      = 1024
  dead_letter_config {
    target_arn = aws_sqs_queue.monitor_dlq.arn
  }
  environment {
    variables = merge({
      TENANT                      = var.monitor_tenant
      RECORDS_TABLE               = aws_dynamodb_table.records.name
      HEADS_TABLE                 = aws_dynamodb_table.heads.name
      AUDIT_BUCKET                = aws_s3_bucket.audit.id
      ALARM_TOPIC                 = aws_sns_topic.monitor.arn
      LEDGER_PUBLIC_KEY_PARAMETER = var.monitor_public_key_parameter_name
      }, var.enable_enrollment_authority ? {
      AUTHORITY_TABLE           = local.authority_table_name
      AUTHORITY_GENERATION      = var.authority_generation
      AUTHORITY_TRUST_PARAMETER = local.authority_monitor_trust_parameter
    } : {})
  }
  depends_on = [aws_iam_role_policy.monitor_notifications, aws_iam_role_policy.ledger_monitor, aws_cloudwatch_log_group.monitor, aws_iam_role_policy.authority_monitor]
}

resource "aws_lambda_event_source_mapping" "monitor" {
  event_source_arn               = aws_dynamodb_table.records.stream_arn
  function_name                  = aws_lambda_function.monitor.arn
  starting_position              = "TRIM_HORIZON"
  batch_size                     = 10
  bisect_batch_on_function_error = true
  maximum_retry_attempts         = 5
  maximum_record_age_in_seconds  = 86400
  destination_config {
    on_failure {
      destination_arn = aws_sqs_queue.monitor_dlq.arn
    }
  }
}

resource "aws_cloudwatch_event_rule" "monitor_sweep" {
  name                = "${local.name_prefix}-ledger-sweep"
  schedule_expression = "rate(15 minutes)"
}

resource "aws_cloudwatch_event_target" "monitor_sweep" {
  rule = aws_cloudwatch_event_rule.monitor_sweep.name
  arn  = aws_lambda_function.monitor.arn
  retry_policy {
    maximum_event_age_in_seconds = 3600
    maximum_retry_attempts       = 5
  }
  dead_letter_config {
    arn = aws_sqs_queue.monitor_dlq.arn
  }
}

resource "aws_lambda_permission" "monitor_sweep" {
  statement_id  = "EventBridgeSweep"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monitor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monitor_sweep.arn
}

resource "aws_lambda_function_event_invoke_config" "monitor" {
  function_name                = aws_lambda_function.monitor.function_name
  maximum_event_age_in_seconds = 3600
  maximum_retry_attempts       = 2
}

# Requires the enabled management-event trail owned by escrow-enclave-bootstrap.
# Match both accepted key-ID representations of the escrow CMK and, when the
# enrollment authority is enabled, the credentials CMK (2026-10-23 drill: one
# roll changed both key policies but only the escrow change paged this alarm).
# With count = 0 the credentials list is empty: escrow-only, as before.
# authority-monitor.tf's credential_key rule also watches the credentials CMK,
# so its accepted key changes page under both alarm names (alias changes only
# under this one). The storage CMK is watched too: it encrypts the sealed
# escrow key object and the authority table. DynamoDB creates its own SSE
# grants on that key at table create/restore (invokedBy dynamodb, grantee
# dynamodb.<region>), so only grants to any other grantee page there.
#
# Alias calls carry aliasName/targetKeyId, not keyId, so a separate branch
# matches these keys' aliases by name.
#
# Denied attempts: an SCP/IAM deny can log `requestParameters: null` (observed
# for CloudTrail, see trail-monitor.tf), so a keyId-scoped branch can miss
# them. The sibling branch keys on errorCode prefix "AccessDenied" for these
# KMS event names only, account-wide: a denied call on ANY key in this account
# pages -- the same accepted false-positive tradeoff as trail_tamper.
locals {
  kms_governance_events       = ["PutKeyPolicy", "CreateGrant", "ScheduleKeyDeletion", "CancelKeyDeletion", "DisableKey", "DisableKeyRotation"]
  kms_governance_alias_events = ["CreateAlias", "UpdateAlias", "DeleteAlias"]
  kms_governance_key_ids      = concat([aws_kms_key.escrow.key_id, aws_kms_key.escrow.arn], flatten([for key in aws_kms_key.credentials : [key.key_id, key.arn]]))
  kms_storage_key_ids         = [aws_kms_key.s3.key_id, aws_kms_key.s3.arn]
  kms_governance_alias_names  = concat([aws_kms_alias.escrow.name], [for alias in aws_kms_alias.credentials : alias.name], [aws_kms_alias.s3.name])
}

resource "aws_cloudwatch_event_rule" "escrow_kms_changes" {
  name = "${local.name_prefix}-kms-governance"
  event_pattern = jsonencode({
    source        = ["aws.kms"]
    "detail-type" = ["AWS API Call via CloudTrail"]
    "$or" = [
      { detail = {
        eventSource       = ["kms.amazonaws.com"]
        eventName         = local.kms_governance_events
        requestParameters = { keyId = local.kms_governance_key_ids }
      } },
      { detail = {
        eventSource = ["kms.amazonaws.com"]
        eventName   = concat(local.kms_governance_events, local.kms_governance_alias_events)
        errorCode   = [{ prefix = "AccessDenied" }]
      } },
      { detail = {
        eventSource       = ["kms.amazonaws.com"]
        eventName         = local.kms_governance_alias_events
        requestParameters = { aliasName = local.kms_governance_alias_names }
      } },
      { detail = {
        eventSource       = ["kms.amazonaws.com"]
        eventName         = [for event in local.kms_governance_events : event if event != "CreateGrant"]
        requestParameters = { keyId = local.kms_storage_key_ids }
      } },
      { detail = {
        eventSource       = ["kms.amazonaws.com"]
        eventName         = ["CreateGrant"]
        requestParameters = { keyId = local.kms_storage_key_ids, granteePrincipal = [{ "anything-but" = { prefix = "dynamodb." } }] }
      } },
    ]
  })
}

resource "aws_cloudwatch_event_target" "escrow_kms_changes" {
  rule  = aws_cloudwatch_event_rule.escrow_kms_changes.name
  arn   = aws_sns_topic.monitor.arn
  input = jsonencode({ alarm = "EscrowKmsGovernanceChange", response = "Review the bootstrap-owned escrow-account CloudTrail logs immediately." })
  dead_letter_config {
    arn = aws_sqs_queue.monitor_dlq.arn
  }
}

resource "aws_sqs_queue_policy" "monitor_dlq" {
  queue_url = aws_sqs_queue.monitor_dlq.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow", Principal = { Service = "events.amazonaws.com" }, Action = "sqs:SendMessage",
      Resource  = aws_sqs_queue.monitor_dlq.arn,
      Condition = { ArnEquals = { "aws:SourceArn" = concat([aws_cloudwatch_event_rule.monitor_sweep.arn, aws_cloudwatch_event_rule.escrow_kms_changes.arn, aws_cloudwatch_event_rule.trail_tamper.arn], [for rule in aws_cloudwatch_event_rule.authority_governance : rule.arn]) } }
    }]
  })
}

resource "aws_sns_topic_policy" "monitor" {
  arn = aws_sns_topic.monitor.arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat([
      {
        Sid      = "AllowEventBridgePublish"
        Effect   = "Allow", Principal = { Service = "events.amazonaws.com" }, Action = "sns:Publish",
        Resource = aws_sns_topic.monitor.arn
      },
      {
        Sid      = "AllowCloudWatchAlarmPublish"
        Effect   = "Allow", Principal = { Service = "cloudwatch.amazonaws.com" }, Action = "sns:Publish",
        Resource = aws_sns_topic.monitor.arn,
        Condition = {
          StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id },
          ArnLike      = { "aws:SourceArn" = "arn:${data.aws_partition.current.partition}:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alarm:${local.name_prefix}-*" }
        }
      }
      ], local.email_enabled ? [{
        Sid       = "AllowEnclaveSesFeedback", Effect = "Allow", Principal = { Service = "ses.amazonaws.com" }, Action = "sns:Publish", Resource = aws_sns_topic.monitor.arn,
        Condition = { StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }, ArnEquals = { "aws:SourceArn" = [local.email_identity_arn, local.email_configuration_set_arn] } }
    }] : [])
  })
}

locals {
  monitor_metrics = {
    LedgerIntegrityFailure = { period = 60, threshold = 0 }
    AuditMismatch          = { period = 60, threshold = 0 }
    Released               = { period = 3600, threshold = var.monitor_released_hourly_threshold }
    PinAttemptFailed       = { period = 3600, threshold = var.monitor_pin_failed_hourly_threshold }
  }
  monitor_service_metrics = {
    errors = { namespace = "AWS/Lambda", metric = "Errors", dimensions = { FunctionName = aws_lambda_function.monitor.function_name } }
    dlq    = { namespace = "AWS/SQS", metric = "ApproximateNumberOfMessagesVisible", dimensions = { QueueName = aws_sqs_queue.monitor_dlq.name } }
  }
}

resource "aws_cloudwatch_metric_alarm" "monitor" {
  for_each            = local.monitor_metrics
  alarm_name          = "${local.name_prefix}-${each.key}"
  namespace           = "LearnCard/EscrowLedger"
  metric_name         = each.key
  dimensions          = { Tenant = var.monitor_tenant }
  statistic           = "Sum"
  period              = each.value.period
  evaluation_periods  = 1
  threshold           = each.value.threshold
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.monitor.arn]
}

resource "aws_cloudwatch_metric_alarm" "monitor_service" {
  for_each            = local.monitor_service_metrics
  alarm_name          = "${local.name_prefix}-monitor-${each.key}"
  namespace           = each.value.namespace
  metric_name         = each.value.metric
  dimensions          = each.value.dimensions
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.monitor.arn]
}

resource "aws_cloudwatch_metric_alarm" "monitor_heartbeat" {
  alarm_name          = "${local.name_prefix}-monitor-sweep-missing"
  namespace           = "LearnCard/EscrowLedger"
  metric_name         = "SweepCompleted"
  dimensions          = { Tenant = var.monitor_tenant }
  statistic           = "Sum"
  period              = 1800
  evaluation_periods  = 2
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.monitor.arn]
}

resource "aws_cloudwatch_dashboard" "monitor" {
  dashboard_name = "${local.name_prefix}-ledger-monitor"
  dashboard_body = jsonencode({ widgets = [
    { type = "metric", x = 0, y = 0, width = 12, height = 6, properties = {
      title   = "Ledger integrity and audit", region = var.aws_region, stat = "Sum", period = 60,
      metrics = [for name in ["LedgerIntegrityFailure", "AuditMismatch", "SweepCompleted"] : ["LearnCard/EscrowLedger", name, "Tenant", var.monitor_tenant]]
    } },
    { type = "metric", x = 12, y = 0, width = 12, height = 6, properties = {
      title   = "Recovery events (at least once)", region = var.aws_region, stat = "Sum", period = 3600,
      metrics = [for name in ["HoldCreated", "Released", "PinAttemptFailed", "PinLocked", "Cancelled"] : ["LearnCard/EscrowLedger", name, "Tenant", var.monitor_tenant]]
    } },
    { type = "metric", x = 0, y = 6, width = 24, height = 6, properties = {
      title = "Monitor delivery health", region = var.aws_region, stat = "Maximum", period = 60,
      metrics = [
        ["AWS/Lambda", "Errors", "FunctionName", aws_lambda_function.monitor.function_name],
        ["AWS/Lambda", "IteratorAge", "FunctionName", aws_lambda_function.monitor.function_name],
        ["AWS/SQS", "ApproximateNumberOfMessagesVisible", "QueueName", aws_sqs_queue.monitor_dlq.name]
      ]
    } }
  ] })
}

output "monitor_topic_arn" {
  value       = aws_sns_topic.monitor.arn
  description = "Independent ledger and KMS governance alarm topic."
}

output "monitor_function_name" {
  value       = aws_lambda_function.monitor.function_name
  description = "Dual-entry monitor Lambda function."
}
