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
      Root        = "bootstrap"
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
  name         = "learncard-keycloak-${var.environment}"
  partition    = data.aws_partition.current.partition
  account_id   = data.aws_caller_identity.current.account_id
  iam_prefix   = "arn:${local.partition}:iam::${local.account_id}"
  regional_arn = "${var.aws_region}:${local.account_id}"
  ssm_prefix   = "/learncard-keycloak/${var.environment}"
  state_keys   = [for root in ["network", "service", "realm"] : "keycloak/${var.environment}/${root}.tfstate"]
  # Realm state holds automation and IdP secrets: never readable by the plan role.
  plan_state_keys = {
    deploy = local.state_keys
    plan   = [for root in ["network", "service"] : "keycloak/${var.environment}/${root}.tfstate"]
  }
  secret_arns = ["arn:${local.partition}:secretsmanager:${local.regional_arn}:secret:learncard-keycloak/${var.environment}/*"]
  # RDS-managed secrets share the rds! prefix account-wide. Ownership comes from the
  # AWS-reserved tag RDS sets (users cannot write aws:* tags).
  rds_secret_arn   = "arn:${local.partition}:secretsmanager:${local.regional_arn}:secret:rds!*"
  rds_cluster_arn  = "arn:${local.partition}:rds:${local.regional_arn}:cluster:${local.name}"
  rds_secret_owner = "aws:ResourceTag/aws:rds:primaryDBClusterArn"
  boundary_arn     = "${local.iam_prefix}:policy/${local.name}-workload-boundary"
}
