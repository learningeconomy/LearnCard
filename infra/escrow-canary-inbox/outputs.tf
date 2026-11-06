output "name_servers" {
  description = "Delegate inbox_domain to these from the parent zone (operator step)."
  value       = aws_route53_zone.inbox.name_servers
}
output "rule_set_name" { value = aws_ses_active_receipt_rule_set.inbox.rule_set_name }
output "identity_verified" { value = var.delegation_complete }
