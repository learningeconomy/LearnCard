locals {
  bootstrap_outputs = {
    state_bucket_name     = aws_s3_bucket.state.bucket
    plan_role_arn         = aws_iam_role.github["plan"].arn
    deploy_role_arn       = aws_iam_role.github["deploy"].arn
    ecr_repository_url    = aws_ecr_repository.keycloak.repository_url
    workload_boundary_arn = aws_iam_policy.workload_boundary.arn
  }
}

resource "aws_ssm_parameter" "bootstrap" {
  for_each = local.bootstrap_outputs
  name     = "${local.ssm_prefix}/bootstrap/${each.key}"
  type     = "String"
  value    = each.value
}

output "state_bucket_name" {
  description = "Bucket for S3-native locked Terraform state"
  value       = local.bootstrap_outputs.state_bucket_name
}
output "plan_role_arn" {
  description = "GitHub PR/main read-only role"
  value       = local.bootstrap_outputs.plan_role_arn
}
output "deploy_role_arn" {
  description = "GitHub environment deployment role"
  value       = local.bootstrap_outputs.deploy_role_arn
}
output "ecr_repository_url" {
  description = "Private immutable Keycloak image repository"
  value       = local.bootstrap_outputs.ecr_repository_url
}
output "workload_boundary_arn" {
  description = "Mandatory boundary for roles created by downstream roots"
  value       = local.bootstrap_outputs.workload_boundary_arn
}
