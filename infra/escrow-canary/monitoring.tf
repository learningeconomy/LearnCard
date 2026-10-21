resource "aws_sns_topic" "alarms" {
  name = "${local.name}-alarms"
}
resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}
locals {
  alarm_streams = {
    "1"       = { tier = "1", period = 60, dimensions = { Tier = "1", Environment = var.environment } }
    "2-pin-a" = { tier = "2", period = 3600, dimensions = { Tier = "2", Environment = var.environment, Account = "pin-a" } }
    "2-pin-b" = { tier = "2", period = 3600, dimensions = { Tier = "2", Environment = var.environment, Account = "pin-b" } }
  }
}
resource "aws_cloudwatch_metric_alarm" "success" {
  for_each            = local.alarm_streams
  alarm_name          = "${local.name}-tier${each.key}-failure"
  namespace           = local.namespace
  metric_name         = "Tier${each.value.tier}.Success"
  dimensions          = each.value.dimensions
  statistic           = "Minimum"
  period              = each.value.period
  evaluation_periods  = each.key == "1" ? 3 : 2
  datapoints_to_alarm = 2
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "breaching"
  actions_enabled     = var.alarm_actions_enabled
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
}
resource "aws_cloudwatch_metric_alarm" "auth" {
  for_each            = local.alarm_streams
  alarm_name          = "${local.name}-tier${each.key}-runner-auth"
  namespace           = local.namespace
  metric_name         = "Runner.AuthFailure"
  dimensions          = each.value.dimensions
  statistic           = "Maximum"
  period              = each.value.period
  evaluation_periods  = each.key == "1" ? 3 : 2
  datapoints_to_alarm = 2
  comparison_operator = "GreaterThanThreshold"
  threshold           = 0
  treat_missing_data  = "notBreaching"
  actions_enabled     = var.alarm_actions_enabled
  alarm_actions       = [aws_sns_topic.alarms.arn]
  ok_actions          = [aws_sns_topic.alarms.arn]
}
resource "aws_cloudwatch_metric_alarm" "silent" {
  alarm_name          = "${local.name}-silent"
  namespace           = local.namespace
  metric_name         = "Tier1.Success"
  dimensions          = { Tier = "1", Environment = var.environment }
  statistic           = "SampleCount"
  period              = 60
  evaluation_periods  = 5
  datapoints_to_alarm = 5
  comparison_operator = "LessThanThreshold"
  threshold           = 1
  treat_missing_data  = "breaching"
  actions_enabled     = var.alarm_actions_enabled
  alarm_actions       = [aws_sns_topic.alarms.arn]
}
resource "aws_cloudwatch_dashboard" "canary" {
  dashboard_name = local.name
  dashboard_body = jsonencode({ start = "-P30D", widgets = concat([
    for tier, period in local.tiers : {
      type = "metric", width = 12, height = 6,
      properties = {
        title       = "Tier ${tier} observed success ratio (missing runs are NOT successes)", region = var.aws_region,
        view        = "timeSeries", stat = "Average", period = period,
        metrics     = [[local.namespace, "Tier${tier}.Success", "Tier", tier, "Environment", var.environment]],
        annotations = { horizontal = [{ label = "99.9% target", value = 0.999 }] }
      }
    }
    ], [{
      type = "metric", width = 24, height = 6,
      properties = { title = "Runner authentication failures", region = var.aws_region, stat = "Maximum", period = 1800,
      metrics = [for tier, period in local.tiers : [local.namespace, "Runner.AuthFailure", "Tier", tier, "Environment", var.environment]] }
      }, {
      type = "log", width = 24, height = 6,
      properties = { title = "Step latency and allowlisted failure reasons", region = var.aws_region,
      query = "SOURCE '${aws_cloudwatch_log_group.runner["1"].name}' | SOURCE '${aws_cloudwatch_log_group.runner["2"].name}' | fields @timestamp, Tier, Step, Reason, `Step.Latency`, `Step.Failure` | filter ispresent(Step) | sort @timestamp desc | limit 100" }
  }]) })
}
