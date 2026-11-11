variable "enable_enrollment_authority" {
  type        = bool
  default     = false
  description = "Provision foundations only; does not activate enclave enrollment. Install the Organizations guardrail first."
  validation {
    condition     = !var.enable_enrollment_authority || can(regex("^[a-z]{2}-[a-z0-9-]+-[0-9]$", var.aws_region))
    error_message = "Authority proxy destinations require a valid regional AWS name."
  }
}
variable "enable_enclave_email" {
  type        = bool
  default     = false
  description = "Provision enclave email and its dedicated sender (requires authority)."
  validation {
    condition     = !var.enable_enclave_email || var.enable_enrollment_authority
    error_message = "Email requires enable_enrollment_authority."
  }
}
variable "enable_credential_delivery" {
  type        = bool
  default     = false
  description = "Second provisioning phase: add host ciphertext object settings ONLY after the operator has uploaded the sealed objects. Does not wire enclave clients."
  validation {
    condition     = !var.enable_credential_delivery || var.enable_enrollment_authority
    error_message = "Credential delivery requires authority infrastructure."
  }
}
variable "authority_generation" {
  type        = string
  default     = null
  description = "Approved authority generation; also binds credential context and write-once object paths. Never reuse for a restore."
  validation {
    condition     = !var.enable_enrollment_authority || can(regex("^[A-Za-z0-9_-]{1,128}$", var.authority_generation))
    error_message = "An explicit valid authority_generation is required when enabled."
  }
}
variable "authority_tenant" {
  type        = string
  default     = null
  description = "Must match measured ESCROW_TENANT/ESCROW_AUTHORITY_TENANT."
  validation {
    condition     = !var.enable_enrollment_authority || can(regex("^[A-Za-z0-9_-]{1,128}$", var.authority_tenant))
    error_message = "An explicit valid authority_tenant is required when enabled."
  }
}
variable "authority_guardrail_policy_id" {
  type        = string
  default     = null
  description = "Receipt of the reviewed SCP installed on this member account by the management-account guardrail stack. Not a cryptographic installation proof."
  validation {
    condition     = !var.enable_enrollment_authority || can(regex("^p-[a-z0-9]{8,128}$", var.authority_guardrail_policy_id))
    error_message = "Install the Organizations guardrail before enabling authority, then provide its policy ID."
  }
}
variable "sending_domain" {
  type        = string
  default     = null
  description = "No domain default. Null preserves disabled staging inputs; required when email is enabled. Use the delegated sending subdomain, not the parent zone."
  validation {
    condition     = !var.enable_enclave_email || (try(length(var.sending_domain) <= 245, false) && can(regex("^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)+$", var.sending_domain)))
    error_message = "Email requires an explicit lowercase DNS sending_domain."
  }
}

variable "email_dmarc_policy" {
  type        = string
  default     = "none"
  description = "Sending-domain DMARC policy. Preserve monitor-only staging; promote production after alignment and report review."
  validation {
    condition     = contains(["none", "quarantine", "reject"], var.email_dmarc_policy)
    error_message = "email_dmarc_policy must be none, quarantine, or reject."
  }
}

variable "email_dmarc_report_address" {
  type        = string
  default     = null
  description = "Optional mailbox for DMARC aggregate (rua) reports on sending_domain. Cross-domain addresses also need the receiving domain's DMARC report authorization record."
  validation {
    condition     = var.email_dmarc_report_address == null || can(regex("^[^@\\s;]+@[^@\\s;]+$", var.email_dmarc_report_address))
    error_message = "email_dmarc_report_address must be a single email address."
  }
}
variable "create_sending_zone" {
  type        = bool
  default     = false
  description = "Create only the sending-domain child zone; delegate its NS records from the separately managed parent."
  validation {
    condition     = !var.create_sending_zone || var.enable_enclave_email
    error_message = "A sending zone requires enclave email."
  }
}
