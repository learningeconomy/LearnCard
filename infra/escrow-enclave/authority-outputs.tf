output "enrollment_authority_configuration" {
  description = "Public values to review and bake into the next EIF; never secret access keys. Null when disabled."
  value = var.enable_enrollment_authority ? {
    ESCROW_AUTHORITY_REGION                 = var.aws_region
    ESCROW_AUTHORITY_ACCOUNT_ID             = data.aws_caller_identity.current.account_id
    ESCROW_AUTHORITY_TABLE                  = local.authority_table_name
    ESCROW_AUTHORITY_WRITER_USER            = local.authority_writer_name
    ESCROW_AUTHORITY_TENANT                 = var.authority_tenant
    ESCROW_AUTHORITY_ENVIRONMENT            = var.environment
    ESCROW_AUTHORITY_GENERATION             = var.authority_generation
    ESCROW_AUTHORITY_CREDENTIAL_KMS_KEY_ARN = aws_kms_key.credentials[0].arn
  } : null
}
output "enclave_email_configuration" {
  value = local.email_enabled ? {
    ESCROW_EMAIL_REGION            = var.aws_region
    ESCROW_EMAIL_ACCOUNT_ID        = data.aws_caller_identity.current.account_id
    ESCROW_EMAIL_SENDER_USER       = local.email_sender_name
    ESCROW_EMAIL_FROM              = local.email_from
    ESCROW_EMAIL_IDENTITY          = var.sending_domain
    ESCROW_EMAIL_CONFIGURATION_SET = local.email_configuration_set_name
  } : null
}
output "credential_ciphertext_objects" {
  value = var.enable_enrollment_authority ? merge({
    authority_writer = "s3://${aws_s3_bucket.artifacts.bucket}/credentials/authority-writer/${var.authority_generation}"
  }, local.email_enabled ? { email_sender = "s3://${aws_s3_bucket.artifacts.bucket}/credentials/email-sender/${var.authority_generation}" } : {}) : null
}
output "global_governance_failure_topic_arn" {
  description = "Independent us-east-1 delivery-failure topic for cross-region deployments. Confirm the optional monitor_alarm_email subscription or attach security monitoring."
  value       = try(aws_sns_topic.authority_global_failures[0].arn, null)
}
