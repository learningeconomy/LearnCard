# Read-only observer of the distinct authority table, using the existing periodic
# sweep. No stream duplication, checkpoint writes, escrow/credential KMS access,
# or Lambda environment changes when authority is disabled.
variable "authority_monitor_guardrail_policy_id" {
  type        = string
  default     = null
  description = "Receipt for the separately attached monitor-protection SCP; verify BOTH SCPs before enabling. Not proof of attachment."
  validation {
    condition     = !var.enable_enrollment_authority || can(regex("^p-[a-zA-Z0-9]+$", var.authority_monitor_guardrail_policy_id))
    error_message = "Attach and independently verify the authority-monitor SCP first."
  }
}
locals {
  authority_monitor_trust_parameter = "/${local.name_prefix}/authority-monitor-trust"
  authority_monitor_policy = {
    Version = "2012-10-17"
    Statement = [
      { Effect = "Allow", Action = ["dynamodb:GetItem", "dynamodb:Query", "dynamodb:Scan"], Resource = local.authority_table_arn },
      { Effect = "Allow", Action = ["ssm:GetParameter"], Resource = "arn:${data.aws_partition.current.partition}:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${local.authority_monitor_trust_parameter}" },
    ]
  }
}
resource "aws_iam_role_policy" "authority_monitor" {
  count  = var.enable_enrollment_authority ? 1 : 0
  name   = "${local.name_prefix}-authority-observer"
  role   = aws_iam_role.ledger_monitor.id
  policy = jsonencode(local.authority_monitor_policy)
  lifecycle {
    precondition {
      condition     = var.monitor_tenant == var.authority_tenant
      error_message = "Authority and monitor tenant must match."
    }
  }
}
resource "aws_cloudwatch_metric_alarm" "authority_integrity" {
  for_each            = var.enable_enrollment_authority ? toset(["AuthorityIntegrityFailure", "AuthorityCoverageFailure"]) : toset([])
  alarm_name          = "${local.name_prefix}-${each.key}"
  namespace           = "LearnCard/EscrowLedger"
  metric_name         = each.key
  dimensions          = { Tenant = var.monitor_tenant }
  statistic           = "Sum"
  period              = 60
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.monitor.arn]
}
# Rate signal, not integrity: the monitor emits one datum per account per sweep
# while >= 2 owner-signed PIN clears fall inside its 30-day lookback. A period
# longer than the sweep interval keeps the alarm in ALARM (one notification)
# instead of flapping between sweeps.
resource "aws_cloudwatch_metric_alarm" "authority_repeated_pin_clear" {
  count               = var.enable_enrollment_authority ? 1 : 0
  alarm_name          = "${local.name_prefix}-AuthorityRepeatedPinClear"
  alarm_description   = "An escrow account cleared its recovery PIN repeatedly; check lca-api for induced post-recovery PIN clears."
  namespace           = "LearnCard/EscrowLedger"
  metric_name         = "AuthorityRepeatedPinClear"
  dimensions          = { Tenant = var.monitor_tenant }
  statistic           = "Sum"
  period              = 3600
  evaluation_periods  = 1
  threshold           = 0
  comparison_operator = "GreaterThanThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.monitor.arn]
}
resource "aws_cloudwatch_metric_alarm" "authority_heartbeat" {
  count               = var.enable_enrollment_authority ? 1 : 0
  alarm_name          = "${local.name_prefix}-authority-sweep-missing"
  namespace           = "LearnCard/EscrowLedger"
  metric_name         = "AuthoritySweepCompleted"
  dimensions          = { Tenant = var.monitor_tenant }
  statistic           = "Sum"
  period              = 1800
  evaluation_periods  = 2
  threshold           = 1
  comparison_operator = "LessThanThreshold"
  treat_missing_data  = "breaching"
  alarm_actions       = [aws_sns_topic.monitor.arn]
}
output "authority_monitor_trust_parameter_name" {
  value = var.enable_enrollment_authority ? local.authority_monitor_trust_parameter : null
}
