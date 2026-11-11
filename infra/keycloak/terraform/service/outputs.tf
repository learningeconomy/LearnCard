output "alarm_topic_arns" {
  description = "Confirm each email subscription manually before relying on alert delivery"
  value       = { for severity, topic in aws_sns_topic.alarms : severity => topic.arn }
}

output "waf_web_acl_arn" {
  description = "Regional WAF protecting the public ALB only"
  value       = aws_wafv2_web_acl.keycloak.arn
}

output "backup_vault_arns" {
  description = "Empty when backups are disabled; source and cross-region destination otherwise"
  value       = concat(aws_backup_vault.keycloak[*].arn, aws_backup_vault.copy[*].arn)
}

output "alb_dns_name" {
  description = "Public ALB DNS name"
  value       = aws_lb.keycloak.dns_name
}

output "keycloak_url" {
  description = "Public Keycloak base URL"
  value       = "https://${local.network.auth_hostname}"
}

output "admin_url" {
  description = "Keycloak administration console URL"
  value       = "https://${local.network.admin_hostname}:${var.admin_forward_port}/admin/"
}

output "admin_api_url" {
  description = "Private machine base URL on 443 for the realm provider, not the human forwarded console URL"
  value       = "https://${local.network.admin_hostname}"
}

output "db_cluster_endpoint" {
  description = "Private Aurora writer endpoint"
  value       = aws_rds_cluster.keycloak.endpoint
}

output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = aws_ecs_cluster.keycloak.name
}

output "ecs_service_name" {
  description = "ECS service name"
  value       = aws_ecs_service.keycloak.name
}

output "log_group_name" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.keycloak.name
}

output "realm_runner_project" {
  description = "Start builds with a reviewed sourceVersion commit SHA; no webhook or automatic trigger"
  value       = aws_codebuild_project.realm.name
}

output "access_task_definition_arn" {
  description = "On-demand access task; use run-task with ECS Exec, never a persistent service"
  value       = aws_ecs_task_definition.access.arn
}

output "access_security_group_id" {
  description = "Security group for break-glass run-task network configuration"
  value       = aws_security_group.keycloak["access"].id
}

output "private_subnet_ids" {
  description = "Private subnets for the on-demand access task"
  value       = local.private_subnet_ids
}

output "admin_hostname" {
  description = "Private admin hostname for a temporary local hosts entry"
  value       = local.network.admin_hostname
}

output "admin_forward_port" {
  description = "Local HTTPS port advertised by Keycloak's admin hostname setting"
  value       = var.admin_forward_port
}

locals {
  service_outputs = {
    ecs_cluster_name           = aws_ecs_cluster.keycloak.name
    ecs_service_name           = aws_ecs_service.keycloak.name
    realm_runner_project       = aws_codebuild_project.realm.name
    access_task_definition_arn = aws_ecs_task_definition.access.arn
    access_security_group_id   = aws_security_group.keycloak["access"].id
    admin_url                  = "https://${local.network.admin_hostname}:${var.admin_forward_port}/admin/"
    admin_api_url              = "https://${local.network.admin_hostname}"
    keycloak_url               = "https://${local.network.auth_hostname}"
    db_cluster_endpoint        = aws_rds_cluster.keycloak.endpoint
    log_group_name             = aws_cloudwatch_log_group.keycloak.name
  }
}

resource "aws_ssm_parameter" "service" {
  for_each = local.service_outputs
  name     = "${local.ssm_prefix}/service/${each.key}"
  type     = "String"
  value    = each.value
}
