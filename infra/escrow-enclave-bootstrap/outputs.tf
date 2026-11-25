output "tfstate_bucket" {
  value = aws_s3_bucket.tfstate.bucket
}

output "kms_admin_role_arn" {
  value = aws_iam_role.kms_admin.arn
}

output "kms_admin_user_arns" {
  value = { for name, user in aws_iam_user.kms_admin : name => user.arn }
}

output "alarm_topic_arn" {
  value = aws_sns_topic.alarms.arn
}
