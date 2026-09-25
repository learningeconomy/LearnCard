data "aws_ssm_parameter" "network" {
  for_each = toset([
    "vpc_id", "private_subnet_ids", "public_subnet_ids", "public_zone_id",
    "auth_certificate_arn", "admin_certificate_arn", "private_zone_id", "auth_hostname", "admin_hostname"
  ])
  name = "${local.ssm_prefix}/network/${each.key}"
}

data "aws_ssm_parameter" "bootstrap" {
  for_each = toset(["workload_boundary_arn", "state_bucket_name"])
  name     = "${local.ssm_prefix}/bootstrap/${each.key}"
}

locals {
  # These parameters contain public identifiers, not secret values. SSM marks
  # all value attributes sensitive; removing that flag permits subnet for_each.
  network            = { for key, parameter in data.aws_ssm_parameter.network : key => nonsensitive(parameter.value) }
  private_subnet_ids = split(",", local.network.private_subnet_ids)
  public_subnet_ids  = split(",", local.network.public_subnet_ids)
  workload_boundary  = nonsensitive(data.aws_ssm_parameter.bootstrap["workload_boundary_arn"].value)
  state_bucket_name  = nonsensitive(data.aws_ssm_parameter.bootstrap["state_bucket_name"].value)
}
