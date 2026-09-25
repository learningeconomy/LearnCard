# Explicit copy of the fixture's first broker login tree. Provider 5.9.0 has
# no copy-flow resource. Names are prefixed so built-in flows remain untouched.
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

resource "keycloak_authentication_subflow" "existing" {
  realm_id          = keycloak_realm.this.id
  alias             = "learncard handle existing account"
  parent_flow_alias = keycloak_authentication_subflow.creation.alias
  requirement       = "ALTERNATIVE"
  priority          = 20
}

resource "keycloak_authentication_subflow" "verification" {
  realm_id          = keycloak_realm.this.id
  alias             = "learncard account verification options"
  parent_flow_alias = keycloak_authentication_subflow.existing.alias
  requirement       = "REQUIRED"
  priority          = 20
}

resource "keycloak_authentication_subflow" "reauthentication" {
  realm_id          = keycloak_realm.this.id
  alias             = "learncard verify existing account by reauthentication"
  parent_flow_alias = keycloak_authentication_subflow.verification.alias
  requirement       = "ALTERNATIVE"
  priority          = 20
}

resource "keycloak_authentication_subflow" "second_factor" {
  realm_id          = keycloak_realm.this.id
  alias             = "learncard conditional 2FA"
  parent_flow_alias = keycloak_authentication_subflow.reauthentication.alias
  requirement       = "CONDITIONAL"
  priority          = 20
}

locals {
  broker_executions = {
    review                  = { parent = keycloak_authentication_flow.broker.alias, authenticator = "idp-review-profile", requirement = "REQUIRED", priority = 10 }
    create                  = { parent = keycloak_authentication_subflow.creation.alias, authenticator = "idp-create-user-if-unique", requirement = "ALTERNATIVE", priority = 10 }
    confirm                 = { parent = keycloak_authentication_subflow.existing.alias, authenticator = "idp-confirm-link", requirement = "REQUIRED", priority = 10 }
    email                   = { parent = keycloak_authentication_subflow.verification.alias, authenticator = "idp-email-verification", requirement = "ALTERNATIVE", priority = 10 }
    password                = { parent = keycloak_authentication_subflow.reauthentication.alias, authenticator = "idp-username-password-form", requirement = "REQUIRED", priority = 10 }
    configured              = { parent = keycloak_authentication_subflow.second_factor.alias, authenticator = "conditional-user-configured", requirement = "REQUIRED", priority = 10 }
    credential              = { parent = keycloak_authentication_subflow.second_factor.alias, authenticator = "conditional-credential", requirement = "REQUIRED", priority = 20 }
    otp                     = { parent = keycloak_authentication_subflow.second_factor.alias, authenticator = "auth-otp-form", requirement = "ALTERNATIVE", priority = 30 }
    webauthn                = { parent = keycloak_authentication_subflow.second_factor.alias, authenticator = "webauthn-authenticator", requirement = "DISABLED", priority = 40 }
    recovery                = { parent = keycloak_authentication_subflow.second_factor.alias, authenticator = "auth-recovery-authn-code-form", requirement = "DISABLED", priority = 50 }
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
    review     = { "update.profile.on.first.login" = "off" }
    create     = { "require.password.update.after.registration" = "false" }
    credential = { credentials = "webauthn-passwordless" }
  }
  realm_id     = keycloak_realm.this.id
  execution_id = keycloak_authentication_execution.broker[each.key].id
  alias        = "learncard broker ${each.key}"
  config       = each.value
}
