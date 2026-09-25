variable "aws_region" {
  description = "Region of service SSM parameters and Secrets Manager"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "AWS deployment environment (not tenant stage)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Choose staging or production."
  }
}

variable "expected_account_id" {
  description = "Account guard from the reviewed environment tfvars"
  type        = string
}

variable "bootstrap_admin" {
  description = "One-time password grant; switch back to client credentials before deleting admin"
  type        = bool
  default     = false
}

variable "realms" {
  description = "Generated tenant-stage inputs; explicitly pass generated/<stage>.tfvars.json"
  type = map(object({
    server_url                = string
    redirect_uris             = list(string)
    web_origins               = list(string)
    post_logout_redirect_uris = list(string)
    google_client_id          = optional(string)
    apple_client_id           = optional(string)
    lca_api_issuer_url        = string
  }))
  validation {
    condition = length(var.realms) > 0 && alltrue([
      for name, realm in var.realms : name != "master" && can(regex("^[a-zA-Z0-9_-]+$", name)) &&
      startswith(realm.server_url, "https://") && startswith(realm.lca_api_issuer_url, "https://") &&
      alltrue([for uri in concat(realm.redirect_uris, realm.post_logout_redirect_uris) :
        !strcontains(uri, "localhost") && !startswith(uri, "http:") && uri != "*"
      ]) && alltrue([for origin in realm.web_origins : origin != "*" && !startswith(origin, "http:")])
    ])
    error_message = "Provide nonempty application realms with HTTPS issuers and no dev redirects or wildcard origins. Native WebView origins are intentional."
  }
}
