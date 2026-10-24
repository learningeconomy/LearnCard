output "state_bucket_name" {
  description = "Bucket for the infisical-sync root's state (-backend-config bucket=)"
  value       = aws_s3_bucket.state.id
}

output "state_kms_key_arn" {
  description = "KMS key for state objects (-backend-config kms_key_id=)"
  value       = aws_kms_key.state.arn
}
