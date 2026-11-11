# Replace via -backend-config="bucket=..."; never reuse staging state.
bucket       = "learncard-escrow-tfstate-production-<ACCOUNT_ID>"
key          = "escrow-enclave/production.tfstate"
region       = "us-east-1"
encrypt      = true
use_lockfile = true
