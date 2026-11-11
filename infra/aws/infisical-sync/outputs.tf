output "infisical_sync_role_arns" {
  description = "Role ARN per service stage that Infisical assumes (project ID as ExternalId); one AWS connection per stage"
  value       = { for stage, role in aws_iam_role.infisical_sync : stage => role.arn }
}
