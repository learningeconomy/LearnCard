resource "aws_cloudwatch_log_group" "enclave_host" {
  name              = "/learncard/escrow-enclave-host/${var.environment}"
  retention_in_days = 365
  kms_key_id        = var.cloudwatch_log_kms_key_arn

  tags = merge(local.common_tags, { Name = "/learncard/escrow-enclave-host/${var.environment}" })
}
