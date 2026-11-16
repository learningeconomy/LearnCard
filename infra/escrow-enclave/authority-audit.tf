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

# One of this set, AuthorityAccountOverCapacity: one account exceeded the
# monitor's per-account row/byte bound. That account alone is skipped (every other
# account is still verified) and the sweep also reports AuthorityCoverageFailure
# with no heartbeat. It is legitimate growth OR deliberate padding (row counting
# checks no signatures): an unknown account, a sudden jump, or non-enclave-looking
# rows is suspected tampering. See the monitor README isolation section/runbook.
resource "aws_cloudwatch_metric_alarm" "authority_integrity" {
  for_each            = var.enable_enrollment_authority ? toset(["AuthorityIntegrityFailure", "AuthorityCoverageFailure", "AuthorityAccountOverCapacity"]) : toset([])
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
# Rate signal, not integrity. After every complete sweep (never a partial one) the
# monitor emits AuthorityRepeatedPinClearAccounts = number of accounts with >= 2
# owner-signed PIN clears inside their 30-day lookback, including 0. Maximum over
# the hour is "accounts currently affected", so the threshold is an account count:
# 0 alarms on any account; during a known episode set it to the number of known
# accounts and a new account still notifies. A period longer than the 15-minute
# sweep keeps the alarm in ALARM (one notification) instead of flapping between
# sweeps; missing data is covered by the authority heartbeat alarm below.
# The per-account AuthorityRepeatedPinClear datum is still emitted for one
# release but no longer alarmed on.
resource "aws_cloudwatch_metric_alarm" "authority_repeated_pin_clear" {
  count               = var.enable_enrollment_authority ? 1 : 0
  alarm_name          = "${local.name_prefix}-AuthorityRepeatedPinClear"
  alarm_description   = "More escrow accounts than expected cleared their recovery PIN repeatedly (>= 2 clears in 30 days); check lca-api for induced post-recovery PIN clears."
  namespace           = "LearnCard/EscrowLedger"
  metric_name         = "AuthorityRepeatedPinClearAccounts"
  dimensions          = { Tenant = var.monitor_tenant }
  statistic           = "Maximum"
  period              = 3600
  evaluation_periods  = 1
  threshold           = var.authority_repeated_pin_clear_threshold
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
