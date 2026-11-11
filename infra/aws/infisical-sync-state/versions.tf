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
      Root        = "infisical-sync-state"
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
  account_id = data.aws_caller_identity.current.account_id
  auditor_config_read_actions = [
    "s3:GetBucketVersioning",
    "s3:GetBucketPublicAccessBlock",
    "s3:GetBucketPolicy",
    "s3:GetBucketPolicyStatus",
    "s3:GetEncryptionConfiguration",
    "s3:GetBucketOwnershipControls",
    "s3:GetLifecycleConfiguration",
    "s3:GetBucketLogging",
    "s3:GetBucketTagging",
    "s3:GetBucketLocation",
    "s3:GetBucketAcl",
    "s3:GetBucketObjectLockConfiguration",
    "s3:GetReplicationConfiguration",
    "s3:ListBucket",
  ]
  bucket_name = "learncard-infisical-sync-tfstate-${local.account_id}-${var.aws_region}"
}
