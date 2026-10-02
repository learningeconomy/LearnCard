resource "aws_route53_record" "keycloak" {
  for_each = toset([var.hostname, var.admin_hostname])
  zone_id  = var.route53_zone_id
  name     = each.value
  type     = "A"
  alias {
    name                   = aws_lb.keycloak.dns_name
    zone_id                = aws_lb.keycloak.zone_id
    evaluate_target_health = true
  }
}
