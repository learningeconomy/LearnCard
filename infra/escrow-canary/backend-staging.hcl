# Replace placeholders locally; do not reuse the escrow account's state bucket.
bucket       = "REPLACE-monitoring-staging-state-bucket"
key          = "escrow-canary/staging.tfstate"
region       = "us-east-1"
encrypt      = true
use_lockfile = true
