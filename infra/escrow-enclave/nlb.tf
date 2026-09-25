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
  # for actual client traffic, and TCP NLB health checks require
  # healthy_threshold == unhealthy_threshold.
  health_check {
    protocol            = "TCP"
    port                = "8444"
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
