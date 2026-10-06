locals {
  public_dimensions = {
    LoadBalancer = aws_lb.keycloak.arn_suffix
    TargetGroup  = aws_lb_target_group.keycloak["public"].arn_suffix
  }
  ecs_dimensions = { ClusterName = aws_ecs_cluster.keycloak.name, ServiceName = aws_ecs_service.keycloak.name }
  db_dimensions  = { DBClusterIdentifier = aws_rds_cluster.keycloak.cluster_identifier }
  metric_alarms = merge({
    unhealthy = {
      namespace  = "AWS/ApplicationELB", metric = "HealthyHostCount", stat = "Minimum", threshold = 1,
      comparison = "LessThanThreshold", period = 60, periods = 2, dimensions = local.public_dimensions,
      missing    = "breaching", critical = true
    }
    degraded = {
      namespace  = "AWS/ApplicationELB", metric = "HealthyHostCount", stat = "Minimum", threshold = var.min_task_count,
      comparison = "LessThanThreshold", period = 60, periods = 10, dimensions = local.public_dimensions,
      missing    = "breaching", critical = false
    }
    db-capacity = {
      namespace  = "AWS/RDS", metric = "ServerlessDatabaseCapacity", stat = "Maximum", threshold = var.db_max_capacity * 0.9,
      comparison = "GreaterThanOrEqualToThreshold", period = 60, periods = 15, dimensions = local.db_dimensions,
      missing    = "notBreaching", critical = false
    }
    db-connections = {
      namespace  = "AWS/RDS", metric = "DatabaseConnections", stat = "Maximum", threshold = var.db_connection_budget * 0.8,
      comparison = "GreaterThanThreshold", period = 60, periods = 5, dimensions = local.db_dimensions,
      missing    = "notBreaching", critical = false
    }
    login-errors = {
      namespace  = local.name, metric = "LoginErrors", stat = "Sum", threshold = var.login_error_threshold,
      comparison = "GreaterThanThreshold", period = 300, periods = 1, dimensions = {},
      missing    = "notBreaching", critical = false
    }
    waf-blocks = {
      namespace  = "AWS/WAFV2", metric = "BlockedRequests", stat = "Sum", threshold = var.waf_block_threshold,
      comparison = "GreaterThanThreshold", period = 300, periods = 1,
      dimensions = { WebACL = aws_wafv2_web_acl.keycloak.name, Rule = "ALL", Region = var.aws_region },
      missing    = "notBreaching", critical = false
    }
    }, var.db_instance_count > 1 ? {
    db-replica-lag = {
      namespace  = "AWS/RDS", metric = "AuroraReplicaLag", stat = "Maximum", threshold = 1000,
      comparison = "GreaterThanThreshold", period = 60, periods = 10, dimensions = local.db_dimensions,
      missing    = "notBreaching", critical = false
    }
  } : {})
}

resource "aws_cloudwatch_metric_alarm" "service" {
  for_each            = local.metric_alarms
  alarm_name          = "${local.name}-${each.key}"
  alarm_description   = "${each.value.metric}: ${each.value.comparison} ${each.value.threshold}; see infra/keycloak/qa/README.md"
  namespace           = each.value.namespace
  metric_name         = each.value.metric
  statistic           = each.value.stat
  threshold           = each.value.threshold
  comparison_operator = each.value.comparison
  period              = each.value.period
  evaluation_periods  = each.value.periods
  dimensions          = each.value.dimensions
  treat_missing_data  = each.value.missing
  alarm_actions       = [each.value.critical ? local.critical_topic : local.warning_topic]
  ok_actions          = [each.value.critical ? local.critical_topic : local.warning_topic]
  depends_on          = [aws_sns_topic_policy.alarms]
}

resource "aws_cloudwatch_metric_alarm" "public_5xx" {
  alarm_name          = "${local.name}-public-5xx"
  alarm_description   = "Public target + ALB 5xx exceed 2% over 5 minutes, at least 50 attempted requests."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  threshold           = 2
  treat_missing_data  = "notBreaching"
  alarm_actions       = [local.critical_topic]
  ok_actions          = [local.critical_topic]
  # RequestCount excludes requests rejected before target selection. Include ELB
  # errors in the denominator so an all-503 outage is not hidden by the guard.
  metric_query {
    id          = "rate"
    expression  = "IF((FILL(requests,0)+FILL(elb,0))>=50,100*(FILL(target,0)+FILL(elb,0))/(FILL(requests,0)+FILL(elb,0)),0)"
    return_data = true
  }
  dynamic "metric_query" {
    for_each = { requests = "RequestCount", target = "HTTPCode_Target_5XX_Count", elb = "HTTPCode_ELB_5XX_Count" }
    content {
      id          = metric_query.key
      return_data = false
      metric {
        namespace   = "AWS/ApplicationELB"
        metric_name = metric_query.value
        dimensions  = { LoadBalancer = aws_lb.keycloak.arn_suffix }
        period      = 300
        stat        = "Sum"
      }
    }
  }
  depends_on = [aws_sns_topic_policy.alarms]
}

resource "aws_cloudwatch_metric_alarm" "slow_signin" {
  alarm_name                            = "${local.name}-slow-signin"
  alarm_description                     = "Public target response p95 exceeds 1.5 seconds for 15 minutes."
  namespace                             = "AWS/ApplicationELB"
  metric_name                           = "TargetResponseTime"
  dimensions                            = local.public_dimensions
  extended_statistic                    = "p95"
  evaluate_low_sample_count_percentiles = "ignore"
  period                                = 60
  evaluation_periods                    = 15
  threshold                             = 1.5
  comparison_operator                   = "GreaterThanThreshold"
  treat_missing_data                    = "notBreaching"
  alarm_actions                         = [local.warning_topic]
  ok_actions                            = [local.warning_topic]
  depends_on                            = [aws_sns_topic_policy.alarms]
}

resource "aws_cloudwatch_metric_alarm" "running_shortfall" {
  alarm_name          = "${local.name}-running-shortfall"
  alarm_description   = "Container Insights running task count is below desired for 10 minutes."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 10
  threshold           = 0
  treat_missing_data  = "notBreaching"
  alarm_actions       = [local.warning_topic]
  ok_actions          = [local.warning_topic]
  metric_query {
    id          = "shortfall"
    expression  = "desired-FILL(running,0)"
    return_data = true
  }
  dynamic "metric_query" {
    for_each = { desired = "DesiredTaskCount", running = "RunningTaskCount" }
    content {
      id          = metric_query.key
      return_data = false
      metric {
        namespace   = "ECS/ContainerInsights"
        metric_name = metric_query.value
        dimensions  = local.ecs_dimensions
        period      = 60
        stat        = "Average"
      }
    }
  }
  depends_on = [aws_sns_topic_policy.alarms]
}

resource "aws_cloudwatch_metric_alarm" "task_saturation" {
  for_each            = { cpu = "CPUUtilization", memory = "MemoryUtilization" }
  alarm_name          = "${local.name}-${each.key}"
  alarm_description   = "${each.value} exceeds 80% for 15 minutes while running at the autoscaling ceiling."
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 15
  threshold           = 80
  treat_missing_data  = "notBreaching"
  alarm_actions       = [local.warning_topic]
  ok_actions          = [local.warning_topic]
  metric_query {
    id          = "saturation"
    expression  = "IF(running>=${var.max_task_count},utilization,0)"
    return_data = true
  }
  metric_query {
    id          = "utilization"
    return_data = false
    metric {
      namespace   = "AWS/ECS"
      metric_name = each.value
      dimensions  = local.ecs_dimensions
      period      = 60
      stat        = "Average"
    }
  }
  metric_query {
    id          = "running"
    return_data = false
    metric {
      namespace   = "ECS/ContainerInsights"
      metric_name = "RunningTaskCount"
      dimensions  = local.ecs_dimensions
      period      = 60
      stat        = "Minimum"
    }
  }
  depends_on = [aws_sns_topic_policy.alarms]
}

resource "aws_cloudwatch_log_metric_filter" "login_errors" {
  name           = "${local.name}-login-errors"
  log_group_name = aws_cloudwatch_log_group.keycloak.name
  # Keycloak 26 logs event fields inside message, not as top-level JSON fields.
  # Match quoted or unquoted type values; restrict to the event logger.
  pattern = "{ $.loggerName = \"org.keycloak.events\" && $.message = %type=.?LOGIN_ERROR% }"
  metric_transformation {
    name          = "LoginErrors"
    namespace     = local.name
    value         = "1"
    default_value = 0
    unit          = "Count"
  }
}

resource "aws_cloudwatch_query_definition" "failed_logins" {
  name            = "${local.name}-failed-logins-by-ip"
  log_group_names = [aws_cloudwatch_log_group.keycloak.name]
  query_string    = <<-QUERY
    fields @timestamp, message
    | filter loggerName = 'org.keycloak.events' and message like /type=.?LOGIN_ERROR/
    | parse message /ipAddress=["']?(?<ip>[^,"' ]+)/
    | stats count(*) as failures by ip, bin(5m)
    | sort failures desc
  QUERY
}

resource "aws_cloudwatch_query_definition" "broker_errors" {
  name            = "${local.name}-broker-errors"
  log_group_names = [aws_cloudwatch_log_group.keycloak.name]
  query_string    = <<-QUERY
    fields @timestamp, loggerName, message
    | filter (loggerName = 'org.keycloak.events' and message like /IDENTITY_PROVIDER.*ERROR|identity_provider.*error|identity_provider_login_failure/) or (loggerName like /org.keycloak.broker/ and level in ['ERROR', 'WARN'])
    | sort @timestamp desc
    | limit 100
  QUERY
}

locals {
  warning_events = {
    deployment-failed = jsonencode({
      source    = ["aws.ecs"], "detail-type" = ["ECS Deployment State Change"],
      resources = [aws_ecs_service.keycloak.id], detail = { eventName = ["SERVICE_DEPLOYMENT_FAILED"] }
    })
    db-failover = jsonencode({
      source    = ["aws.rds"], "detail-type" = ["RDS DB Cluster Event"],
      resources = [aws_rds_cluster.keycloak.arn], detail = { EventCategories = ["failover"] }
    })
    backup-failed = jsonencode({
      source = ["aws.backup"], "detail-type" = ["Backup Job State Change"],
      detail = { resourceArn = [aws_rds_cluster.keycloak.arn], state = ["FAILED", "EXPIRED"] }
    })
    backup-copy-failed = jsonencode({
      source = ["aws.backup"], "detail-type" = ["Copy Job State Change"],
      detail = { resourceArn = [aws_rds_cluster.keycloak.arn], state = ["FAILED"] }
    })
    acm-renewal = jsonencode({
      source = ["aws.health"], "detail-type" = ["AWS Health Event"],
      detail = { service = ["ACM"], eventTypeCode = ["AWS_ACM_RENEWAL_STATE_CHANGE", "CAA_CHECK_FAILURE", "AWS_ACM_RENEWAL_FAILURE"] }
    })
    acm-action-required = jsonencode({
      source    = ["aws.acm"], "detail-type" = ["ACM Certificate Renewal Action Required"],
      resources = concat([local.network.auth_certificate_arn, local.network.admin_certificate_arn], var.additional_certificate_arns)
    })
  }
}

resource "aws_cloudwatch_event_rule" "warning" {
  for_each      = local.warning_events
  name          = "${local.name}-${each.key}"
  event_pattern = each.value
}

resource "aws_cloudwatch_event_target" "warning" {
  for_each   = local.warning_events
  rule       = aws_cloudwatch_event_rule.warning[each.key].name
  target_id  = "${local.name}-warning"
  arn        = local.warning_topic
  depends_on = [aws_sns_topic_policy.alarms]
}
