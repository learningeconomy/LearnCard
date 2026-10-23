resource "aws_sns_topic" "alarms" {
  for_each = toset(["critical", "warning"])
  name     = "${local.name}-${each.key}"
}

locals {
  critical_topic = aws_sns_topic.alarms[var.environment == "production" ? "critical" : "warning"].arn
  warning_topic  = aws_sns_topic.alarms["warning"].arn
  alarm_subscriptions = {
    for pair in setproduct(["critical", "warning"], var.alarm_emails) :
    "${pair[0]}:${pair[1]}" => { severity = pair[0], email = pair[1] }
  }
}

resource "aws_sns_topic_subscription" "email" {
  for_each  = local.alarm_subscriptions
  topic_arn = aws_sns_topic.alarms[each.value.severity].arn
  protocol  = "email"
  endpoint  = each.value.email
}

data "aws_iam_policy_document" "alarm_topics" {
  for_each = aws_sns_topic.alarms
  statement {
    sid = "AccountAdministration"
    # Topic policies reject "SNS:*"; this is the action set of AWS's default topic policy.
    actions = [
      "SNS:AddPermission",
      "SNS:DeleteTopic",
      "SNS:GetTopicAttributes",
      "SNS:ListSubscriptionsByTopic",
      "SNS:Publish",
      "SNS:RemovePermission",
      "SNS:SetTopicAttributes",
      "SNS:Subscribe",
    ]
    resources = [each.value.arn]
    principals {
      type        = "AWS"
      identifiers = ["arn:${local.partition}:iam::${local.account_id}:root"]
    }
  }
  statement {
    sid       = "CloudWatchAlarmDelivery"
    actions   = ["sns:Publish"]
    resources = [each.value.arn]
    principals {
      type        = "Service"
      identifiers = ["cloudwatch.amazonaws.com"]
    }
    condition {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [local.account_id]
    }
    condition {
      test     = "ArnLike"
      variable = "aws:SourceArn"
      values   = ["arn:${local.partition}:cloudwatch:${var.aws_region}:${local.account_id}:alarm:${local.name}-*"]
    }
  }
  # EventBridge SNS targets do not support Condition blocks in their topic
  # permission. Keep this separate from the source-restricted CloudWatch grant.
  statement {
    sid       = "EventBridgeDelivery"
    actions   = ["sns:Publish"]
    resources = [each.value.arn]
    principals {
      type        = "Service"
      identifiers = ["events.amazonaws.com"]
    }
  }
}

resource "aws_sns_topic_policy" "alarms" {
  for_each = aws_sns_topic.alarms
  arn      = each.value.arn
  policy   = data.aws_iam_policy_document.alarm_topics[each.key].json
}
