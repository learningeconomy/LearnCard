# Keycloak 26.7.4's create-if-unique records EXISTING_USER_INFO on collision;
# auto-link consumes it. No detect-existing step or subflow is needed.
resource "keycloak_authentication_flow" "social" {
  realm_id = keycloak_realm.this.id
  alias    = "social first broker login"
}

resource "keycloak_authentication_execution" "social" {
  for_each = {
    review = { authenticator = "idp-review-profile", requirement = "DISABLED", priority = 10 }
    create = { authenticator = "idp-create-user-if-unique", requirement = "ALTERNATIVE", priority = 20 }
    link   = { authenticator = "idp-auto-link", requirement = "ALTERNATIVE", priority = 30 }
  }
  realm_id          = keycloak_realm.this.id
  parent_flow_alias = keycloak_authentication_flow.social.alias
  authenticator     = each.value.authenticator
  requirement       = each.value.requirement
  priority          = each.value.priority
}
