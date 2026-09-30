resource "aws_lb" "enclave_host" {
  name                             = "${local.name_prefix}-nlb"
  internal                         = true
  load_balancer_type               = "network"
  subnets                          = var.private_subnet_ids
  enable_cross_zone_load_balancing = true

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
