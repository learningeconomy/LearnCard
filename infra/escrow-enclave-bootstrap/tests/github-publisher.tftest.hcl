# All managed resources and account lookup overridden; real policy-document
# computation only. No AWS calls, ambient credentials, backend, plan/apply CLI.
override_resource { target = aws_s3_bucket.cloudtrail }
override_resource { target = aws_s3_bucket_versioning.cloudtrail }
override_resource { target = aws_s3_bucket_object_lock_configuration.cloudtrail }
override_resource { target = aws_s3_bucket_public_access_block.cloudtrail }
override_resource { target = aws_s3_bucket_ownership_controls.cloudtrail }
override_resource { target = aws_s3_bucket_server_side_encryption_configuration.cloudtrail }
override_resource { target = aws_s3_bucket_policy.cloudtrail }
override_resource {
  target = aws_kms_key.cloudtrail
  values = { arn = "arn:aws:kms:us-east-1:123456789012:key/00000000-1111-2222-3333-444444444444" }
}
override_resource { target = aws_cloudtrail.escrow }
provider "aws" {
  region                      = "us-east-1"
  access_key                  = "test"
  secret_key                  = "test"
  skip_credentials_validation = true
  skip_requesting_account_id  = true
  skip_region_validation      = true
  skip_metadata_api_check     = true
}

variables {
  authority_generations = ["test"]
  environment           = "staging"
  kms_admin_users       = ["test-operator"]
}

override_data {
  target = data.aws_caller_identity.current
  values = { account_id = "123456789012" }
}
override_resource {
  target = aws_s3_bucket.tfstate
}
override_resource {
  target = aws_s3_bucket_versioning.tfstate
}
override_resource {
  target = aws_s3_bucket_server_side_encryption_configuration.tfstate
}
override_resource {
  target = aws_s3_bucket_public_access_block.tfstate
}
override_resource {
  target = aws_s3_bucket_ownership_controls.tfstate
}
override_resource {
  target = aws_s3_bucket_policy.tfstate
}
override_resource {
  target = aws_iam_role.kms_admin
}
override_resource {
  target = aws_iam_role_policy_attachment.kms_admin_administrator
}
override_resource {
  target = aws_iam_user.kms_admin
}
override_resource {
  target = aws_iam_user_policy.kms_admin_user
}
override_resource {
  target = aws_sns_topic.alarms
  values = { arn = "arn:aws:sns:us-east-1:123456789012:test-alarms" }
}
override_resource {
  target = aws_sns_topic_policy.alarms
}
override_resource {
  target = aws_sns_topic_subscription.alarm_email
}
override_resource {
  target = aws_iam_openid_connect_provider.github_publisher
}
override_resource {
  target = aws_iam_role.github_publisher
  values = { arn = "arn:aws:iam::123456789012:role/escrow-enclave-production-github-publisher" }
}
override_resource {
  target = aws_iam_role_policy.github_publisher
}

run "disabled_staging_creates_no_publisher_resources" {
  command = plan

  assert {
    condition = (
      length(aws_iam_openid_connect_provider.github_publisher) == 0 &&
      length(aws_iam_role.github_publisher) == 0 &&
      length(aws_iam_role_policy.github_publisher) == 0 &&
      length(data.aws_iam_policy_document.github_publisher_trust) == 0 &&
      length(data.aws_iam_policy_document.github_publisher) == 0 &&
      output.github_publisher_role_arn == null
    )
    error_message = "Default staging must have no publisher resources, policy lookups or role output."
  }
}

run "enabled_production_has_exact_trust_and_least_privilege" {
  command = plan

  variables {
    environment                   = "production"
    enable_github_publisher       = true
    publisher_storage_kms_key_arn = "arn:aws:kms:us-east-1:123456789012:key/00000000-0000-0000-0000-000000000001"
  }

  assert {
    condition = jsondecode(aws_iam_role.github_publisher[0].assume_role_policy).Statement == jsondecode(jsonencode([{
      Effect    = "Allow"
      Action    = "sts:AssumeRoleWithWebIdentity"
      Principal = { Federated = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com" }
      Condition = { StringEquals = {
        "token.actions.githubusercontent.com:aud" = "sts.amazonaws.com"
        "token.actions.githubusercontent.com:sub" = "repo:learningeconomy/LearnCard:environment:escrow-production-publish"
      } }
    }]))
    error_message = "Trust must admit only the publisher environment, never the build's escrow-production subject."
  }
  assert {
    condition = anytrue([for s in jsondecode(data.aws_iam_policy_document.github_publisher[0].json).Statement :
      s.Effect == "Deny" && s.Resource == "*" &&
      toset(flatten([s.Action])) == toset(["iam:*", "sts:AssumeRole", "sts:AssumeRoleWithWebIdentity", "sts:AssumeRoleWithSAML"])
    ])
    error_message = "Publisher must explicitly deny self-policy changes, IAM administration and role chaining."
  }
  assert {
    condition     = aws_iam_role.github_publisher[0].max_session_duration == 3600 && length(aws_iam_openid_connect_provider.github_publisher) == 1 && aws_iam_openid_connect_provider.github_publisher[0].url == "https://token.actions.githubusercontent.com" && aws_iam_openid_connect_provider.github_publisher[0].client_id_list == toset(["sts.amazonaws.com"])
    error_message = "Create only GitHub's STS provider and cap sessions at one hour."
  }
  assert {
    condition = toset(flatten([
      for s in jsondecode(data.aws_iam_policy_document.github_publisher[0].json).Statement : s.Action if s.Effect == "Allow"
    ])) == toset(["s3:PutObject", "s3:GetObject", "kms:GenerateDataKey", "kms:Decrypt"])
    error_message = "Only upload/readback actions are allowed: no delete, list, IAM, authority, monitor or key administration."
  }
  assert {
    condition = alltrue([
      for s in jsondecode(data.aws_iam_policy_document.github_publisher[0].json).Statement :
      s.Resource == "arn:aws:s3:::learncard-escrow-enclave-production-123456789012-artifacts/eif/*"
      if startswith(flatten([s.Action])[0], "s3:")
    ])
    error_message = "Every S3 statement must be restricted to the EIF prefix in this account's production bucket."
  }
  assert {
    condition = alltrue([
      for s in jsondecode(data.aws_iam_policy_document.github_publisher[0].json).Statement :
      (s.Effect == "Allow" ? try(s.Condition.StringEquals["s3:if-none-match"], "") == "*" : try(s.Condition.StringNotEquals["s3:if-none-match"], "") == "*")
      if contains(flatten([s.Action]), "s3:PutObject")
    ]) && length([for s in jsondecode(data.aws_iam_policy_document.github_publisher[0].json).Statement : s if s.Sid == "DenyNonCreateEifWrites" && s.Effect == "Deny"]) == 1
    error_message = "IAM must both require the exact conditional-create header and deny missing/nonmatching headers."
  }
  assert {
    condition = alltrue([
      for s in jsondecode(data.aws_iam_policy_document.github_publisher[0].json).Statement :
      s.Resource == var.publisher_storage_kms_key_arn &&
      s.Condition.StringEquals["kms:ViaService"] == "s3.us-east-1.amazonaws.com" &&
      toset(s.Condition.StringLike["kms:EncryptionContext:aws:s3:arn"]) == toset([
        "arn:aws:s3:::learncard-escrow-enclave-production-123456789012-artifacts",
        "arn:aws:s3:::learncard-escrow-enclave-production-123456789012-artifacts/eif/*"
      ]) if s.Sid == "ArtifactStorageEncryptionOnly"
    ])
    error_message = "KMS must name only the storage key, regional S3 and object/bucket-key contexts."
  }
}

run "existing_provider_and_sse_s3" {
  command = apply # Fully overridden; proves output wiring without AWS.

  variables {
    environment              = "production"
    enable_github_publisher  = true
    github_oidc_provider_arn = "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
  }
  assert {
    condition     = length(aws_iam_openid_connect_provider.github_publisher) == 0 && output.github_publisher_role_arn == aws_iam_role.github_publisher[0].arn
    error_message = "Reuse the existing provider and output the created role ARN."
  }
  assert {
    condition     = toset(flatten([for s in jsondecode(aws_iam_role_policy.github_publisher[0].policy).Statement : s.Action if s.Effect == "Allow"])) == toset(["s3:PutObject", "s3:GetObject"])
    error_message = "SSE-S3 must grant no KMS actions, deletes, or administrative access."
  }
}

run "cannot_enable_in_staging" {
  command = plan
  variables {
    enable_github_publisher = true
  }
  expect_failures = [var.enable_github_publisher]
}

run "reject_cross_account_provider" {
  command = plan
  variables {
    environment              = "production"
    enable_github_publisher  = true
    github_oidc_provider_arn = "arn:aws:iam::000000000000:oidc-provider/token.actions.githubusercontent.com"
  }
  expect_failures = [aws_iam_role.github_publisher]
}
