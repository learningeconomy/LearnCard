# Only this local root reads dev users/client from the immutable fixture.
locals {
  fixture = jsondecode(file("${path.module}/../../../realms/learncard-dev-realm.json"))
  ci      = one([for client in local.fixture.clients : client if client.clientId == "ci-tests"])
}

resource "keycloak_user" "dev" {
  for_each       = { for user in local.fixture.users : user.username => user }
  realm_id       = module.realm.realm_id
  username       = each.key
  enabled        = each.value.enabled
  email          = try(each.value.email, null)
  email_verified = try(each.value.emailVerified, false)
  first_name     = try(each.value.firstName, null)
  last_name      = try(each.value.lastName, null)
  attributes     = { for key, values in try(each.value.attributes, {}) : key => join("##", values) }
  initial_password {
    value     = each.value.credentials[0].value
    temporary = false
  }
  depends_on = [module.realm]
}

resource "keycloak_openid_client" "ci" {
  realm_id                     = module.realm.realm_id
  client_id                    = local.ci.clientId
  access_type                  = "CONFIDENTIAL"
  client_secret                = local.ci.secret
  direct_access_grants_enabled = true
  standard_flow_enabled        = false
  implicit_flow_enabled        = false
  service_accounts_enabled     = false
}

resource "keycloak_openid_client_default_scopes" "ci" {
  realm_id       = module.realm.realm_id
  client_id      = keycloak_openid_client.ci.id
  default_scopes = local.ci.defaultClientScopes
}

resource "keycloak_generic_protocol_mapper" "ci" {
  for_each        = { for mapper in local.ci.protocolMappers : mapper.name => mapper }
  realm_id        = module.realm.realm_id
  client_id       = keycloak_openid_client.ci.id
  name            = each.key
  protocol        = each.value.protocol
  protocol_mapper = each.value.protocolMapper
  # Keycloak 26.7.4 inserts this default when importing the fixture too.
  config = merge(each.value.config, { "introspection.token.claim" = "true" })
}
