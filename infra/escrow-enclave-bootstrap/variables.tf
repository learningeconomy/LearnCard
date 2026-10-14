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
