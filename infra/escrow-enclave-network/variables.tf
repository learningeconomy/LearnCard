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

variable "vpc_cidr" {
  description = "CIDR for the escrow VPC. PrivateLink tolerates overlap with the lca-api VPC, but a distinct range keeps future peering possible."
  type        = string
  default     = "10.60.0.0/16"
}

variable "availability_zone_ids" {
  description = "AZ IDs (not names: names differ per account) for the private subnets. Must include every AZ ID the lca-api endpoint subnets use, or PrivateLink can't connect there."
  type        = list(string)

  validation {
    condition     = length(var.availability_zone_ids) >= 2 && length(distinct(var.availability_zone_ids)) == length(var.availability_zone_ids)
    error_message = "availability_zone_ids must list at least 2 distinct AZ IDs."
  }
}

variable "single_nat_gateway" {
  description = "One shared NAT gateway (cheaper, single-AZ egress) instead of one per AZ. Fine for staging; use false in production."
  type        = bool
  default     = true
}

variable "kms_interface_endpoint" {
  description = "Create a KMS interface endpoint with private DNS, so enclave KMS traffic never leaves the VPC."
  type        = bool
  default     = true
}
