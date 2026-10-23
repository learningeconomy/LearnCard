terraform {
  # Supply bucket, key=keycloak/<env>/service.tfstate and region at init.
  backend "s3" {
    encrypt      = true
    use_lockfile = true
  }
}
