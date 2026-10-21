resource "keycloak_openid_client" "app" {
  realm_id                        = keycloak_realm.this.id
  client_id                       = "learncard-app"
  access_type                     = "PUBLIC"
  enabled                         = true
  standard_flow_enabled           = true
  implicit_flow_enabled           = false
  direct_access_grants_enabled    = false
  service_accounts_enabled        = false
  pkce_code_challenge_method      = "S256"
  valid_redirect_uris             = var.redirect_uris
  valid_post_logout_redirect_uris = var.post_logout_redirect_uris
  web_origins                     = var.web_origins
}

resource "keycloak_openid_client" "api" {
  realm_id                     = keycloak_realm.this.id
  client_id                    = "lca-api"
  access_type                  = "CONFIDENTIAL"
  client_secret                = var.secrets.lca_api_client_secret
  enabled                      = true
  service_accounts_enabled     = true
  standard_flow_enabled        = false
  implicit_flow_enabled        = false
  direct_access_grants_enabled = false
}

# These built-in scopes (including their mappers) are created by Keycloak.
# Manage assignments rather than creating duplicate scope resources.
resource "keycloak_openid_client_default_scopes" "app" {
  realm_id       = keycloak_realm.this.id
  client_id      = keycloak_openid_client.app.id
  default_scopes = ["profile", "email", "roles", "web-origins", "basic"]
}

resource "keycloak_openid_client_optional_scopes" "app" {
  realm_id        = keycloak_realm.this.id
  client_id       = keycloak_openid_client.app.id
  optional_scopes = ["phone"]
}

resource "keycloak_openid_user_attribute_protocol_mapper" "phone" {
  for_each                   = { phone_number = "String", phone_number_verified = "boolean" }
  realm_id                   = keycloak_realm.this.id
  client_id                  = keycloak_openid_client.app.id
  name                       = each.key
  user_attribute             = each.key
  claim_name                 = each.key
  claim_value_type           = each.value
  add_to_id_token            = true
  add_to_access_token        = true
  add_to_userinfo            = true
  add_to_token_introspection = true
}
