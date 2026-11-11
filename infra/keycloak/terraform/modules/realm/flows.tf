# Hidden lca-api broker: create or automatically link an existing account.
# lca-api only issues tickets for emails proven by a one-time code or asserted
# verified by Google/Apple, the same trust level as the web social flow.
# Keep alternatives inside REQUIRED creation: REQUIRED review at their level
# would make Keycloak ignore them. Prefixed names leave built-in flows untouched.
resource "keycloak_authentication_flow" "broker" {
  realm_id = keycloak_realm.this.id
  alias    = "learncard first broker login"
}

resource "keycloak_authentication_subflow" "creation" {
  realm_id          = keycloak_realm.this.id
  alias             = "learncard user creation or linking"
  parent_flow_alias = keycloak_authentication_flow.broker.alias
  requirement       = "REQUIRED"
  priority          = 20
}

resource "keycloak_authentication_subflow" "organization" {
  realm_id          = keycloak_realm.this.id
  alias             = "learncard conditional organization"
  parent_flow_alias = keycloak_authentication_flow.broker.alias
  requirement       = "CONDITIONAL"
  priority          = 60
}

locals {
  broker_executions = {
    review                  = { parent = keycloak_authentication_flow.broker.alias, authenticator = "idp-review-profile", requirement = "REQUIRED", priority = 10 }
    create                  = { parent = keycloak_authentication_subflow.creation.alias, authenticator = "idp-create-user-if-unique", requirement = "ALTERNATIVE", priority = 10 }
    link                    = { parent = keycloak_authentication_subflow.creation.alias, authenticator = "idp-auto-link", requirement = "ALTERNATIVE", priority = 30 }
    organization_configured = { parent = keycloak_authentication_subflow.organization.alias, authenticator = "conditional-user-configured", requirement = "REQUIRED", priority = 10 }
    organization_member     = { parent = keycloak_authentication_subflow.organization.alias, authenticator = "idp-add-organization-member", requirement = "REQUIRED", priority = 20 }
  }
}

resource "keycloak_authentication_execution" "broker" {
  for_each          = local.broker_executions
  realm_id          = keycloak_realm.this.id
  parent_flow_alias = each.value.parent
  authenticator     = each.value.authenticator
  requirement       = each.value.requirement
  priority          = each.value.priority
}

resource "keycloak_authentication_execution_config" "broker" {
  for_each = {
    review = { "update.profile.on.first.login" = "off" }
    create = { "require.password.update.after.registration" = "false" }
  }
  realm_id     = keycloak_realm.this.id
  execution_id = keycloak_authentication_execution.broker[each.key].id
  alias        = "learncard broker ${each.key}"
  config       = each.value
}
