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
    tags = {
      Project     = "learncard-keycloak"
      Environment = var.environment
      ManagedBy   = "terraform"
      Root        = "network"
    }
  }
}

data "aws_caller_identity" "current" {
  lifecycle {
    postcondition {
      condition     = self.account_id == var.expected_account_id
      error_message = "The AWS session does not belong to the selected environment's account."
    }
  }
}

locals {
  name           = "learncard-keycloak-${var.environment}"
  ssm_prefix     = "/learncard-keycloak/${var.environment}"
  admin_hostname = "admin.${var.auth_hostname}"
}
