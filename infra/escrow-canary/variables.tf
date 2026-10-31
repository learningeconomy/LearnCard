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

# --- Tier 3 (7-day recovery) and canary inbox. Everything defaults OFF: with
# hold_account_ids = [] and inbox_enabled = false no tier-3 resource exists.
variable "hold_account_ids" {
  description = "Tier 3 pool: 0 (tier 3 absent) or exactly 12 opaque labels (at most 32 characters: Lambda's 4 KB environment budget), matching each hold secret's accountId. Never emails or DIDs."
  type        = list(string)
  default     = []
  validation {
    condition = (length(var.hold_account_ids) == 0 || length(var.hold_account_ids) == 12) && length(toset(var.hold_account_ids)) == length(var.hold_account_ids) && alltrue([
      for id in var.hold_account_ids : can(regex("^[A-Za-z0-9._-]{1,32}$", id)) && !contains(var.account_ids, id)
    ])
    error_message = "Supply 0 or 12 distinct opaque labels of at most 32 characters, disjoint from account_ids."
  }
}
variable "tier3_enabled" {
  description = "Enables tier-3 schedules and alarm actions. Requires inbox_enabled, 12 hold ids, and `tier3-admin ready` passing."
  type        = bool
  default     = false
  validation {
    condition     = !var.tier3_enabled || (var.inbox_enabled && length(var.hold_account_ids) == 12)
    error_message = "tier3_enabled requires inbox_enabled and 12 hold_account_ids."
  }
}
variable "inbox_enabled" {
  description = "Creates this environment's inbox bucket, key and receipt rules in the shared (already active) rule set."
  type        = bool
  default     = false
  validation {
    condition     = !var.inbox_enabled || (length(var.hold_account_ids) == 12 && var.inbox_domain != "" && var.inbox_local_part != "" && length(var.inbox_expected_senders) > 0 && var.inbox_expected_dkim_domain != "")
    error_message = "inbox_enabled requires 12 hold_account_ids and every inbox_* setting."
  }
}
variable "inbox_domain" {
  description = "Receiving domain owned by infra/escrow-canary-inbox (shared by staging and production)."
  type        = string
  default     = ""
  validation {
    condition     = var.inbox_domain == "" || can(regex("^([a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?\\.)+[a-z]{2,63}$", var.inbox_domain))
    error_message = "Use a lowercase hostname."
  }
}
variable "inbox_local_part" {
  description = "Recipient local part; pool addresses are <local>+<1..12>@<inbox_domain>. Staging MUST end with -staging so the environments' recipients never overlap."
  type        = string
  default     = ""
  validation {
    condition = var.inbox_local_part == "" || (can(regex("^[a-z0-9-]{1,32}$", var.inbox_local_part)) && (
      var.environment == "staging" ? endswith(var.inbox_local_part, "-staging") : !endswith(var.inbox_local_part, "-staging")
    ))
    error_message = "Use ^[a-z0-9-]{1,32}$; staging must end with -staging and production must not."
  }
}
variable "inbox_rule_set_name" {
  description = "The shared, already ACTIVE receipt rule set (infra/escrow-canary-inbox). This stack never creates or activates a rule set."
  type        = string
  default     = "escrow-canary-inbox"
}
variable "inbox_expected_senders" {
  description = "1-3 sender addresses copied from the escrow stack output enclave_email_configuration.ESCROW_EMAIL_FROM (several only during a sender rollout)."
  type        = list(string)
  default     = []
  validation {
    condition = length(var.inbox_expected_senders) <= 3 && alltrue([
      for sender in var.inbox_expected_senders : can(regex("^[^@\\s]+@([a-z0-9-]+\\.)+[a-z]{2,63}$", sender)) && (
        endswith(split("@", sender)[1], ".${var.inbox_expected_dkim_domain}") || split("@", sender)[1] == var.inbox_expected_dkim_domain
      )
    ])
    error_message = "Supply at most three sender addresses inside inbox_expected_dkim_domain."
  }
}
variable "inbox_expected_dkim_domain" {
  description = "DKIM signing domain, from the escrow output enclave_email_configuration.ESCROW_EMAIL_IDENTITY."
  type        = string
  default     = ""
}
variable "inbox_require_dmarc" {
  description = "Require dmarc=pass. Set false only if that escrow environment does not publish DMARC (aligned DKIM is still required)."
  type        = bool
  default     = true
}
variable "tier3_start_hour_utc" {
  type    = number
  default = 15
  validation {
    condition     = var.tier3_start_hour_utc >= 0 && var.tier3_start_hour_utc <= 22 && floor(var.tier3_start_hour_utc) == var.tier3_start_hour_utc
    error_message = "Use an integer hour 0-22 (the weekly cancel runs one hour later)."
  }
}
variable "tier3_hold_duration_ms" {
  description = "Must equal lca-api's configured hold duration (asserted against the signed hold record)."
  type        = number
  default     = 604800000
}
variable "tier3_cancel_cooldown_hours" {
  type    = number
  default = 48
}
variable "tier3_email_slow_ms" {
  type    = number
  default = 300000
  validation {
    condition     = var.tier3_email_slow_ms > 0
    error_message = "Must be positive."
  }
}
variable "ticket_email" {
  description = "Ticket (non-paging) notifications; defaults to alarm_email."
  type        = string
  default     = null
}
