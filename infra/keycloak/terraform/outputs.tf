output "alb_dns_name" {
  description = "Public ALB DNS name"
  value       = aws_lb.keycloak.dns_name
}

output "keycloak_url" {
  description = "Public Keycloak base URL"
  value       = "https://${var.hostname}"
}

output "admin_url" {
  description = "Keycloak administration console URL"
  value       = "https://${var.admin_hostname}/admin/"
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
