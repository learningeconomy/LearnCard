terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = merge(var.tags, {
      Project         = var.name_prefix
      ManagedBy       = "terraform"
      Environment     = var.environment
      KeycloakVersion = var.keycloak_version
    })
  }
}

locals {
  name = "${var.name_prefix}-${var.environment}"
}
