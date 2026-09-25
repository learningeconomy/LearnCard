resource "aws_route53_record" "keycloak" {
  zone_id = local.network.public_zone_id
  name    = local.network.auth_hostname
  type    = "A"
  alias {
    name                   = aws_lb.keycloak.dns_name
    zone_id                = aws_lb.keycloak.zone_id
    evaluate_target_health = true
  }
}

resource "aws_route53_record" "admin" {
  zone_id = local.network.private_zone_id
  name    = local.network.admin_hostname
  type    = "A"
  alias {
    name                   = aws_lb.admin.dns_name
    zone_id                = aws_lb.admin.zone_id
    evaluate_target_health = true
  }
}
