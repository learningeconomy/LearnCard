variable "realm" {
  description = "Identity domain name, not necessarily a tenant name"
  type        = string
}

variable "redirect_uris" {
  description = "Explicit web and native authorization callbacks"
  type        = list(string)
}

variable "web_origins" {
  description = "Explicit browser and native WebView CORS origins"
  type        = list(string)
}

variable "post_logout_redirect_uris" {
  description = "Allowed post-logout destinations"
  type        = list(string)
}

variable "lca_api_issuer_url" {
  description = "Public lca-api OIDC issuer, without trailing slash"
  type        = string
}

variable "lca_api_backchannel_url" {
  description = "Optional separate token/JWKS/userinfo base URL for local Docker only"
  type        = string
  default     = null
}

variable "enable_google" {
  description = "Create the web Google identity provider (requires google_client_id and google_client_secret)"
  type        = bool
  default     = true
}

variable "enable_apple" {
  description = "Create the web Apple identity provider (requires apple_client_id and the apple_* secrets)"
  type        = bool
  default     = true
}

variable "google_client_id" {
  description = "Google web OAuth client ID (not the iOS audience)"
  type        = string
  default     = null
}

variable "apple_client_id" {
  description = "Apple web Services ID (not the native bundle audience)"
  type        = string
  default     = null
}

variable "secrets" {
  description = "External credentials; these values are sensitive but do enter Terraform state"
  sensitive   = true
  type = object({
    lca_api_client_secret = string
    broker_client_secret  = string
    google_client_secret  = optional(string)
    apple_team_id         = optional(string)
    apple_key_id          = optional(string)
    apple_private_key     = optional(string)
  })
}

variable "ssl_required" {
  description = "Require TLS; local test root explicitly opts out"
  type        = string
  default     = "all"
  validation {
    condition     = contains(["all", "external", "none"], var.ssl_required)
    error_message = "Use all, external or none."
  }
}
