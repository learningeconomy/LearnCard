output "secret_arns" { value = { for id, secret in aws_secretsmanager_secret.account : id => secret.arn } }
output "function_names" { value = { for tier, fn in aws_lambda_function.runner : tier => fn.function_name } }
output "alarm_topic_arn" { value = aws_sns_topic.alarms.arn }
output "hold_secret_arns" { value = { for id, secret in aws_secretsmanager_secret.hold : id => secret.arn } }
output "tier3_function_names" { value = { for role, fn in aws_lambda_function.tier3 : role => fn.function_name } }
output "ledger_table_name" { value = local.tier3 ? aws_dynamodb_table.tier3[0].name : null }
output "inbox_bucket_name" { value = var.inbox_enabled ? aws_s3_bucket.inbox[0].bucket : null }
output "inbox_recipients" { value = [for rule in aws_ses_receipt_rule.inbox : one(rule.recipients)] }
output "ticket_topic_arn" { value = local.tier3 ? aws_sns_topic.tickets[0].arn : null }
