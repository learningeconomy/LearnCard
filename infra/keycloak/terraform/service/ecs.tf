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
  name                 = "${local.name}-execution"
  assume_role_policy   = local.ecs_assume_role_policy
  permissions_boundary = local.workload_boundary
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
    Statement = [
      {
        Effect   = "Allow"
        Action   = "secretsmanager:GetSecretValue"
        Resource = [local.db_master_secret_arn, var.bootstrap_admin_password_secret_arn]
      },
      {
        Effect   = "Allow"
        Action   = "kms:Decrypt"
        Resource = "arn:${local.partition}:kms:${var.aws_region}:${local.account_id}:key/*"
        Condition = {
          StringEquals               = { "kms:ViaService" = "secretsmanager.${var.aws_region}.amazonaws.com" }
          "ForAnyValue:StringEquals" = { "kms:ResourceAliases" = "alias/aws/secretsmanager" }
        }
      }
    ]
  })
}

resource "aws_iam_role" "task" {
  name                 = "${local.name}-task"
  assume_role_policy   = local.ecs_assume_role_policy
  permissions_boundary = local.workload_boundary
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
    cpu_architecture        = "ARM64"
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
      KC_DB_URL      = "jdbc:postgresql://${aws_rds_cluster.keycloak.endpoint}:5432/keycloak?sslmode=require"
      KC_DB_USERNAME = "keycloak"
      KC_HOSTNAME    = "https://${local.network.auth_hostname}"
      # TODO(keycloak-aws-platform.md PD-4, Phase 3 spike): verify forwarded-port
      # hostname v2 behavior; fallback is an SSM-only t4g.nano bastion, not public admin.
      KC_HOSTNAME_ADMIN           = "https://${local.network.admin_hostname}:${var.admin_forward_port}"
      KC_PROXY_HEADERS            = "xforwarded"
      KC_HTTP_ENABLED             = "true"
      KC_HTTP_MAX_QUEUED_REQUESTS = "1000"
      KC_BOOTSTRAP_ADMIN_USERNAME = var.bootstrap_admin_username
      KC_LOG_CONSOLE_OUTPUT       = "json"
      KC_CACHE                    = "ispn"
      KC_CACHE_STACK              = "jdbc-ping"
      KC_DB_POOL_INITIAL_SIZE     = tostring(var.db_pool_size)
      KC_DB_POOL_MIN_SIZE         = tostring(var.db_pool_size)
      KC_DB_POOL_MAX_SIZE         = tostring(var.db_pool_size)
      KC_HTTP_MANAGEMENT_SCHEME   = "http"
    } : { name = name, value = value }]
    secrets = [
      # RDS-managed secret is JSON ({"username","password"}); select the password key.
      { name = "KC_DB_PASSWORD", valueFrom = "${local.db_master_secret_arn}:password::" },
      { name = "KC_BOOTSTRAP_ADMIN_PASSWORD", valueFrom = var.bootstrap_admin_password_secret_arn }
    ]
    # The upstream 26.7.4 health guide prescribes Bash /dev/tcp: no curl is
    # present in the UBI micro runtime. Liveness must not depend on database health.
    healthCheck = {
      command     = ["CMD-SHELL", "/bin/bash -ec 'exec 3<>/dev/tcp/127.0.0.1/9000; printf \"GET /health/live HTTP/1.0\\r\\n\\r\\n\" >&3; read -r -t 5 status <&3; [[ \"$status\" == *\" 200 \"* ]]'"]
      interval    = 30
      timeout     = 10
      retries     = 3
      startPeriod = 120
    }
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
  name                               = local.name
  cluster                            = aws_ecs_cluster.keycloak.id
  task_definition                    = aws_ecs_task_definition.keycloak.arn
  launch_type                        = "FARGATE"
  desired_count                      = var.desired_count
  health_check_grace_period_seconds  = 120
  enable_execute_command             = false
  wait_for_steady_state              = true
  deployment_minimum_healthy_percent = 100
  deployment_maximum_percent         = 200
  availability_zone_rebalancing      = "ENABLED"
  propagate_tags                     = "SERVICE"

  network_configuration {
    subnets          = local.private_subnet_ids
    security_groups  = [aws_security_group.keycloak["tasks"].id]
    assign_public_ip = false
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.keycloak["public"].arn
    container_name   = "keycloak"
    container_port   = 8080
  }
  load_balancer {
    target_group_arn = aws_lb_target_group.keycloak["admin"].arn
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
    aws_lb_listener_rule.deny_admin,
    aws_lb_listener_rule.public,
    aws_vpc_security_group_ingress_rule.private,
    aws_vpc_security_group_egress_rule.private,
    aws_vpc_security_group_egress_rule.https,
    aws_iam_role_policy_attachment.execution,
    aws_iam_role_policy.secrets,
    aws_rds_cluster_instance.keycloak,
    aws_secretsmanager_secret_rotation.database
  ]

  lifecycle {
    # Preserve autoscaling decisions; use its min/max bounds for deliberate changes.
    ignore_changes = [desired_count]
    precondition {
      condition     = var.environment != "production" || var.desired_count >= 2
      error_message = "Production requires at least two Keycloak tasks across the private subnet AZs."
    }
  }
}

resource "aws_appautoscaling_target" "keycloak" {
  min_capacity       = var.min_task_count
  max_capacity       = var.max_task_count
  resource_id        = "service/${aws_ecs_cluster.keycloak.name}/${aws_ecs_service.keycloak.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"
}

resource "aws_appautoscaling_policy" "cpu" {
  name               = "${local.name}-cpu"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.keycloak.resource_id
  scalable_dimension = aws_appautoscaling_target.keycloak.scalable_dimension
  service_namespace  = aws_appautoscaling_target.keycloak.service_namespace
  target_tracking_scaling_policy_configuration {
    target_value       = var.cpu_target_percent
    scale_in_cooldown  = 300
    scale_out_cooldown = 60
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
  }
}
