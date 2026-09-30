resource "aws_lb" "keycloak" {
  name                       = local.name
  internal                   = false
  load_balancer_type         = "application"
  subnets                    = var.public_subnet_ids
  security_groups            = [aws_security_group.alb.id]
  drop_invalid_header_fields = true

  lifecycle {
    precondition {
      condition     = alltrue([for subnet in data.aws_subnet.public : subnet.vpc_id == var.vpc_id]) && length(toset([for subnet in data.aws_subnet.public : subnet.availability_zone])) >= 2
      error_message = "Public subnets must be in the selected VPC and span at least two availability zones."
    }
    precondition {
      condition     = var.hostname != var.admin_hostname
      error_message = "Public and admin hostnames must be different."
    }
  }
}

resource "aws_lb_target_group" "keycloak" {
  name        = local.name
  vpc_id      = data.aws_vpc.selected.id
  target_type = "ip"
  protocol    = "HTTP"
  port        = 8080

  stickiness {
    type            = "lb_cookie"
    enabled         = true
    cookie_duration = 86400
  }
  health_check {
    path                = "/health/ready"
    port                = "9000"
    protocol            = "HTTP"
    matcher             = "200"
    interval            = 15
    healthy_threshold   = 2
    unhealthy_threshold = 3
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.keycloak.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type = "redirect"
    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.keycloak.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = var.acm_certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.keycloak.arn
  }
}

resource "aws_lb_listener_rule" "admin" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 10
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.keycloak.arn
  }
  condition {
    host_header { values = [var.admin_hostname] }
  }
  condition {
    # Include the bare path as well as its descendants.
    path_pattern { values = ["/admin", "/admin/*"] }
  }
  # Split CIDRs into individual rules to stay below ALB's five total match
  # evaluations per rule (host + two paths + up to two source IPs).
  dynamic "condition" {
    for_each = length(var.admin_allowed_cidrs) > 0 ? [true] : []
    content {
      source_ip { values = slice(var.admin_allowed_cidrs, 0, min(2, length(var.admin_allowed_cidrs))) }
    }
  }
}

resource "aws_lb_listener_rule" "admin_extra_cidr" {
  count        = length(var.admin_allowed_cidrs) > 2 ? 1 : 0
  listener_arn = aws_lb_listener.https.arn
  priority     = 11
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.keycloak.arn
  }
  condition {
    host_header { values = [var.admin_hostname] }
  }
  condition {
    path_pattern { values = ["/admin", "/admin/*"] }
  }
  condition {
    source_ip { values = [var.admin_allowed_cidrs[2]] }
  }
}

resource "aws_lb_listener_rule" "deny_admin_elsewhere" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 20
  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      status_code  = "403"
      message_body = "Forbidden"
    }
  }
  condition {
    path_pattern { values = ["/admin", "/admin/*"] }
  }
}

resource "aws_lb_listener_rule" "admin_assets" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 30
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.keycloak.arn
  }
  condition {
    host_header { values = [var.admin_hostname] }
  }
  dynamic "condition" {
    for_each = length(var.admin_allowed_cidrs) > 0 ? [true] : []
    content {
      source_ip { values = var.admin_allowed_cidrs }
    }
  }
}

# Without this catch-all denial, the listener default would bypass the CIDR
# restriction for admin-host assets and master realm authentication endpoints.
resource "aws_lb_listener_rule" "deny_admin_host" {
  count        = length(var.admin_allowed_cidrs) > 0 ? 1 : 0
  listener_arn = aws_lb_listener.https.arn
  priority     = 40
  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      status_code  = "403"
      message_body = "Forbidden"
    }
  }
  condition {
    host_header { values = [var.admin_hostname] }
  }
}
