# Account routes are denied at the public ALB, but kc_action uses login routes.
# Keep email user-editable in the profile schema: admin-only drops broker email
# in IDP_REVIEW. Disable the self-service actions instead (Keycloak 26.7.4).
# UPDATE_EMAIL is registered by the default-on update-email feature, although
# disabled initially; manage it explicitly to prevent accidental re-enablement.
# VERIFY_PROFILE inherits UpdateProfile.processAction (including email edits)
# when validation fails, without a password. Broker-owned, optional profile data
# does not need this completion form; it is not an application-initiated action.
resource "keycloak_required_action" "email_edit" {
  for_each = {
    UPDATE_PROFILE = 40
    UPDATE_EMAIL   = 70
    VERIFY_PROFILE = 100
  }

  realm_id       = keycloak_realm.this.id
  alias          = each.key
  enabled        = false
  default_action = false
  priority       = each.value
}
