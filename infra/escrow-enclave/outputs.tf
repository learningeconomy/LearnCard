output "nlb_dns_name" {
  description = "DNS name of the internal Network Load Balancer fronting the escrow enclave-host ASG. lca-api's remote enclave client should target https://<nlb_dns_name>:8443."
  value       = aws_lb.enclave_host.dns_name
}

output "asg_name" {
  description = "Name of the enclave-host Auto Scaling Group."
  value       = aws_autoscaling_group.enclave_host.name
}

output "security_group_id" {
  description = "ID of the security group attached to enclave-host instances (ingress: 8443 from lca_api_security_group_id, 8444 from the VPC CIDR)."
  value       = aws_security_group.enclave_host.id
}

output "launch_template_id" {
  description = "ID of the enclave-host launch template (Nitro-enabled, AL2023, IMDSv2-only)."
  value       = aws_launch_template.enclave_host.id
}

output "kms_key_arn" {
  description = "ARN of the escrow CMK (kms.tf). Its key policy pins kms:Decrypt to per-measurement-tuple RecipientAttestation PCR0/1/2 conditions — never grant any other principal Decrypt/Encrypt on this key outside of this module's key policy."
  value       = aws_kms_key.escrow.arn
}

output "kms_key_alias" {
  description = "Alias of the escrow CMK, e.g. alias/learncard-escrow-enclave-<environment>."
  value       = aws_kms_alias.escrow.name
}

output "enclave_host_role_arn" {
  description = "ARN of the enclave-host EC2 instance role. This is the only non-admin principal named in the escrow CMK's Decrypt/Encrypt statements."
  value       = aws_iam_role.enclave_host.arn
}

output "monitor_role_arn" {
  description = "ARN of the escrow-ledger-monitor Lambda execution role (read-only on both ledger tables + the records stream, read on the audit bucket; no escrow-CMK access)."
  value       = aws_iam_role.ledger_monitor.arn
}

output "audit_bucket" {
  description = "Name of the S3 Object Lock (COMPLIANCE mode) audit-log bucket."
  value       = aws_s3_bucket.audit.id
}

output "artifacts_bucket" {
  description = "Name of the non-locked S3 bucket that holds built .eif Enclave Image Files. Point eif_s3_uri at an object in this bucket."
  value       = aws_s3_bucket.artifacts.id
}

output "ledger_records_table" {
  description = "Name of the escrow-ledger-records DynamoDB table (append-only signed ledger records; iam.tf explicitly denies UpdateItem/DeleteItem on this table for the enclave-host role)."
  value       = aws_dynamodb_table.records.name
}

output "ledger_heads_table" {
  description = "Name of the escrow-ledger-heads DynamoDB table (mutable per-chain head pointer)."
  value       = aws_dynamodb_table.heads.name
}

output "ledger_records_stream_arn" {
  description = "Stream ARN (NEW_AND_OLD_IMAGES) of the escrow-ledger-records table, consumed by the escrow-ledger-monitor Lambda (P7.1). The monitor MUST alarm on any MODIFY/REMOVE event on this stream — see README's 'Records overwrite detection' section."
  value       = aws_dynamodb_table.records.stream_arn
}
