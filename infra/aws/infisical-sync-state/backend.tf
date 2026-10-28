# Empty on the first apply (local state). After the bucket exists, migrate this
# root's own state into it with -backend-config and `terraform init -migrate-state`.
terraform {
  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
