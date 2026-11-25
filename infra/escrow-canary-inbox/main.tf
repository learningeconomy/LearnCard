# Account-scoped canary inbox. Only ONE SES receipt rule set can be active per
# account and region, and staging and production canaries share this account,
# so the zone, identity and the single active rule set live here, in their own
# state. Each environment stack (infra/escrow-canary) adds only its own rules.
# This stack has no rules and no buckets.

resource "aws_route53_zone" "inbox" {
  name    = var.inbox_domain
  comment = "Escrow canary inbox (receive only)"
}
resource "aws_route53_record" "mx" {
  zone_id = aws_route53_zone.inbox.zone_id
  name    = var.inbox_domain
  type    = "MX"
  ttl     = 300
  records = ["10 inbound-smtp.${var.aws_region}.amazonaws.com"]
}
# Nobody sends from this domain.
resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.inbox.zone_id
  name    = var.inbox_domain
  type    = "TXT"
  ttl     = 300
  records = ["v=spf1 -all"]
}
resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.inbox.zone_id
  name    = "_dmarc.${var.inbox_domain}"
  type    = "TXT"
  ttl     = 300
  records = ["v=DMARC1; p=reject; adkim=s; aspf=s"]
}

resource "aws_ses_domain_identity" "inbox" {
  domain = var.inbox_domain
}
resource "aws_route53_record" "ses_verification" {
  zone_id = aws_route53_zone.inbox.zone_id
  name    = "_amazonses.${var.inbox_domain}"
  type    = "TXT"
  ttl     = 300
  records = [aws_ses_domain_identity.inbox.verification_token]
}
resource "aws_ses_domain_identity_verification" "inbox" {
  count      = var.delegation_complete ? 1 : 0
  domain     = aws_ses_domain_identity.inbox.id
  depends_on = [aws_route53_record.ses_verification]
}

resource "aws_ses_receipt_rule_set" "inbox" {
  rule_set_name = var.rule_set_name
  lifecycle {
    prevent_destroy = true
  }
}
resource "aws_ses_active_receipt_rule_set" "inbox" {
  rule_set_name = aws_ses_receipt_rule_set.inbox.rule_set_name
  lifecycle {
    prevent_destroy = true
  }
}
