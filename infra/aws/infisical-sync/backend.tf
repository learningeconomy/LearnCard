# Store state in the account's bootstrap state bucket. Supply bucket/key/region via
# -backend-config at init; -backend=false is used for offline validation only.
terraform {
  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
