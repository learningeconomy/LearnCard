output "secret_arns" { value = { for id, secret in aws_secretsmanager_secret.account : id => secret.arn } }
output "function_names" { value = { for tier, fn in aws_lambda_function.runner : tier => fn.function_name } }
output "alarm_topic_arn" { value = aws_sns_topic.alarms.arn }
