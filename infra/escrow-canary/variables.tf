variable "environment" {
  type    = string
  default = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Choose staging or production."
  }
}
variable "aws_region" {
  type    = string
  default = "us-east-1"
}
variable "monitoring_account_id" {
  type = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.monitoring_account_id))
    error_message = "Supply the dedicated monitoring member account ID, never the escrow or management account."
  }
}
variable "lca_api_url" {
  type = string
  validation {
    condition     = can(regex("^https://[^/@?#]+(/[^?#]*)?$", var.lca_api_url))
    error_message = "Use the public HTTPS lca-api REST base URL including /api if deployed there."
  }
}
variable "tenant_id" { type = string }
variable "firebase_api_key" { type = string }
variable "escrow_key_id" { type = string }
variable "authority_generation" { type = string }
variable "measurements" {
  type = list(object({ pcr0 = string, pcr1 = string, pcr2 = string }))
  validation {
    condition = length(var.measurements) > 0 && length(var.measurements) <= 3 && alltrue(flatten([
      for tuple in var.measurements : [for pcr in [tuple.pcr0, tuple.pcr1, tuple.pcr2] : can(regex("^[a-f0-9]{96}$", pcr)) && !can(regex("^0+$", pcr))]
    ]))
    error_message = "Supply 1–3 complete non-debug PCR0/1/2 tuples from the reviewed tenant config."
  }
}
variable "account_ids" {
  description = "Ordered opaque labels: tier1, tier2 A, tier2 B. Must match each secret's accountId, not emails or DIDs."
  type        = list(string)
  validation {
    condition     = length(var.account_ids) == 3 && length(toset(var.account_ids)) == 3 && alltrue([for id in var.account_ids : can(regex("^[A-Za-z0-9._-]{1,128}$", id))])
    error_message = "Supply three distinct opaque account labels."
  }
}
variable "lambda_zip_path" {
  type    = string
  default = "../../services/escrow-canary/dist/canary.zip"
}
variable "alarm_email" {
  type = string
}
variable "enabled" {
  description = "Keep false until all three secrets are provisioned and manual probes pass."
  type        = bool
  default     = false
}
variable "alarm_actions_enabled" {
  description = "Enable only after confirming SNS subscription; missing data still enters ALARM during setup."
  type        = bool
  default     = false
}
