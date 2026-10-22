terraform {
  required_version = ">= 1.10"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  backend "s3" {}
}

provider "aws" {
  region              = var.aws_region
  allowed_account_ids = [var.monitoring_account_id]
  default_tags {
    tags = { Project = "escrow-canary", Environment = var.environment, ManagedBy = "terraform" }
  }
}

locals {
  name      = "escrow-canary-${var.environment}"
  namespace = "LearnCard/EscrowCanary"
  tiers     = { "1" = 60, "2" = 1800 }
}
