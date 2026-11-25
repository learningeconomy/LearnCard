locals {
  email_enabled                = var.enable_enrollment_authority && var.enable_enclave_email
  email_domain                 = coalesce(var.sending_domain, "disabled.invalid")
  email_from                   = "recovery@${local.email_domain}"
  email_identity_arn           = "arn:${data.aws_partition.current.partition}:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:identity/${local.email_domain}"
  email_configuration_set_name = "${local.name_prefix}-recovery"
  email_configuration_set_arn  = "arn:${data.aws_partition.current.partition}:ses:${var.aws_region}:${data.aws_caller_identity.current.account_id}:configuration-set/${local.email_configuration_set_name}"
  email_sender_policy = {
    Version = "2012-10-17"
    Statement = [{ Effect = "Allow", Action = ["ses:SendEmail"], Resource = [local.email_identity_arn, local.email_configuration_set_arn],
    Condition = { StringEquals = { "ses:FromAddress" = local.email_from } } }]
  }
}
resource "aws_iam_user" "email_sender" {
  count         = local.email_enabled ? 1 : 0
  name          = local.email_sender_name
  force_destroy = false
  tags          = local.common_tags
}
resource "aws_iam_user_policy" "email_sender" {
  count  = local.email_enabled ? 1 : 0
  name   = "recovery-email-only"
  user   = aws_iam_user.email_sender[0].name
  policy = jsonencode(local.email_sender_policy)
}
resource "aws_ses_domain_identity" "enclave" {
  count  = local.email_enabled ? 1 : 0
  domain = var.sending_domain
}
resource "aws_ses_domain_dkim" "enclave" {
  count  = local.email_enabled ? 1 : 0
  domain = aws_ses_domain_identity.enclave[0].domain
}
resource "aws_ses_domain_mail_from" "enclave" {
  count                  = local.email_enabled ? 1 : 0
  domain                 = aws_ses_domain_identity.enclave[0].domain
  mail_from_domain       = "bounce.${var.sending_domain}"
  behavior_on_mx_failure = "RejectMessage"
}
resource "aws_ses_configuration_set" "enclave" {
  count = local.email_enabled ? 1 : 0
  name  = local.email_configuration_set_name
  delivery_options { tls_policy = "Require" }
}
resource "aws_ses_event_destination" "enclave" {
  count                  = local.email_enabled ? 1 : 0
  name                   = "bounce-and-complaint"
  configuration_set_name = aws_ses_configuration_set.enclave[0].name
  enabled                = true
  matching_types         = ["bounce", "complaint"]
  sns_destination { topic_arn = aws_sns_topic.monitor.arn }
  depends_on = [aws_sns_topic_policy.monitor]
}
resource "aws_route53_zone" "sending" {
  count = local.email_enabled && var.create_sending_zone ? 1 : 0
  name  = var.sending_domain
  tags  = local.common_tags
}
locals {
  # Stable keys let Route53 plan without knowing generated DKIM token values.
  email_dns_records = local.email_enabled ? merge({
    verification  = { name = "_amazonses.${var.sending_domain}", type = "TXT", records = [aws_ses_domain_identity.enclave[0].verification_token] }
    mail_from_mx  = { name = "bounce.${var.sending_domain}", type = "MX", records = ["10 feedback-smtp.${var.aws_region}.amazonses.com"] }
    mail_from_spf = { name = "bounce.${var.sending_domain}", type = "TXT", records = ["v=spf1 include:amazonses.com -all"] }
    # Monitor-only by default; production can promote after alignment review.
    dmarc = { name = "_dmarc.${var.sending_domain}", type = "TXT", records = [join("; ", compact([
      "v=DMARC1", "p=${var.email_dmarc_policy}", var.email_dmarc_report_address == null ? "" : "rua=mailto:${var.email_dmarc_report_address}"
    ]))] }
    }, { for i in range(3) : "dkim_${i}" => {
      name = "${aws_ses_domain_dkim.enclave[0].dkim_tokens[i]}._domainkey.${var.sending_domain}", type = "CNAME", records = ["${aws_ses_domain_dkim.enclave[0].dkim_tokens[i]}.dkim.amazonses.com"]
    }
  }) : {}
}
resource "aws_route53_record" "sending" {
  for_each = local.email_enabled && var.create_sending_zone ? local.email_dns_records : {}
  zone_id  = aws_route53_zone.sending[0].zone_id
  name     = each.value.name
  type     = each.value.type
  ttl      = 300
  records  = each.value.records
}
output "sending_zone_name_servers" {
  value       = try(aws_route53_zone.sending[0].name_servers, null)
  description = "Delegate sending_domain to these NS in the parent account; the parent zone and its DMARC are not managed here."
}
output "sending_dns_records" {
  value       = local.email_enabled ? local.email_dns_records : null
  description = "Publish these child-domain records yourself when create_sending_zone=false."
}
