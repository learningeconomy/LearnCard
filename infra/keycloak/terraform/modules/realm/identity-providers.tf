locals {
  broker_backchannel = coalesce(var.lca_api_backchannel_url, var.lca_api_issuer_url)
}

resource "keycloak_oidc_identity_provider" "api" {
  realm                         = keycloak_realm.this.id
  alias                         = "lca-api"
  display_name                  = "LearnCard"
  enabled                       = true
  trust_email                   = true
  store_token                   = false
  add_read_token_role_on_create = false
  hide_on_login_page            = true
  link_only                     = false
  first_broker_login_flow_alias = keycloak_authentication_flow.broker.alias
  client_id                     = "keycloak-broker"
  client_secret                 = var.secrets.broker_client_secret
  issuer                        = var.lca_api_issuer_url
  authorization_url             = "${var.lca_api_issuer_url}/oidc/authorize"
  token_url                     = "${local.broker_backchannel}/oidc/token"
  jwks_url                      = "${local.broker_backchannel}/oidc/jwks"
  user_info_url                 = "${local.broker_backchannel}/oidc/userinfo"
  validate_signature            = true
  default_scopes                = "openid email profile phone"
  login_hint                    = true
  sync_mode                     = "IMPORT"
  extra_config = {
    clientAuthMethod = "client_secret_basic"
    pkceEnabled      = "false"
  }
  depends_on = [keycloak_authentication_execution_config.broker]
}

resource "keycloak_oidc_google_identity_provider" "google" {
  count                         = var.enable_google ? 1 : 0
  realm                         = keycloak_realm.this.id
  alias                         = "google"
  display_name                  = "Google"
  client_id                     = var.google_client_id
  client_secret                 = var.secrets.google_client_secret
  enabled                       = true
  trust_email                   = false
  store_token                   = false
  add_read_token_role_on_create = false
  hide_on_login_page            = false
  link_only                     = false
  first_broker_login_flow_alias = keycloak_authentication_flow.broker.alias
  default_scopes                = "openid profile email"
  sync_mode                     = "IMPORT"
  depends_on                    = [keycloak_authentication_execution_config.broker]
  lifecycle {
    precondition {
      condition     = var.google_client_id != null && nonsensitive(var.secrets.google_client_secret != null)
      error_message = "enable_google requires google_client_id and secrets.google_client_secret."
    }
  }
}

# The social resource's documented provider_id override supports the installed
# klausbetz provider without inventing configurable Apple endpoint URLs.
resource "keycloak_oidc_google_identity_provider" "apple" {
  count                         = var.enable_apple ? 1 : 0
  realm                         = keycloak_realm.this.id
  provider_id                   = "apple"
  alias                         = "apple"
  display_name                  = "Apple"
  client_id                     = var.apple_client_id
  client_secret                 = var.secrets.apple_private_key
  enabled                       = true
  trust_email                   = false
  store_token                   = false
  add_read_token_role_on_create = false
  hide_on_login_page            = false
  link_only                     = false
  first_broker_login_flow_alias = keycloak_authentication_flow.broker.alias
  default_scopes                = "name%20email"
  sync_mode                     = "IMPORT"
  extra_config = {
    teamId = var.secrets.apple_team_id
    keyId  = var.secrets.apple_key_id
  }
  depends_on = [keycloak_authentication_execution_config.broker]
  lifecycle {
    precondition {
      condition = var.apple_client_id != null && nonsensitive(alltrue([
        for value in [var.secrets.apple_team_id, var.secrets.apple_key_id, var.secrets.apple_private_key] : value != null
      ]))
      error_message = "enable_apple requires apple_client_id and secrets.apple_team_id/apple_key_id/apple_private_key."
    }
  }
}

moved {
  from = keycloak_oidc_google_identity_provider.google
  to   = keycloak_oidc_google_identity_provider.google[0]
}

moved {
  from = keycloak_oidc_google_identity_provider.apple
  to   = keycloak_oidc_google_identity_provider.apple[0]
}

resource "keycloak_custom_identity_provider_mapper" "phone" {
  for_each                 = toset(["phone_number", "phone_number_verified"])
  realm                    = keycloak_realm.this.id
  name                     = each.key
  identity_provider_alias  = keycloak_oidc_identity_provider.api.alias
  identity_provider_mapper = "oidc-user-attribute-idp-mapper"
  extra_config = {
    claim            = each.key
    "user.attribute" = each.key
    syncMode         = "INHERIT"
  }
}
