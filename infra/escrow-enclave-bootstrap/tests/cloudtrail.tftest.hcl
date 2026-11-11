# Every AWS operation is mocked; assertions inspect real jsonencode policies.
mock_provider "aws" {
  mock_data "aws_caller_identity" { defaults = { account_id = "123456789012" } }
  mock_data "aws_partition" { defaults = { partition = "aws" } }
  mock_data "aws_iam_policy_document" { defaults = { json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}" } }
  mock_resource "aws_iam_role" { defaults = { arn = "arn:aws:iam::123456789012:role/escrow-kms-admin" } }
  mock_resource "aws_sns_topic" { defaults = { arn = "arn:aws:sns:us-east-1:123456789012:alarms" } }
  mock_resource "aws_kms_key" { defaults = { arn = "arn:aws:kms:us-east-1:123456789012:key/00000000-1111-2222-3333-444444444444" } }
}
variables {
  environment           = "staging"
  kms_admin_users       = ["test-operator"]
  authority_generations = ["g1", "g2"]
}
run "locked_account_trail" {
  command = apply
  assert {
    condition = aws_cloudtrail.escrow.is_multi_region_trail && aws_cloudtrail.escrow.include_global_service_events && aws_cloudtrail.escrow.enable_log_file_validation && aws_cloudtrail.escrow.enable_logging && length(aws_cloudtrail.escrow.advanced_event_selector) == 2 && anytrue([
      for selector in aws_cloudtrail.escrow.advanced_event_selector : length(selector.field_selector) == 1 && anytrue([for field in selector.field_selector : field.field == "eventCategory" && toset(field.equals) == toset(["Management"])])
    ])
    error_message = "Trail must actively log all management events, globally, with validation and no KMS exclusions."
  }
  assert {
    condition = anytrue([for selector in aws_cloudtrail.escrow.advanced_event_selector :
      alltrue([for pair in [{ field = "resources.ARN", values = local.trail_authority_arns }, { field = "resources.type", values = ["AWS::DynamoDB::Table"] }, { field = "readOnly", values = ["false"] }, { field = "eventCategory", values = ["Data"] }] :
        anytrue([for field in selector.field_selector : field.field == pair.field && toset(field.equals) == toset(pair.values)])
      ]) && !anytrue([for field in selector.field_selector : field.field == "eventName"])
    ]) && contains(local.trail_authority_arns, "arn:aws:dynamodb:us-east-1:123456789012:table/escrow-enclave-staging-authority-g1")
    error_message = "Exact authority table ARNs must select all write data events, including batch/transaction/PartiQL, without a brittle API allowlist."
  }
  assert {
    condition     = aws_s3_bucket.cloudtrail.object_lock_enabled && aws_s3_bucket_versioning.cloudtrail.versioning_configuration[0].status == "Enabled" && aws_s3_bucket_object_lock_configuration.cloudtrail.rule[0].default_retention[0].mode == "COMPLIANCE" && aws_s3_bucket_object_lock_configuration.cloudtrail.rule[0].default_retention[0].days == 365 && aws_s3_bucket_public_access_block.cloudtrail.block_public_acls && aws_s3_bucket_public_access_block.cloudtrail.block_public_policy && aws_s3_bucket_public_access_block.cloudtrail.ignore_public_acls && aws_s3_bucket_public_access_block.cloudtrail.restrict_public_buckets
    error_message = "Logs must be versioned, public-blocked, COMPLIANCE locked for 365 days by default."
  }
  assert {
    condition     = alltrue([for s in jsondecode(aws_s3_bucket_policy.cloudtrail.policy).Statement : s.Effect != "Allow" || (s.Principal.Service == "cloudtrail.amazonaws.com" && s.Condition.StringEquals["aws:SourceArn"] == local.trail_arn)]) && alltrue([for sid in ["DenyOtherWriters", "DenyDeletes", "DenyInsecureTransport"] : anytrue([for s in jsondecode(aws_s3_bucket_policy.cloudtrail.policy).Statement : s.Sid == sid && s.Effect == "Deny"])])
    error_message = "Only this trail may deliver; deletes and insecure transport must be denied."
  }
  assert {
    condition     = aws_cloudtrail.escrow.kms_key_id == aws_kms_key.cloudtrail.arn && alltrue([for s in jsondecode(aws_kms_key.cloudtrail.policy).Statement : !contains(s.Action, "kms:Decrypt") || try(s.Principal.AWS, "") == aws_iam_role.kms_admin.arn]) && !strcontains(aws_kms_key.cloudtrail.policy, "kms:*")
    error_message = "Dedicated key must not delegate arbitrary crypto privileges; only the MFA admin can decrypt."
  }
}

run "production_rejects_short_retention" {
  command = plan
  variables {
    environment               = "production"
    cloudtrail_retention_days = 30
  }
  expect_failures = [var.cloudtrail_retention_days]
}

run "staging_allows_short_retention" {
  command = plan
  variables {
    environment               = "staging"
    cloudtrail_retention_days = 30
  }
  assert {
    condition     = var.cloudtrail_retention_days == 30
    error_message = "Staging may use a shorter retention."
  }
}
