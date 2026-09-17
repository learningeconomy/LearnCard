data "aws_partition" "current" {}

locals {
  ecs_assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Action    = "sts:AssumeRole"
      Principal = { Service = "ecs-tasks.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role" "execution" {
  name               = "${local.name}-execution"
  assume_role_policy = local.ecs_assume_role_policy
}

resource "aws_iam_role_policy_attachment" "execution" {
  role       = aws_iam_role.execution.name
  policy_arn = "arn:${data.aws_partition.current.partition}:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role_policy" "secrets" {
  name = "keycloak-secret-injection"
  role = aws_iam_role.execution.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = "secretsmanager:GetSecretValue"
      Resource = [var.db_password_secret_arn, var.bootstrap_admin_password_secret_arn]
    }]
  })
}

resource "aws_iam_role" "task" {
  name               = "${local.name}-task"
  assume_role_policy = local.ecs_assume_role_policy
  # Keycloak itself needs no AWS API permissions.
}

resource "aws_ecs_cluster" "keycloak" {
  name = local.name
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

resource "aws_ecs_task_definition" "keycloak" {
  family                   = local.name
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = tostring(var.task_cpu)
  memory                   = tostring(var.task_memory)
  execution_role_arn       = aws_iam_role.execution.arn
  task_role_arn            = aws_iam_role.task.arn

  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "X86_64"
  }

  container_definitions = jsonencode([{
    name      = "keycloak"
    image     = var.keycloak_image
    essential = true
    portMappings = [
      { containerPort = 8080, hostPort = 8080, protocol = "tcp" },
      { containerPort = 9000, hostPort = 9000, protocol = "tcp" }
    ]
    environment = [for name, value in {
      KC_DB_URL                   = "jdbc:postgresql://${aws_rds_cluster.keycloak.endpoint}:5432/keycloak?sslmode=require"
      KC_DB_USERNAME              = "keycloak"
      KC_HOSTNAME                 = "https://${var.hostname}"
      KC_HOSTNAME_ADMIN           = "https://${var.admin_hostname}"
      KC_PROXY_HEADERS            = "xforwarded"
      KC_HTTP_ENABLED             = "true"
      KC_HTTP_MAX_QUEUED_REQUESTS = "1000"
      KC_BOOTSTRAP_ADMIN_USERNAME = var.bootstrap_admin_username
      KC_LOG_CONSOLE_OUTPUT       = "json"
      KC_CACHE                    = "ispn"
      KC_CACHE_STACK              = "jdbc-ping"
    } : { name = name, value = value }]
    secrets = [
      { name = "KC_DB_PASSWORD", valueFrom = var.db_password_secret_arn },
      { name = "KC_BOOTSTRAP_ADMIN_PASSWORD", valueFrom = var.bootstrap_admin_password_secret_arn }
    ]
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.keycloak.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "keycloak"
      }
    }
  }])
}

resource "aws_ecs_service" "keycloak" {
  name                              = local.name
  cluster                           = aws_ecs_cluster.keycloak.id
  task_definition                   = aws_ecs_task_definition.keycloak.arn
  launch_type                       = "FARGATE"
  desired_count                     = var.desired_count
  health_check_grace_period_seconds = 120
  enable_execute_command            = false
  wait_for_steady_state             = true

  network_configuration {
    subnets          = var.private_subnet_ids
    security_groups  = [aws_security_group.tasks.id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.keycloak.arn
    container_name   = "keycloak"
    container_port   = 8080
  }
  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  depends_on = [
    aws_lb_listener.https,
    aws_lb_listener_rule.admin,
    aws_lb_listener_rule.admin_extra_cidr,
    aws_lb_listener_rule.deny_admin_elsewhere,
    aws_lb_listener_rule.admin_assets,
    aws_lb_listener_rule.deny_admin_host,
    aws_vpc_security_group_egress_rule.alb_tasks,
    aws_iam_role_policy_attachment.execution,
    aws_iam_role_policy.secrets,
    aws_rds_cluster_instance.keycloak
  ]

  lifecycle {
    precondition {
      condition     = var.environment != "production" || var.desired_count >= 2
      error_message = "Production requires at least two Keycloak tasks. Resolve the clustering networking blocker before production rollout."
    }
  }
}
