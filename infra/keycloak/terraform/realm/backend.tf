terraform {
  # init supplies bucket, region and key=keycloak/<env>/realm.tfstate.
  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
