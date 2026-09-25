# Behavior source: realms/learncard-dev-realm.json on Keycloak 26.7.4.
# Lifetimes are the server defaults used when the fixture omits them.
resource "keycloak_realm" "this" {
  realm                                = var.realm
  enabled                              = true
  registration_allowed                 = false
  reset_password_allowed               = false
  ssl_required                         = var.ssl_required
  access_token_lifespan                = "5m"
  access_code_lifespan                 = "1m"
  access_code_lifespan_login           = "30m"
  access_code_lifespan_user_action     = "5m"
  sso_session_idle_timeout             = "30m"
  sso_session_max_lifespan             = "10h"
  offline_session_idle_timeout         = "720h"
  offline_session_max_lifespan         = "1440h"
  offline_session_max_lifespan_enabled = false

  security_defenses {
    brute_force_detection {
      permanent_lockout                = false
      max_login_failures               = 30
      wait_increment_seconds           = 60
      quick_login_check_milli_seconds  = 1000
      minimum_quick_login_wait_seconds = 60
      max_failure_wait_seconds         = 900
      failure_reset_time_seconds       = 43200
    }
  }
}

# Deployment requirement beyond the dev fixture: retain events for 30 days.
resource "keycloak_realm_events" "this" {
  realm_id                     = keycloak_realm.this.id
  events_enabled               = true
  events_expiration            = 2592000
  admin_events_enabled         = true
  admin_events_details_enabled = false
  events_listeners             = ["jboss-logging"]
}

resource "keycloak_realm_user_profile" "this" {
  realm_id = keycloak_realm.this.id
  # Omit unmanaged_attribute_policy: 26.7.4 rejects literal DISABLED.
  dynamic "attribute" {
    for_each = ["username", "email", "firstName", "lastName", "phone_number", "phone_number_verified"]
    content {
      name               = attribute.value
      multi_valued       = false
      required_for_roles = attribute.value == "username" ? ["user", "admin"] : []
      permissions {
        view = ["admin", "user"]
        edit = startswith(attribute.value, "phone_number") ? ["admin"] : ["admin", "user"]
      }
      dynamic "validator" {
        for_each = attribute.value == "email" ? ["email"] : attribute.value == "phone_number_verified" ? ["options"] : []
        content {
          name   = validator.value
          config = validator.value == "options" ? { options = jsonencode(["true", "false"]) } : {}
        }
      }
    }
  }
}

# No requiredActions override exists in the fixture. Keep server defaults;
# in particular, do not make profile/email/password actions default for new users.
output "realm_id" {
  description = "Managed realm ID"
  value       = keycloak_realm.this.id
}
