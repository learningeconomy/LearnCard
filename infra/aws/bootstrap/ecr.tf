resource "aws_ecr_repository" "keycloak" {
  name                 = "learncard/keycloak"
  image_tag_mutability = "IMMUTABLE"
  image_scanning_configuration {
    scan_on_push = true
  }
}

resource "aws_ecr_lifecycle_policy" "keycloak" {
  repository = aws_ecr_repository.keycloak.name
  # No tagged-image expiry: production can run an old digest long after newer ones are
  # replicated, and a count-based rule would delete it. Add retention only with the
  # deployed and rollback digests explicitly protected.
  policy = jsonencode({ rules = [
    {
      rulePriority = 1
      description  = "Expire untagged images after seven days"
      selection    = { tagStatus = "untagged", countType = "sinceImagePushed", countUnit = "days", countNumber = 7 }
      action       = { type = "expire" }
    }
  ] })
}

resource "aws_ecr_replication_configuration" "production" {
  count = var.environment == "staging" ? 1 : 0
  replication_configuration {
    rule {
      destination {
        region      = var.replication_destination_region
        registry_id = var.replication_destination_account_id
      }
      repository_filter {
        filter      = aws_ecr_repository.keycloak.name
        filter_type = "PREFIX_MATCH"
      }
    }
  }
}

data "aws_iam_policy_document" "replication" {
  count = var.environment == "production" ? 1 : 0
  statement {
    actions   = ["ecr:ReplicateImage", "ecr:CreateRepository"]
    resources = [aws_ecr_repository.keycloak.arn]
    principals {
      type        = "AWS"
      identifiers = ["arn:${local.partition}:iam::${var.replication_source_account_id}:root"]
    }
  }
}

resource "aws_ecr_registry_policy" "replication" {
  count  = var.environment == "production" ? 1 : 0
  policy = data.aws_iam_policy_document.replication[0].json
}
