data "aws_vpc" "selected" {
  id = local.network.vpc_id
}

data "aws_subnet" "private" {
  for_each = toset(local.private_subnet_ids)
  id       = each.value
}

data "aws_subnet" "public" {
  for_each = toset(local.public_subnet_ids)
  id       = each.value
}

resource "aws_security_group" "keycloak" {
  for_each    = toset(["alb", "admin-alb", "tasks", "db", "realm-runner", "access"])
  name        = "${local.name}-${each.value}"
  description = "Keycloak ${each.value}; rules managed separately"
  vpc_id      = data.aws_vpc.selected.id
}

resource "aws_vpc_security_group_ingress_rule" "public" {
  for_each          = toset(["80", "443"])
  security_group_id = aws_security_group.keycloak["alb"].id
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = tonumber(each.value)
  to_port           = tonumber(each.value)
}

locals {
  private_connections = {
    public_http  = { source = "alb", target = "tasks", port = 8080 }
    public_ready = { source = "alb", target = "tasks", port = 9000 }
    admin_http   = { source = "admin-alb", target = "tasks", port = 8080 }
    admin_ready  = { source = "admin-alb", target = "tasks", port = 9000 }
    runner_admin = { source = "realm-runner", target = "admin-alb", port = 443 }
    access_admin = { source = "access", target = "admin-alb", port = 443 }
    database     = { source = "tasks", target = "db", port = 5432 }
    # jdbc-ping discovers peers in PostgreSQL; cache traffic still uses JGroups.
    jgroups = { source = "tasks", target = "tasks", port = 7800 }
    failure = { source = "tasks", target = "tasks", port = 57800 }
  }
}

resource "aws_vpc_security_group_ingress_rule" "private" {
  for_each                     = local.private_connections
  security_group_id            = aws_security_group.keycloak[each.value.target].id
  referenced_security_group_id = aws_security_group.keycloak[each.value.source].id
  description                  = each.key
  ip_protocol                  = "tcp"
  from_port                    = each.value.port
  to_port                      = each.value.port
}

resource "aws_vpc_security_group_egress_rule" "private" {
  # Runner/access already have HTTPS egress for GitHub, AWS APIs and the admin ALB.
  for_each                     = { for key, connection in local.private_connections : key => connection if connection.port != 443 }
  security_group_id            = aws_security_group.keycloak[each.value.source].id
  referenced_security_group_id = aws_security_group.keycloak[each.value.target].id
  description                  = each.key
  ip_protocol                  = "tcp"
  from_port                    = each.value.port
  to_port                      = each.value.port
}

resource "aws_vpc_security_group_egress_rule" "https" {
  for_each          = toset(["tasks", "realm-runner", "access"])
  security_group_id = aws_security_group.keycloak[each.key].id
  description       = "HTTPS to AWS APIs, image/source registries and identity providers via NAT"
  cidr_ipv4         = "0.0.0.0/0"
  ip_protocol       = "tcp"
  from_port         = 443
  to_port           = 443
}
