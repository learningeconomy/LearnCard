resource "aws_route53_zone" "public" {
  name    = var.auth_hostname
  comment = "Delegated Keycloak public auth zone (${var.environment})"
  lifecycle {
    prevent_destroy = true
    precondition {
      condition     = data.aws_caller_identity.current.account_id == var.expected_account_id
      error_message = "Refusing to create the auth zone in the wrong account."
    }
  }
}

resource "aws_route53_zone" "admin" {
  name    = local.admin_hostname
  comment = "Private-only Keycloak admin zone (${var.environment})"
  vpc {
    vpc_id     = module.vpc.vpc_id
    vpc_region = var.aws_region
  }
}

locals {
  certificate_domains = { auth = var.auth_hostname, admin = local.admin_hostname }
}

resource "aws_acm_certificate" "keycloak" {
  for_each          = local.certificate_domains
  domain_name       = each.value
  validation_method = "DNS"
  lifecycle {
    create_before_destroy = true
  }
}

# Stable keys permit the zone, certificates and records to be created in one
# apply. Admin gets only an ACM CNAME publicly, never an address/alias record.
resource "aws_route53_record" "validation" {
  for_each = local.certificate_domains
  zone_id  = aws_route53_zone.public.zone_id
  name     = one(aws_acm_certificate.keycloak[each.key].domain_validation_options).resource_record_name
  type     = one(aws_acm_certificate.keycloak[each.key].domain_validation_options).resource_record_type
  records  = [one(aws_acm_certificate.keycloak[each.key].domain_validation_options).resource_record_value]
  ttl      = 60
}

resource "aws_acm_certificate_validation" "keycloak" {
  for_each                = var.wait_for_certificate_validation ? local.certificate_domains : {}
  certificate_arn         = aws_acm_certificate.keycloak[each.key].arn
  validation_record_fqdns = [aws_route53_record.validation[each.key].fqdn]
}
