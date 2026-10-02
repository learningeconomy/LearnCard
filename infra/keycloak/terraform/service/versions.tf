terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.expected_account_id]

  default_tags {
    tags = merge(var.tags, {
      Project         = "learncard-keycloak"
      ManagedBy       = "terraform"
      Environment     = var.environment
      KeycloakVersion = var.keycloak_version
      Root            = "service"
    })
  }
}

locals {
  name       = "learncard-keycloak-${var.environment}"
  ssm_prefix = "/learncard-keycloak/${var.environment}"
  partition  = data.aws_partition.current.partition
  account_id = data.aws_caller_identity.current.account_id
}

data "aws_caller_identity" "current" {
  lifecycle {
    postcondition {
      condition     = self.account_id == var.expected_account_id
      error_message = "The AWS session does not belong to the selected environment's account."
    }
  }
}
