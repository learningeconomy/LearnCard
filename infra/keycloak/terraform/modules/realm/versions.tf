terraform {
  required_version = ">= 1.10"
  required_providers {
    keycloak = {
      source  = "keycloak/keycloak"
      version = "= 5.9.0"
    }
  }
}
