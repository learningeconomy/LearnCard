terraform {
  # Supply bucket, key, region and dynamodb_table using -backend-config at init.
  backend "s3" {
    encrypt = true
  }
}
