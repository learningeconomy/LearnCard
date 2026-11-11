resource "aws_budgets_budget" "keycloak" {
  name         = "${local.name}-monthly"
  budget_type  = "COST"
  limit_amount = tostring(coalesce(var.monthly_budget_usd, var.environment == "staging" ? 300 : 1000))
  limit_unit   = "USD"
  time_unit    = "MONTHLY"
  # Budgets matches user-defined cost allocation tags only with the `user:`
  # prefix; the unprefixed form is accepted but silently matches no spend.
  cost_filter {
    name   = "TagKeyValue"
    values = ["user:Project$learncard-keycloak"]
  }
  dynamic "notification" {
    for_each = [80, 100]
    content {
      comparison_operator        = "GREATER_THAN"
      threshold                  = notification.value
      threshold_type             = "PERCENTAGE"
      notification_type          = "ACTUAL"
      subscriber_email_addresses = var.budget_alert_emails
    }
  }
}
