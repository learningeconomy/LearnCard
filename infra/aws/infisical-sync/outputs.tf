output "infisical_sync_role_arn" {
  description = "Role ARN Infisical assumes (with the project ID as ExternalId) to sync secrets"
  value       = aws_iam_role.infisical_sync.arn
}
