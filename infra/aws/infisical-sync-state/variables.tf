variable "environment" {
  description = "Account environment"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "aws_region" {
  description = "Region for the state bucket and its KMS key"
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

variable "admin_principal_arn_patterns" {
  description = "aws:PrincipalArn patterns allowed to use the bucket; every other principal is denied"
  type        = list(string)
  validation {
    condition = length(var.admin_principal_arn_patterns) > 0 && alltrue([
      for pattern in var.admin_principal_arn_patterns : can(regex("^arn:aws:iam::[0-9]{12}:role/", pattern))
    ])
    error_message = "Provide one or more IAM role ARN patterns in this account."
  }
}

variable "noncurrent_version_retention_days" {
  description = "Days to keep superseded state versions for recovery"
  type        = number
  default     = 90
  validation {
    condition     = var.noncurrent_version_retention_days >= 30
    error_message = "Keep superseded state versions for at least 30 days."
  }
}
