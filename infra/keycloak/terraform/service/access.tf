locals {
  # Docker Hub's versioned multi-arch manifest includes linux/arm64. The ECS Exec
  # managed agent is injected by Fargate; this image need not ship an SSM agent.
  access_image = "docker.io/alpine/socat:1.8.1.3@sha256:24220ef2c80a2a421ea08e4624488e985330c421b6aa3329bae14b0933a1d403"
}

resource "aws_cloudwatch_log_group" "access" {
  name              = "/ecs/${local.name}-access"
  retention_in_days = var.log_retention_days
}

resource "aws_iam_role" "access_execution" {
  name                 = "${local.name}-access-execution"
  assume_role_policy   = local.ecs_assume_role_policy
  permissions_boundary = local.workload_boundary
}

resource "aws_iam_role_policy_attachment" "access_execution" {
  role       = aws_iam_role.access_execution.name
  policy_arn = "arn:${local.partition}:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "access" {
  name                 = "${local.name}-access-task"
  assume_role_policy   = local.ecs_assume_role_policy
  permissions_boundary = local.workload_boundary
}

data "aws_iam_policy_document" "access" {
  statement {
    actions   = ["ssmmessages:CreateControlChannel", "ssmmessages:CreateDataChannel", "ssmmessages:OpenControlChannel", "ssmmessages:OpenDataChannel"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "access" {
  name   = "${local.name}-access-messages"
  role   = aws_iam_role.access.id
  policy = data.aws_iam_policy_document.access.json
}

# No service: operators start this only for a bounded break-glass session, with
# run-task --enable-execute-command. The Keycloak service never enables ECS Exec.
resource "aws_ecs_task_definition" "access" {
  family                   = "${local.name}-access"
  requires_compatibilities = ["FARGATE"]
  network_mode             = "awsvpc"
  cpu                      = "256"
  memory                   = "512"
  task_role_arn            = aws_iam_role.access.arn
  execution_role_arn       = aws_iam_role.access_execution.arn
  runtime_platform {
    operating_system_family = "LINUX"
    cpu_architecture        = "ARM64"
  }
  container_definitions = jsonencode([{
    name      = "access"
    image     = local.access_image
    essential = true
    # Listen only on loopback: SSM forwards local 8443 to this relay; it connects
    # raw TCP to the private ALB so browser TLS/SNI remains end-to-end intact.
    entryPoint      = ["/bin/sh", "-ec"]
    command         = ["socat TCP4-LISTEN:8443,bind=127.0.0.1,reuseaddr,fork TCP4:${local.network.admin_hostname}:443 & relay=$!; (sleep 3600; kill \"$relay\") & watchdog=$!; trap 'kill \"$relay\" \"$watchdog\" 2>/dev/null || true' EXIT; wait \"$relay\""]
    linuxParameters = { initProcessEnabled = true }
    # ECS Exec requires its injected agent to write runtime state.
    readonlyRootFilesystem = false
    logConfiguration = {
      logDriver = "awslogs"
      options = {
        awslogs-group         = aws_cloudwatch_log_group.access.name
        awslogs-region        = var.aws_region
        awslogs-stream-prefix = "access"
      }
    }
  }])
}
