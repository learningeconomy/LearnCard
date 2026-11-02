variable "monitoring_account_id" {
  type = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.monitoring_account_id))
    error_message = "Supply the dedicated monitoring member account ID."
  }
}
variable "aws_region" {
  description = "SES receiving region; the MX record points here."
  type        = string
  default     = "us-east-1"
}
variable "inbox_domain" {
  description = "Canary receiving domain shared by staging and production (separated by recipient local part)."
  type        = string
  validation {
    condition     = can(regex("^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$", var.inbox_domain))
    error_message = "Use a lowercase hostname."
  }
}
variable "rule_set_name" {
  type    = string
  default = "escrow-canary-inbox"
}
variable "delegation_complete" {
  description = "Set true only after the parent zone's NS delegation resolves (dig NS <inbox_domain>)."
  type        = bool
  default     = false
}
