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
      Project     = "learncard-infisical-sync"
      Environment = var.environment
      ManagedBy   = "terraform"
      Root        = "infisical-sync"
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

data "aws_partition" "current" {}

locals {
  name       = "learncard-infisical-sync-${var.environment}"
  partition  = data.aws_partition.current.partition
  account_id = data.aws_caller_identity.current.account_id
  # Secrets Manager ARNs are regional and account-scoped. Infisical only ever
  # syncs the three runtime-secret namespaces; account-wide listing is a separate,
  # value-less statement.
  secret_name_prefixes = ["lca-api", "brain-service", "learn-cloud-service"]
  managed_secret_arns = [
    for prefix in local.secret_name_prefixes :
    "arn:${local.partition}:secretsmanager:${var.aws_region}:${local.account_id}:secret:${prefix}/*/runtime-secrets-*"
  ]
}
