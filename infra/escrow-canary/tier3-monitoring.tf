# Tier-3 alarms. Alarm series are {Environment, Tier="3"} only; Account/Kind/
# Step/Reason are diagnostic dimensions (EmailLatency also rolls up by Kind).
resource "aws_sns_topic" "tickets" {
  count = local.tier3 ? 1 : 0
  name  = "${local.name}-tickets"
}
resource "aws_sns_topic_subscription" "tickets" {
  count     = local.tier3 ? 1 : 0
  topic_arn = aws_sns_topic.tickets[0].arn
  protocol  = "email"
  endpoint  = coalesce(var.ticket_email, var.alarm_email)
}
locals {
  tier3_dimensions = { Environment = var.environment, Tier = "3" }
  tier3_actions    = var.alarm_actions_enabled && var.tier3_enabled
  # Periods are at least twice the 15-minute emission interval wherever missing
  # data is breaching, so a late invocation or ingestion delay cannot page alone.
  tier3_alarms = local.tier3 ? {
    overdue = {
      metric = "Tier3.Overdue", stat = "Maximum", period = 900, periods = 1, points = 1,
      op     = "GreaterThanThreshold", threshold = 0, missing = "notBreaching", page = true, dimensions = local.tier3_dimensions
    }
    evaluator-silent = {
      metric = "Tier3.EvaluatorHeartbeat", stat = "SampleCount", period = 900, periods = 3, points = 3,
      op     = "LessThanThreshold", threshold = 1, missing = "breaching", page = true, dimensions = local.tier3_dimensions
    }
    start-silent = {
      metric = "Tier3.StartAgeMinutes", stat = "Maximum", period = 1800, periods = 2, points = 2,
      op     = "GreaterThanThreshold", threshold = 1560, missing = "breaching", page = true, dimensions = local.tier3_dimensions
    }
    runner-auth = {
      metric = "Runner.AuthFailure", stat = "Maximum", period = 900, periods = 1, points = 1,
      op     = "GreaterThanThreshold", threshold = 0, missing = "notBreaching", page = true, dimensions = local.tier3_dimensions
    }
    pool-low = {
      metric = "Tier3.PoolAvailable", stat = "Minimum", period = 1800, periods = 2, points = 2,
      op     = "LessThanThreshold", threshold = 2, missing = "breaching", page = false, dimensions = local.tier3_dimensions
    }
    email-slow = {
      metric     = "Tier3.EmailLatency", stat = "Maximum", period = 900, periods = 1, points = 1,
      op         = "GreaterThanThreshold", threshold = var.tier3_email_slow_ms, missing = "ignore", page = false,
      dimensions = merge(local.tier3_dimensions, { Kind = "code" })
    }
  } : {}
  # Any explicit step value 0 pages; absence is normal between events.
  tier3_steps = local.tier3 ? toset(["Started", "Confirmed", "Warned", "Released", "Reenrolled", "Cancelled"]) : toset([])
}
resource "aws_cloudwatch_metric_alarm" "tier3" {
  for_each            = local.tier3_alarms
  alarm_name          = "${local.name}-tier3-${each.key}"
  namespace           = local.namespace
  metric_name         = each.value.metric
  dimensions          = each.value.dimensions
  statistic           = each.value.stat
  period              = each.value.period
  evaluation_periods  = each.value.periods
  datapoints_to_alarm = each.value.points
  comparison_operator = each.value.op
  threshold           = each.value.threshold
  treat_missing_data  = each.value.missing
  actions_enabled     = local.tier3_actions
  alarm_actions       = [each.value.page ? aws_sns_topic.alarms.arn : aws_sns_topic.tickets[0].arn]
  ok_actions          = [each.value.page ? aws_sns_topic.alarms.arn : aws_sns_topic.tickets[0].arn]
}
resource "aws_cloudwatch_metric_alarm" "tier3_step" {
  for_each            = local.tier3_steps
  alarm_name          = "${local.name}-tier3-${lower(each.key)}-failed"
  namespace           = local.namespace
  metric_name         = "Tier3.${each.key}"
  dimensions          = local.tier3_dimensions
  statistic           = "Minimum"
  period              = 300
  evaluation_periods  = 1
  datapoints_to_alarm = 1
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "notBreaching"
  actions_enabled     = local.tier3_actions
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
}
# Separate dashboard so enabling tier 3 never rewrites the live tier 1/2 dashboard.
resource "aws_cloudwatch_dashboard" "tier3" {
  count          = local.tier3 ? 1 : 0
  dashboard_name = "${local.name}-tier3"
  dashboard_body = jsonencode({ start = "-P14D", widgets = [
    {
      type = "metric", width = 12, height = 6,
      properties = { title = "Tier 3 step outcomes (explicit 0 pages)", region = var.aws_region, stat = "Minimum", period = 3600,
      metrics = [for step in ["Started", "Confirmed", "Warned", "Released", "Reenrolled", "Cancelled"] : [local.namespace, "Tier3.${step}", "Environment", var.environment, "Tier", "3"]] }
    },
    {
      type = "metric", width = 12, height = 6,
      properties = { title = "Tier 3 evaluator: overdue, pool, start age", region = var.aws_region, stat = "Maximum", period = 900,
        metrics = [
          [local.namespace, "Tier3.Overdue", "Environment", var.environment, "Tier", "3"],
          [local.namespace, "Tier3.PoolAvailable", "Environment", var.environment, "Tier", "3", { stat = "Minimum" }],
          [local.namespace, "Tier3.StartAgeMinutes", "Environment", var.environment, "Tier", "3", { yAxis = "right" }],
          [local.namespace, "Tier3.Paused", "Environment", var.environment, "Tier", "3"],
      ] }
    },
    {
      type = "log", width = 24, height = 6,
      properties = { title = "Tier 3 diagnostics (allowlisted reasons only)", region = var.aws_region,
      query = "SOURCE '${aws_cloudwatch_log_group.tier3["runner"].name}' | fields @timestamp, Account, Kind, Step, Reason, Outcome, `Step.Failure` | filter ispresent(Reason) or ispresent(Outcome) | sort @timestamp desc | limit 100" }
    }
  ] })
}
