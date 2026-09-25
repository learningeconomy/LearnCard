resource "aws_cloudwatch_log_group" "keycloak" {
  # Include environment to avoid collisions when both stacks share an account.
  name              = "/ecs/${local.name}"
  retention_in_days = var.log_retention_days
}
