data "aws_caller_identity" "current" {}

data "aws_ssm_parameter" "admin_url" {
  name = "/learncard-keycloak/${var.environment}/service/admin_api_url"
  lifecycle {
    precondition {
      condition     = data.aws_caller_identity.current.account_id == var.expected_account_id && terraform.workspace == "default"
      error_message = "Wrong AWS account or non-default workspace. Check backend account/key independently."
    }
  }
}

data "aws_ssm_parameter" "public_url" {
  name = "/learncard-keycloak/${var.environment}/service/keycloak_url"
}

data "aws_secretsmanager_secret_version" "automation" {
  secret_id = "learncard-keycloak/${var.environment}/${var.bootstrap_admin ? "bootstrap-admin" : "terraform-realm"}"
}

locals {
  secret_names = toset(flatten([for realm in keys(var.realms) : [
    for name in ["google", "apple", "lca-api"] : "${realm}/${name}"
  ]]))
  credentials = { for key, secret in data.aws_secretsmanager_secret_version.realm : key => jsondecode(secret.secret_string) }
}

data "aws_secretsmanager_secret_version" "realm" {
  for_each  = local.secret_names
  secret_id = "learncard-keycloak/${var.environment}/${each.key}"
  lifecycle {
    precondition {
      condition     = alltrue([for realm in var.realms : realm.server_url == nonsensitive(data.aws_ssm_parameter.public_url.value)])
      error_message = "Generated realm servers must match this environment's public service URL."
    }
  }
}

module "realm" {
  for_each                  = var.realms
  source                    = "../modules/realm"
  realm                     = each.key
  redirect_uris             = each.value.redirect_uris
  web_origins               = each.value.web_origins
  post_logout_redirect_uris = each.value.post_logout_redirect_uris
  lca_api_issuer_url        = each.value.lca_api_issuer_url
  google_client_id          = coalesce(each.value.google_client_id, try(local.credentials["${each.key}/google"].client_id, null))
  apple_client_id           = coalesce(each.value.apple_client_id, try(local.credentials["${each.key}/apple"].client_id, null))
  secrets = {
    google_client_secret  = local.credentials["${each.key}/google"].client_secret
    apple_team_id         = local.credentials["${each.key}/apple"].team_id
    apple_key_id          = local.credentials["${each.key}/apple"].key_id
    apple_private_key     = local.credentials["${each.key}/apple"].private_key
    broker_client_secret  = local.credentials["${each.key}/lca-api"].broker_client_secret
    lca_api_client_secret = local.credentials["${each.key}/lca-api"].client_secret
  }
}
