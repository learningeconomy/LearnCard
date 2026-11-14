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
  tiers     = { "1" = 60, "2" = 43200 }
  # Tier 2 picks PIN A/B by the scheduled UTC half-hour slot modulo two (runner.ts), so
  # :05 runs PIN A and :35 runs PIN B: each account recovers every 12 hours. Every
  # recovery appends ~8 permanent authority rows, and the ledger monitor bounds rows
  # per account (escrow-ledger-monitor MAX_ACCOUNT_ROWS); 30-minute runs filled it.
  tier2_schedule = "cron(5,35 0,12 * * ? *)"
}
