# IAM and root-console events originate in us-east-1. Forward that bus when
# the escrow deployment is elsewhere; do not silently miss global API events.
provider "aws" {
  alias                       = "governance"
  region                      = "us-east-1"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_metadata_api_check     = true
}
locals {
  authority_event_patterns = { for name, pattern in {
    access_keys = {
      source = ["aws.iam"], "detail-type" = ["AWS API Call via CloudTrail"],
      # Account-wide also catches IAM-user self-service calls omitting userName.
      detail = { eventSource = ["iam.amazonaws.com"], eventName = ["CreateAccessKey", "UpdateAccessKey", "DeleteAccessKey"] }
    }
    table_control = {
      source = ["aws.dynamodb"], "detail-type" = ["AWS API Call via CloudTrail"],
      # Deliberately account-wide: Import/Restore/ResourcePolicy use different
      # request parameter shapes; filtering just tableName misses real bypasses.
      detail = { eventSource = ["dynamodb.amazonaws.com"], eventName = ["PutResourcePolicy", "DeleteResourcePolicy", "DeleteTable", "UpdateTable", "UpdateTimeToLive", "UpdateContinuousBackups", { prefix = "Restore" }, { prefix = "Import" }] }
    }
    credential_key = {
      source = ["aws.kms"], "detail-type" = ["AWS API Call via CloudTrail"],
      detail = { eventSource = ["kms.amazonaws.com"], eventName = ["PutKeyPolicy", "CreateGrant", "DisableKey", "ScheduleKeyDeletion"], requestParameters = { keyId = [try(aws_kms_key.credentials[0].key_id, "disabled"), try(aws_kms_key.credentials[0].arn, "disabled")] } }
    }
    console = { "detail-type" = ["AWS Console Sign In via CloudTrail"], detail = { eventName = ["ConsoleLogin"] } }
    root    = { "detail-type" = ["AWS API Call via CloudTrail", "AWS Console Sign In via CloudTrail"], detail = { userIdentity = { type = ["Root"] } } }
  } : name => jsonencode(pattern) if var.enable_enrollment_authority }
  forward_global_governance = var.enable_enrollment_authority && var.aws_region != "us-east-1"
}
resource "aws_cloudwatch_event_rule" "authority_governance" {
  for_each      = local.authority_event_patterns
  name          = "${local.name_prefix}-authority-${each.key}"
  event_pattern = each.value
}
resource "aws_cloudwatch_event_target" "authority_governance" {
  for_each = local.authority_event_patterns
  rule     = aws_cloudwatch_event_rule.authority_governance[each.key].name
  arn      = aws_sns_topic.monitor.arn
  # Never publish raw CreateAccessKey/recipient/CloudTrail payloads as alerts.
  input = jsonencode({ alarm = "AuthorityGovernance:${each.key}", response = "Review the independent CloudTrail trail and suspend recovery if unauthorized." })
  dead_letter_config { arn = aws_sqs_queue.monitor_dlq.arn }
}
resource "aws_cloudwatch_event_rule" "authority_global" {
  provider = aws.governance
  count    = local.forward_global_governance ? 1 : 0
  name     = "${local.name_prefix}-authority-global"
  event_pattern = jsonencode({ "$or" = [
    { source = ["aws.iam"], detail = { eventName = ["CreateAccessKey", "UpdateAccessKey", "DeleteAccessKey"] } },
    { "detail-type" = ["AWS Console Sign In via CloudTrail"], detail = { eventName = ["ConsoleLogin"] } },
    { detail = { userIdentity = { type = ["Root"] } } },
  ] })
}
resource "aws_iam_role" "authority_global_events" {
  count              = local.forward_global_governance ? 1 : 0
  name               = "${local.name_prefix}-authority-global-events"
  assume_role_policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "events.amazonaws.com" }, Action = ["sts:AssumeRole"], Condition = { ArnEquals = { "aws:SourceArn" = aws_cloudwatch_event_rule.authority_global[0].arn } } }] })
}
resource "aws_iam_role_policy" "authority_global_events" {
  count  = local.forward_global_governance ? 1 : 0
  role   = aws_iam_role.authority_global_events[0].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Action = ["events:PutEvents"], Resource = "arn:${data.aws_partition.current.partition}:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/default" }] })
}
resource "aws_cloudwatch_event_target" "authority_global" {
  provider = aws.governance
  count    = local.forward_global_governance ? 1 : 0
  rule     = aws_cloudwatch_event_rule.authority_global[0].name
  arn      = "arn:${data.aws_partition.current.partition}:events:${var.aws_region}:${data.aws_caller_identity.current.account_id}:event-bus/default"
  role_arn = aws_iam_role.authority_global_events[0].arn
  dead_letter_config { arn = aws_sqs_queue.authority_global_dlq[0].arn }
}
resource "aws_sqs_queue" "authority_global_dlq" {
  provider                  = aws.governance
  count                     = local.forward_global_governance ? 1 : 0
  name                      = "${local.name_prefix}-global-governance-dlq"
  message_retention_seconds = 1209600
  sqs_managed_sse_enabled   = true
}
resource "aws_sqs_queue_policy" "authority_global_dlq" {
  provider  = aws.governance
  count     = local.forward_global_governance ? 1 : 0
  queue_url = aws_sqs_queue.authority_global_dlq[0].id
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "events.amazonaws.com" }, Action = ["sqs:SendMessage"], Resource = aws_sqs_queue.authority_global_dlq[0].arn,
  Condition = { ArnEquals = { "aws:SourceArn" = aws_cloudwatch_event_rule.authority_global[0].arn } } }] })
}
# The failure alarm must NOT depend on the cross-region hop it monitors.
resource "aws_sns_topic" "authority_global_failures" {
  provider = aws.governance
  count    = local.forward_global_governance ? 1 : 0
  name     = "${local.name_prefix}-global-governance-failures"
}
resource "aws_sns_topic_subscription" "authority_global_failures" {
  provider  = aws.governance
  count     = local.forward_global_governance && var.monitor_alarm_email != null ? 1 : 0
  topic_arn = aws_sns_topic.authority_global_failures[0].arn
  protocol  = "email"
  endpoint  = var.monitor_alarm_email
}
resource "aws_cloudwatch_metric_alarm" "authority_global_failures" {
  provider            = aws.governance
  count               = local.forward_global_governance ? 1 : 0
  alarm_name          = "${local.name_prefix}-global-governance-delivery"
  namespace           = "AWS/SQS"
  metric_name         = "ApproximateNumberOfMessagesVisible"
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  dimensions          = { QueueName = aws_sqs_queue.authority_global_dlq[0].name }
  alarm_actions       = [aws_sns_topic.authority_global_failures[0].arn]
}
resource "aws_sns_topic_policy" "authority_global_failures" {
  provider = aws.governance
  count    = local.forward_global_governance ? 1 : 0
  arn      = aws_sns_topic.authority_global_failures[0].arn
  policy = jsonencode({ Version = "2012-10-17", Statement = [{ Effect = "Allow", Principal = { Service = "cloudwatch.amazonaws.com" }, Action = ["sns:Publish"], Resource = aws_sns_topic.authority_global_failures[0].arn,
  Condition = { StringEquals = { "aws:SourceAccount" = data.aws_caller_identity.current.account_id }, ArnEquals = { "aws:SourceArn" = aws_cloudwatch_metric_alarm.authority_global_failures[0].arn } } }] })
}
