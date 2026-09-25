resource "aws_lb" "keycloak" {
  name                       = local.name
  internal                   = false
  load_balancer_type         = "application"
  subnets                    = local.public_subnet_ids
  security_groups            = [aws_security_group.keycloak["alb"].id]
  drop_invalid_header_fields = true
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "public"
    enabled = true
  }
  depends_on = [aws_s3_bucket_policy.alb_logs]
  lifecycle {
    precondition {
      condition     = alltrue([for subnet in data.aws_subnet.public : subnet.vpc_id == local.network.vpc_id]) && length(toset([for subnet in data.aws_subnet.public : subnet.availability_zone])) >= 2
      error_message = "Public subnets must be in the network VPC and span at least two AZs."
    }
    precondition {
      condition     = local.network.auth_hostname != local.network.admin_hostname
      error_message = "Public and private admin hostnames must differ."
    }
  }
}

resource "aws_lb" "admin" {
  # ALB names have a 32-character limit; the full production prefix plus admin
  # exceeds it. IAM role, bucket and SG names retain the full environment name.
  name                       = "learncard-keycloak-${var.environment == "production" ? "prod" : "stg"}-admin"
  internal                   = true
  load_balancer_type         = "application"
  subnets                    = local.private_subnet_ids
  security_groups            = [aws_security_group.keycloak["admin-alb"].id]
  drop_invalid_header_fields = true
  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "admin"
    enabled = true
  }
  depends_on = [aws_s3_bucket_policy.alb_logs]
}

resource "aws_lb_target_group" "keycloak" {
  for_each    = toset(["public", "admin"])
  name        = "lc-kc-${var.environment}-${each.key}"
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
  certificate_arn   = local.network.auth_certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_certificate" "additional" {
  for_each        = toset(var.additional_certificate_arns)
  listener_arn    = aws_lb_listener.https.arn
  certificate_arn = each.value
}

resource "aws_lb_listener_rule" "deny_admin" {
  for_each     = { admin = ["/admin*"], master = ["/realms/master", "/realms/master/*"] }
  listener_arn = aws_lb_listener.https.arn
  priority     = each.key == "admin" ? 10 : 20
  action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      status_code  = "403"
      message_body = "Forbidden"
    }
  }
  condition {
    path_pattern { values = each.value }
  }
}

resource "aws_lb_listener_rule" "public" {
  listener_arn = aws_lb_listener.https.arn
  priority     = 100
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.keycloak["public"].arn
  }
  condition {
    path_pattern { values = ["/realms/*", "/resources/*", "/.well-known/*"] }
  }
}

resource "aws_lb_listener" "admin" {
  load_balancer_arn = aws_lb.admin.arn
  port              = 443
  protocol          = "HTTPS"
  certificate_arn   = local.network.admin_certificate_arn
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"
  default_action {
    type = "fixed-response"
    fixed_response {
      content_type = "text/plain"
      status_code  = "404"
    }
  }
}

resource "aws_lb_listener_rule" "admin" {
  # Split conditions to respect ALB's three values per condition limit.
  for_each = {
    admin     = { priority = 10, paths = ["/admin", "/admin/*"] }
    master    = { priority = 20, paths = ["/realms/master", "/realms/master/*"] }
    resources = { priority = 30, paths = ["/resources/*"] }
  }
  listener_arn = aws_lb_listener.admin.arn
  priority     = each.value.priority
  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.keycloak["admin"].arn
  }
  condition {
    path_pattern { values = each.value.paths }
  }
}
