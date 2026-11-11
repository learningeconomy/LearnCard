# Test-only upstream. This file is deliberately outside the deployable realm module.
locals {
  fake_google = jsondecode(file("${path.module}/../../../test/fake-google-realm.json"))
  google_policy = one([
    for idp in jsondecode(file("${path.module}/../../../realms/learncard-dev-realm.json")).identityProviders : idp
    if idp.alias == "google"
  ])
}

resource "keycloak_realm" "fake_google" {
  realm        = "fake-google"
  enabled      = true
  ssl_required = "none"
}

resource "keycloak_openid_client" "fake_google" {
  realm_id              = keycloak_realm.fake_google.id
  client_id             = "learncard-broker"
  access_type           = "CONFIDENTIAL"
  client_secret         = "fake-google-test-only-secret"
  standard_flow_enabled = true
  valid_redirect_uris   = local.fake_google.clients[0].redirectUris
}

resource "keycloak_user" "fake_google" {
  for_each       = { for user in local.fake_google.users : user.username => user }
  realm_id       = keycloak_realm.fake_google.id
  username       = each.value.username
  email          = each.value.email
  email_verified = each.value.emailVerified
  enabled        = true
  first_name     = each.value.firstName
  last_name      = each.value.lastName
  initial_password {
    value     = each.value.credentials[0].value
    temporary = false
  }
}

resource "keycloak_oidc_identity_provider" "fake_google" {
  realm                         = module.realm.realm_id
  alias                         = "fake-google"
  trust_email                   = local.google_policy.trustEmail
  first_broker_login_flow_alias = "social first broker login"
  client_id                     = keycloak_openid_client.fake_google.client_id
  client_secret                 = keycloak_openid_client.fake_google.client_secret
  issuer                        = "http://localhost:8081/realms/fake-google"
  authorization_url             = "http://localhost:8081/realms/fake-google/protocol/openid-connect/auth"
  token_url                     = "http://localhost:8080/realms/fake-google/protocol/openid-connect/token"
  jwks_url                      = "http://localhost:8080/realms/fake-google/protocol/openid-connect/certs"
  validate_signature            = true
  disable_user_info             = true
  default_scopes                = "openid email profile"
  sync_mode                     = "IMPORT"
  extra_config = {
    filteredByClaim  = local.google_policy.config.filteredByClaim
    claimFilterName  = local.google_policy.config.claimFilterName
    claimFilterValue = local.google_policy.config.claimFilterValue
  }
  depends_on = [module.realm]
}
