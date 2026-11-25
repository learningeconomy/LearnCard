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
  # syncs the three runtime-secret namespaces, in each tenant's region (LearnCard
  # us-east-1, ScoutPass eu-west-1); account-wide listing is a separate,
  # value-less statement. IAM is global, so one role serves every region.
  secret_name_prefixes = ["lca-api", "brain-service", "learn-cloud-service"]
  # One role per service stage, so a sync on the staging connection can never
  # read or overwrite a production bundle. The production role keeps the original
  # name so existing production syncs are unaffected.
  stage_role_names = {
    dev        = "${local.name}-dev"
    production = local.name
  }
  managed_secret_arns = {
    for stage in keys(local.stage_role_names) : stage => flatten([
      for region in var.secret_regions : [
        for prefix in local.secret_name_prefixes :
        "arn:${local.partition}:secretsmanager:${region}:${local.account_id}:secret:${prefix}/${stage}/runtime-secrets-*"
      ]
    ])
  }
}
