# Human-applied Phase 4 addition. Existing deploy-services already grants staging
# ECR push, production ECR describe/pull, ECS updates, autoscaling, RDS snapshots,
# CodeBuild start/batch and SSM discovery. The state bucket allowlists deploy.
data "aws_iam_policy_document" "deploy_pipeline" {
  statement {
    sid       = "CompatibilityMetadataAndDeploymentJournal"
    actions   = ["s3:GetObject", "s3:PutObject"]
    resources = [for file in ["metadata.json", "deployment.json"] : "${aws_s3_bucket.state.arn}/keycloak/${var.environment}/compat/${file}"]
  }
  statement {
    sid       = "ReadRealmRunnerLogStreams"
    actions   = ["logs:GetLogEvents", "logs:DescribeLogStreams", "logs:FilterLogEvents"]
    resources = ["arn:${local.partition}:logs:${local.regional_arn}:log-group:/aws/codebuild/${local.name}-realm:*"]
  }
}

resource "aws_iam_policy" "deploy_pipeline" {
  name   = "${local.name}-deploy-pipeline"
  policy = data.aws_iam_policy_document.deploy_pipeline.json
}

resource "aws_iam_role_policy_attachment" "deploy_pipeline" {
  role       = aws_iam_role.github["deploy"].name
  policy_arn = aws_iam_policy.deploy_pipeline.arn
}
