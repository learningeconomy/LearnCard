locals {
  privatelink_enabled = length(var.privatelink_allowed_principals) > 0
}

# The NLB carries its own security group so the host security group can admit
# only NLB-forwarded traffic, whichever way lca-api arrives:
# - same VPC: this group admits 8443 from the lca-api security group;
# - PrivateLink: traffic arrives from the endpoint service, which this group's
#   inbound rules are told not to filter; admission is the endpoint service's
#   allowed principals plus manual connection acceptance.
# NLB security groups can only be set at creation, so changing modes replaces it.
resource "aws_security_group" "nlb" {
  name        = "${local.name_prefix}-nlb-sg"
  description = "escrow-enclave NLB: 8443 from lca-api only"
  vpc_id      = var.vpc_id

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-nlb-sg" })
}

resource "aws_vpc_security_group_ingress_rule" "nlb_from_lca_api" {
  count = var.lca_api_security_group_id == null ? 0 : 1

  security_group_id            = aws_security_group.nlb.id
  description                  = "Enclave-host API (8443) from the lca-api security group"
  ip_protocol                  = "tcp"
  from_port                    = 8443
  to_port                      = 8443
  referenced_security_group_id = var.lca_api_security_group_id
}

resource "aws_vpc_security_group_egress_rule" "nlb_to_hosts" {
  for_each = toset(["8443", "8444"])

  security_group_id            = aws_security_group.nlb.id
  description                  = "Forward to enclave hosts (8443 API, 8444 health)"
  ip_protocol                  = "tcp"
  from_port                    = tonumber(each.value)
  to_port                      = tonumber(each.value)
  referenced_security_group_id = aws_security_group.enclave_host.id
}

resource "aws_lb" "enclave_host" {
  name                             = "${local.name_prefix}-nlb"
  internal                         = true
  load_balancer_type               = "network"
  subnets                          = var.private_subnet_ids
  security_groups                  = [aws_security_group.nlb.id]
  enable_cross_zone_load_balancing = true

  enforce_security_group_inbound_rules_on_private_link_traffic = local.privatelink_enabled ? "off" : null

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-nlb" })
}

resource "aws_lb_target_group" "enclave_host" {
  name        = "${local.name_prefix}-tg"
  port        = 8443
  protocol    = "TCP"
  vpc_id      = var.vpc_id
  target_type = "instance"

  # Separate health port (8444) per plan — the API port (8443) is reserved
  # for actual client traffic. HTTP (not HTTPS): services/escrow-enclave-host
  # serves GET /health on this port as plain HTTP, returning 200 {"ok":true}
  # once the supervised enclave is ready and 503 {"ok":false} otherwise (M11
  # fix — a bare TCP check only proved the listener socket was open, not
  # that the enclave behind it was actually up, so a down enclave with a
  # merely-open port never failed the health check). NLB target groups
  # require healthy_threshold == unhealthy_threshold regardless of health
  # check protocol.
  health_check {
    protocol            = "HTTP"
    port                = "8444"
    path                = "/health"
    matcher             = "200"
    healthy_threshold   = 3
    unhealthy_threshold = 3
    interval            = 10
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-tg" })
}

resource "aws_lb_listener" "enclave_host" {
  load_balancer_arn = aws_lb.enclave_host.arn
  port              = 8443
  protocol          = "TCP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.enclave_host.arn
  }
}

resource "aws_vpc_endpoint_service" "enclave_host" {
  count = local.privatelink_enabled ? 1 : 0

  acceptance_required        = true
  network_load_balancer_arns = [aws_lb.enclave_host.arn]
  allowed_principals         = var.privatelink_allowed_principals
  supported_ip_address_types = ["ipv4"]

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-endpoint-service" })
}
