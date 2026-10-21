terraform {
  required_version = ">= 1.10"
  required_providers {
    keycloak = {
      source  = "keycloak/keycloak"
      version = "= 5.9.0"
    }
  }
}

variable "keycloak_url" {
  description = "Disposable local Keycloak only; never use this root against AWS"
  type        = string
  default     = "http://localhost:8081"
}

provider "keycloak" {
  url       = var.keycloak_url
  realm     = "master"
  client_id = "admin-cli"
  username  = "admin"
  password  = "admin"
}

module "realm" {
  source                    = "../../modules/realm"
  realm                     = "learncard"
  ssl_required              = "none"
  redirect_uris             = ["http://localhost:3000/*", "capacitor://localhost/*", "com.learncard.app://login"]
  web_origins               = ["+", "capacitor://localhost", "https://localhost"]
  post_logout_redirect_uris = ["http://localhost:3000/*", "capacitor://localhost/*"]
  lca_api_issuer_url        = "http://localhost:5100"
  lca_api_backchannel_url   = "http://host.docker.internal:5100"
  google_client_id          = "ci-google-client-id.apps.googleusercontent.com"
  apple_client_id           = "com.learncard.ci.signin"
  secrets = {
    lca_api_client_secret = "dev-only-secret"
    broker_client_secret  = "dev-only-broker-secret"
    google_client_secret  = "ci-google-client-secret"
    apple_team_id         = "ci-apple-team-id"
    apple_key_id          = "ci-apple-key-id"
    apple_private_key     = "ci-placeholder-not-a-real-key"
  }
}
