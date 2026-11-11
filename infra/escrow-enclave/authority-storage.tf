locals {
  credential_object_policy = {
    Version = "2012-10-17"
    Statement = [
      { Sid = "DenyCredentialReplication", Effect = "Deny", Principal = "*", Action = ["s3:ReplicateObject", "s3:ReplicateDelete"], Resource = "${aws_s3_bucket.artifacts.arn}/credentials/*" },
      { Sid = "DenyCredentialWritesExceptProvisioner", Effect = "Deny", Principal = "*", Action = ["s3:PutObject"], Resource = "${aws_s3_bucket.artifacts.arn}/credentials/*",
      Condition = { ArnNotEquals = { "aws:PrincipalArn" = var.kms_admin_role_arn } } },
      { Sid = "DenyNonCreateOnlyCredentials", Effect = "Deny", Principal = "*", Action = ["s3:PutObject"], Resource = "${aws_s3_bucket.artifacts.arn}/credentials/*",
      Condition = { StringNotEqualsIfExists = { "s3:if-none-match" = "*" } } },
      { Sid = "DenyCredentialDeletion", Effect = "Deny", Principal = "*", Action = ["s3:DeleteObject", "s3:DeleteObjectVersion"], Resource = "${aws_s3_bucket.artifacts.arn}/credentials/*" },
    ]
  }
}
