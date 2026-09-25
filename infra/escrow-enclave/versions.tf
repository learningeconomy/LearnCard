# =============================================================================
# escrow-enclave — Terraform + provider requirements, backend, tags
#
# This module provisions ONLY the compute/network substrate for the Nitro
# Enclave-backed escrow recovery "enclave-host" service (P3.1 of
# .sisyphus/plans/nitro-escrow-enclave.md). IAM roles, the KMS key, S3
# (EIF bucket + audit log), and DynamoDB (ledger) are provisioned separately
# in P3.2 and passed into this module via variables (kms_key_arn,
# instance_profile_name).
# =============================================================================

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Partial backend configuration on purpose: no bucket/key/region/dynamodb
  # table is hardcoded here so the SAME module can be initialized against
  # different per-environment state buckets (staging vs production) without
  # editing source. Supply the rest at init time, e.g.:
  #
  #   terraform init \
  #     -backend-config="bucket=learncard-terraform-state-<env>" \
  #     -backend-config="key=escrow-enclave/<env>/terraform.tfstate" \
  #     -backend-config="region=us-east-1" \
  #     -backend-config="dynamodb_table=terraform-state-lock"
  #
  # or via a checked-in (non-secret) `backend-<env>.hcl` file with
  # `-backend-config=backend-<env>.hcl`. `terraform init -backend=false`
  # (used for local `terraform validate`) ignores this block entirely and
  # requires no AWS credentials.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = local.common_tags
  }
}

locals {
  # Merged onto every resource created by this module via provider
  # default_tags (with the one known exception of aws_autoscaling_group,
  # whose distinct tag {} blocks don't participate in default_tags — see
  # compute.tf). var.tags can add extra tags but cannot remove/override
  # these three.
  common_tags = merge(
    var.tags,
    {
      Project     = "learncard-escrow-enclave"
      ManagedBy   = "terraform"
      Environment = var.environment
    }
  )

  name_prefix = "escrow-enclave-${var.environment}"
}
