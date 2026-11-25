variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "environment" {
  type = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be staging or production."
  }
}

variable "kms_admin_users" {
  description = "IAM user names allowed to assume escrow-kms-admin with MFA. Key-policy changes need two people, so production must list at least two."
  type        = list(string)

  validation {
    condition     = length(var.kms_admin_users) >= 1
    error_message = "List at least one escrow-kms-admin user."
  }
}

variable "alarm_emails" {
  description = "Email addresses subscribed to the alarm topic. Each must confirm the subscription email from AWS."
  type        = list(string)
  default     = []
}

variable "enable_github_publisher" {
  description = "Create the production-only GitHub OIDC EIF publisher. Disabled leaves staging unchanged."
  type        = bool
  default     = false

  validation {
    condition     = !var.enable_github_publisher || var.environment == "production"
    error_message = "The GitHub publisher is restricted to production."
  }
}

variable "github_oidc_provider_arn" {
  description = "Existing same-account GitHub OIDC provider ARN, or null to create it when publishing is enabled."
  type        = string
  default     = null

  validation {
    condition     = var.github_oidc_provider_arn == null || can(regex("^arn:aws:iam::[0-9]{12}:oidc-provider/token\\.actions\\.githubusercontent\\.com$", var.github_oidc_provider_arn))
    error_message = "Use an exact GitHub OIDC provider ARN, not a wildcard or another issuer."
  }
}

variable "publisher_storage_kms_key_arn" {
  description = "Core storage CMK ARN for SSE-KMS artifacts; null only for an SSE-S3 bucket. Never use the escrow or credential CMK."
  type        = string
  default     = null

  validation {
    condition     = var.publisher_storage_kms_key_arn == null || can(regex("^arn:aws:kms:[a-z0-9-]+:[0-9]{12}:key/[a-f0-9-]+$", var.publisher_storage_kms_key_arn))
    error_message = "Use an exact storage CMK key ARN, not an alias or wildcard."
  }
}
