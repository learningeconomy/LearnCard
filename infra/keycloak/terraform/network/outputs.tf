locals {
  network_strings = {
    vpc_id                = module.vpc.vpc_id
    public_zone_id        = aws_route53_zone.public.zone_id
    private_zone_id       = aws_route53_zone.admin.zone_id
    auth_hostname         = var.auth_hostname
    admin_hostname        = local.admin_hostname
    auth_certificate_arn  = var.wait_for_certificate_validation ? aws_acm_certificate_validation.keycloak["auth"].certificate_arn : aws_acm_certificate.keycloak["auth"].arn
    admin_certificate_arn = var.wait_for_certificate_validation ? aws_acm_certificate_validation.keycloak["admin"].certificate_arn : aws_acm_certificate.keycloak["admin"].arn
  }
  network_lists = {
    private_subnet_ids       = module.vpc.private_subnets
    public_subnet_ids        = module.vpc.public_subnets
    public_zone_name_servers = aws_route53_zone.public.name_servers
  }
}

resource "aws_ssm_parameter" "strings" {
  for_each = local.network_strings
  name     = "${local.ssm_prefix}/network/${each.key}"
  type     = "String"
  value    = each.value
}

resource "aws_ssm_parameter" "lists" {
  for_each = local.network_lists
  name     = "${local.ssm_prefix}/network/${each.key}"
  type     = "StringList"
  value    = join(",", each.value)
}

output "vpc_id" {
  description = "Dedicated Keycloak VPC"
  value       = local.network_strings.vpc_id
}
output "private_subnet_ids" {
  description = "Private subnets in availability_zones order"
  value       = local.network_lists.private_subnet_ids
}
output "public_subnet_ids" {
  description = "Public subnets in availability_zones order"
  value       = local.network_lists.public_subnet_ids
}
output "public_zone_id" {
  description = "Delegated public auth hosted zone"
  value       = local.network_strings.public_zone_id
}
output "public_zone_name_servers" {
  description = "Four NS values to delegate at GoDaddy"
  value       = local.network_lists.public_zone_name_servers
}
output "auth_certificate_arn" {
  description = "Regional public-auth certificate; pending when validation wait is disabled"
  value       = local.network_strings.auth_certificate_arn
}
output "admin_certificate_arn" {
  description = "Regional private-admin certificate; pending when validation wait is disabled"
  value       = local.network_strings.admin_certificate_arn
}
output "private_zone_id" {
  description = "VPC-associated admin zone for the later internal ALB alias"
  value       = local.network_strings.private_zone_id
}
output "auth_hostname" {
  description = "Shared public auth hostname"
  value       = local.network_strings.auth_hostname
}
output "admin_hostname" {
  description = "Private-only admin hostname"
  value       = local.network_strings.admin_hostname
}
