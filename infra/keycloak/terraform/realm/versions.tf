terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
    keycloak = {
      source  = "keycloak/keycloak"
      version = "= 5.9.0"
    }
  }
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.expected_account_id]
}

provider "keycloak" {
  url              = nonsensitive(data.aws_ssm_parameter.admin_url.value)
  realm            = "master"
  client_id        = var.bootstrap_admin ? "admin-cli" : "terraform-realm"
  username         = var.bootstrap_admin ? "admin" : null
  password         = var.bootstrap_admin ? data.aws_secretsmanager_secret_version.automation.secret_string : null
  client_secret    = var.bootstrap_admin ? null : data.aws_secretsmanager_secret_version.automation.secret_string
  keycloak_version = "26.7.4"
}
