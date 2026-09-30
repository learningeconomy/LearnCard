data "aws_vpc" "selected" {
  id = var.vpc_id
}

data "aws_subnet" "private" {
  for_each = toset(var.private_subnet_ids)
  id       = each.value
}

data "aws_subnet" "public" {
  for_each = toset(var.public_subnet_ids)
  id       = each.value
}

resource "aws_security_group" "alb" {
  name        = "${local.name}-alb"
  description = "Public HTTPS and HTTP redirect for Keycloak"
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    description = "HTTP redirect"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }
  # Outbound target traffic is scoped to the tasks SG below.
}

resource "aws_security_group" "tasks" {
  name        = "${local.name}-tasks"
  description = "Keycloak HTTP and management health checks from ALB only"
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    description     = "Application requests from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  ingress {
    # Readiness is on the management interface, not application port 8080.
    # This is health-check-only reachability: there is no ALB listener on 9000.
    description     = "Management readiness probes from ALB"
    from_port       = 9000
    to_port         = 9000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }
  egress {
    description = "Database, AWS APIs and external identity providers through private subnet egress"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# Infinispan clustering: jdbc-ping uses PostgreSQL for member *discovery* only.
# JGroups still carries cache traffic task-to-task over TCP 7800 and runs failure
# detection (FD_SOCK) on TCP 57800. Both are private, task-SG-to-task-SG only.
# https://www.keycloak.org/server/caching#network-ports
resource "aws_vpc_security_group_ingress_rule" "tasks_jgroups" {
  for_each                     = toset(["7800", "57800"])
  security_group_id            = aws_security_group.tasks.id
  referenced_security_group_id = aws_security_group.tasks.id
  description                  = "JGroups cluster transport between Keycloak tasks on ${each.value}"
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.value)
  to_port                      = tonumber(each.value)
}

resource "aws_vpc_security_group_egress_rule" "alb_tasks" {
  for_each                     = toset(["8080", "9000"])
  security_group_id            = aws_security_group.alb.id
  referenced_security_group_id = aws_security_group.tasks.id
  description                  = "Keycloak target traffic on ${each.value}"
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.value)
  to_port                      = tonumber(each.value)
}

resource "aws_security_group" "db" {
  name        = "${local.name}-db"
  description = "PostgreSQL from Keycloak tasks only"
  vpc_id      = data.aws_vpc.selected.id

  ingress {
    description     = "PostgreSQL from tasks"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.tasks.id]
  }
}
