variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "aws_region" {
  description = "VPC and regional ACM certificate region"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = can(regex("^[a-z]{2}(-[a-z]+)+-[0-9]+$", var.aws_region))
    error_message = "Provide an AWS region name."
  }
}

variable "expected_account_id" {
  description = "Expected environment account; rejects credentials for another account"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.expected_account_id))
    error_message = "Provide a 12-digit AWS account ID."
  }
}

variable "auth_hostname" {
  description = "Public delegated auth subzone; admin.<auth_hostname> remains private"
  type        = string
  validation {
    condition     = var.auth_hostname == (var.environment == "production" ? "auth.learncard.app" : "auth.staging.learncard.app")
    error_message = "Use the auth hostname assigned to this environment."
  }
}

variable "vpc_cidr" {
  description = "Dedicated IPv4 /16; six /24 subnets are derived deterministically"
  type        = string
  validation {
    condition     = can(cidrnetmask(var.vpc_cidr)) && can(regex("/16$", var.vpc_cidr)) && try(cidrhost(var.vpc_cidr, 0) == split("/", var.vpc_cidr)[0], false)
    error_message = "Provide a canonical IPv4 /16 network address."
  }
}

variable "availability_zones" {
  description = "Three stable, distinct standard AZ names in aws_region"
  type        = list(string)
  validation {
    condition     = length(var.availability_zones) == 3 && length(toset(var.availability_zones)) == 3 && alltrue([for az in var.availability_zones : can(regex("^${var.aws_region}[a-z]$", az))])
    error_message = "Provide three distinct standard AZs in aws_region."
  }
}

variable "single_nat_gateway" {
  description = "Use one NAT for staging; production must use one per AZ"
  type        = bool
  default     = true
  validation {
    condition     = var.environment != "production" || !var.single_nat_gateway
    error_message = "Production requires a NAT gateway per availability zone."
  }
}

variable "wait_for_certificate_validation" {
  description = "Disable only for first apply before GoDaddy NS delegation; re-enable afterwards"
  type        = bool
  default     = true
}
