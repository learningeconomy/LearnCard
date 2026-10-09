variable "environment" {
  description = "Account environment"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "aws_region" {
  description = "Region holding the synced Secrets Manager secrets"
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

variable "infisical_aws_principal_arn" {
  description = "Infisical US instance AWS account root principal that assumes the sync role"
  type        = string
  default     = "arn:aws:iam::381492033652:root"
  validation {
    condition     = can(regex("^arn:aws:iam::[0-9]{12}:root$", var.infisical_aws_principal_arn))
    error_message = "Provide an AWS account root principal ARN."
  }
}

variable "infisical_project_id" {
  description = "Infisical project ID used as the sts:ExternalId confused-deputy guard"
  type        = string
  validation {
    condition     = length(var.infisical_project_id) > 0 && !strcontains(var.infisical_project_id, "*")
    error_message = "Provide the exact Infisical project ID with no wildcards."
  }
}
