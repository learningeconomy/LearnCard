# PrivateLink admission and serving-capacity alerting (PRODUCTION.md step 8).
#
# The endpoint service is the only network admission control in PrivateLink
# mode (nlb.tf: the NLB SG has no ingress and does not filter PrivateLink
# traffic), so every connection request and every change to who may connect
# pages, and a loss of healthy hosts behind the NLB pages before clients notice.
# All three publish to the monitor topic; none depend on the monitor Lambda.

# Connect/Accept/Reject/Delete on the endpoint service: a request from an
# unexpected endpoint pages while it is still pendingAcceptance.
resource "aws_vpc_endpoint_connection_notification" "enclave_host" {
  count = local.privatelink_enabled ? 1 : 0

  vpc_endpoint_service_id     = aws_vpc_endpoint_service.enclave_host[0].id
  connection_notification_arn = aws_sns_topic.monitor.arn
  connection_events           = ["Connect", "Accept", "Reject", "Delete"]

  depends_on = [aws_sns_topic_policy.monitor]
}

# Who may connect and what is accepted, account-wide: this dedicated account
# hosts only the escrow endpoint service, and EC2 CloudTrail request shapes for
# these calls are nested per API, so a service-id filter would be fragile. Our
# own reviewed acceptances page too; reconcile them with the change record.
resource "aws_cloudwatch_event_rule" "privatelink_governance" {
  name = "${local.name_prefix}-privatelink-governance"
  event_pattern = jsonencode({
    source        = ["aws.ec2"]
    "detail-type" = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["ec2.amazonaws.com"]
      eventName = [
        "CreateVpcEndpointServiceConfiguration", "ModifyVpcEndpointServiceConfiguration",
        "DeleteVpcEndpointServiceConfigurations", "ModifyVpcEndpointServicePermissions",
        "ModifyVpcEndpointServicePayerResponsibility", "StartVpcEndpointServicePrivateDnsVerification",
        "AcceptVpcEndpointConnections", "RejectVpcEndpointConnections",
        "CreateVpcEndpointConnectionNotification", "ModifyVpcEndpointConnectionNotification",
        "DeleteVpcEndpointConnectionNotifications",
      ]
    }
  })
}

# Account-wide, so the page identifies the call. Only fields CloudTrail always
# sets are used: a missing input path could render invalid JSON and lose the
# page to the DLQ. eventID finds the full record (caller, request) in one lookup.
resource "aws_cloudwatch_event_target" "privatelink_governance" {
  rule = aws_cloudwatch_event_rule.privatelink_governance.name
  arn  = aws_sns_topic.monitor.arn
  input_transformer {
    input_paths    = { eventName = "$.detail.eventName", eventID = "$.detail.eventID", eventTime = "$.detail.eventTime" }
    input_template = <<-EOT
      {"alarm":"EscrowPrivateLinkChange","eventName":<eventName>,"eventID":<eventID>,"eventTime":<eventTime>,"response":"Reconcile endpoint-service permission/acceptance changes with the change record; reject unexpected connections and restore allowed principals."}
    EOT
  }
  dead_letter_config {
    arn = aws_sqs_queue.monitor_dlq.arn
  }
}

# Fewer healthy targets than the ASG minimum for five minutes, as seen by the
# best NLB node (Maximum, per AWS's HealthyHostCount guidance; cross-zone is on,
# so every node counts every target). Production refreshes keep
# MinHealthyPercentage=100 (compute.tf) and should not trip this; staging's
# single-host 50/100 roll replaces its only host and is expected to page. The
# NLB reports this every minute without traffic, so missing data means no
# registered targets and is treated as unhealthy. OK notifies the recovery.
resource "aws_cloudwatch_metric_alarm" "nlb_healthy_hosts" {
  alarm_name          = "${local.name_prefix}-nlb-healthy-hosts"
  namespace           = "AWS/NetworkELB"
  metric_name         = "HealthyHostCount"
  dimensions          = { LoadBalancer = aws_lb.enclave_host.arn_suffix, TargetGroup = aws_lb_target_group.enclave_host.arn_suffix }
  statistic           = "Maximum"
  period              = 60
  evaluation_periods  = 5
  threshold           = var.asg_min_size
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.monitor.arn]
  ok_actions          = [aws_sns_topic.monitor.arn]
}
