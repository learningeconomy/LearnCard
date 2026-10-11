terraform {
  required_version = ">= 1.10"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Partial config: supply bucket/key/region with -backend-config=backend-<env>.hcl.
  backend "s3" {}
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "learncard-escrow-enclave"
      ManagedBy   = "terraform"
      Environment = var.environment
      Stack       = "network"
    }
  }
}
