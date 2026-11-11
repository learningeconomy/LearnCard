variable "environment" {
  description = "Account environment"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "aws_region" {
  description = "Resource and state bucket region"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]+$", var.aws_region))
    error_message = "Provide an AWS region name."
  }
}

variable "expected_account_id" {
  description = "Account ID from the selected environment; rejects wrong-account credentials"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.expected_account_id))
    error_message = "Provide a 12-digit AWS account ID."
  }
}

variable "github_repository" {
  description = "Case-sensitive GitHub owner/repository for OIDC subjects"
  type        = string
  default     = "learningeconomy/LearnCard"
  validation {
    condition     = can(regex("^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$", var.github_repository))
    error_message = "Use owner/repository without wildcards."
  }
}

variable "create_github_oidc_provider" {
  description = "Create only if the account has no GitHub OIDC provider; otherwise reuse it"
  type        = bool
  default     = false
}

variable "replication_destination_account_id" {
  description = "Production account receiving images; required only in staging"
  type        = string
  default     = null
  validation {
    condition = var.environment == "staging" ? (
      can(regex("^[0-9]{12}$", var.replication_destination_account_id)) && var.replication_destination_account_id != var.expected_account_id
    ) : var.replication_destination_account_id == null
    error_message = "Staging requires a different destination account; production must leave it null."
  }
}

variable "replication_destination_region" {
  description = "Region of the production ECR registry"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]+$", var.replication_destination_region))
    error_message = "Provide an AWS region name."
  }
}

variable "replication_source_account_id" {
  description = "Staging account allowed to replicate images; required only in production"
  type        = string
  default     = null
  validation {
    condition = var.environment == "production" ? (
      can(regex("^[0-9]{12}$", var.replication_source_account_id)) && var.replication_source_account_id != var.expected_account_id
    ) : var.replication_source_account_id == null
    error_message = "Production requires a different source account; staging must leave it null."
  }
}

variable "monthly_budget_usd" {
  description = "Monthly USD budget; null uses staging 300 / production 1000"
  type        = number
  default     = null
  validation {
    condition     = var.monthly_budget_usd == null ? true : var.monthly_budget_usd > 0
    error_message = "Budget must be positive."
  }
}

variable "budget_alert_emails" {
  description = "One to ten monitored email addresses; supply via TF_VAR_budget_alert_emails"
  type        = list(string)
  validation {
    condition     = length(var.budget_alert_emails) >= 1 && length(var.budget_alert_emails) <= 10 && alltrue([for email in var.budget_alert_emails : can(regex("^[^ @]+@[^ @]+\\.[^ @]+$", email))])
    error_message = "Provide one to ten valid alert email addresses."
  }
}

variable "state_administrator_arns" {
  description = "Approved same-account human admin/break-glass IAM role ARNs (not STS session ARNs) allowed to access state"
  type        = list(string)
  validation {
    condition = length(var.state_administrator_arns) > 0 && alltrue([
      for arn in var.state_administrator_arns : can(regex("^arn:aws:iam::${var.expected_account_id}:role/.+$", arn)) && !strcontains(arn, "*")
    ])
    error_message = "Provide at least one exact IAM role ARN in the selected account, including the role performing bootstrap."
  }
}
