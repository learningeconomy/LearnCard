# Terraform 1.7+ mock providers: no AWS credentials or live resources.
mock_provider "aws" {}

variables {
  aws_region                          = "us-east-1"
  environment                         = "staging"
  vpc_id                              = "vpc-xxxxxxxx"
  private_subnet_ids                  = ["subnet-private-a", "subnet-private-b"]
  public_subnet_ids                   = ["subnet-public-a", "subnet-public-b"]
  acm_certificate_arn                 = "arn:aws:acm:us-east-1:000000000000:certificate/REPLACE_ME"
  route53_zone_id                     = "Z_REPLACE_ME"
  hostname                            = "auth-staging.example.com"
  admin_hostname                      = "auth-admin-staging.example.com"
  keycloak_image                      = "000000000000.dkr.ecr.us-east-1.amazonaws.com/keycloak:26.7.4-build-1"
  bootstrap_admin_password_secret_arn = "arn:aws:secretsmanager:us-east-1:000000000000:secret:keycloak-staging-admin-REPLACE"
  desired_count                       = 1
  db_min_capacity                     = 0.5
  db_max_capacity                     = 2
  db_deletion_protection              = false
}
override_data {
  target = data.aws_subnet.public["subnet-public-a"]
  values = { vpc_id = "vpc-xxxxxxxx", availability_zone = "us-east-1a" }
}
override_data {
  target = data.aws_subnet.public["subnet-public-b"]
  values = { vpc_id = "vpc-xxxxxxxx", availability_zone = "us-east-1b" }
}

run "default_denies" {
  command = plan
  plan_options {
    target = [aws_lb_listener_rule.admin, aws_lb_listener_rule.admin_extra_cidr, aws_lb_listener_rule.admin_assets, aws_lb_listener_rule.deny_admin_host, aws_lb_listener_rule.deny_admin_elsewhere]
  }
  assert {
    condition     = length(aws_lb_listener_rule.admin) == 0 && length(aws_lb_listener_rule.admin_assets) == 0 && length(aws_lb_listener_rule.admin_extra_cidr) == 0
    error_message = "Only explicitly allowed sources may receive forwarding rules."
  }
  assert {
    condition     = aws_lb_listener_rule.deny_admin_host.priority == 40 && aws_lb_listener_rule.deny_admin_host.action[0].fixed_response[0].status_code == "403"
    error_message = "Admin host must always have a catch-all denial."
  }
}

run "one_source" {
  command = plan
  plan_options {
    target = [aws_lb_listener_rule.admin, aws_lb_listener_rule.admin_extra_cidr, aws_lb_listener_rule.admin_assets, aws_lb_listener_rule.deny_admin_host, aws_lb_listener_rule.deny_admin_elsewhere]
  }
  variables { admin_allowed_cidrs = ["192.0.2.0/24"] }
  assert {
    condition     = length(aws_lb_listener_rule.admin) == 1 && length(aws_lb_listener_rule.admin_assets) == 1 && length(aws_lb_listener_rule.admin_extra_cidr) == 0
    error_message = "Only explicitly allowed sources may receive forwarding rules."
  }
  assert {
    condition     = aws_lb_listener_rule.deny_admin_host.priority == 40 && aws_lb_listener_rule.deny_admin_host.action[0].fixed_response[0].status_code == "403"
    error_message = "Admin host must always have a catch-all denial."
  }
}

run "three_sources" {
  command = plan
  plan_options {
    target = [aws_lb_listener_rule.admin, aws_lb_listener_rule.admin_extra_cidr, aws_lb_listener_rule.admin_assets, aws_lb_listener_rule.deny_admin_host, aws_lb_listener_rule.deny_admin_elsewhere]
  }
  variables { admin_allowed_cidrs = ["192.0.2.0/24", "198.51.100.0/24", "203.0.113.0/24"] }
  assert {
    condition     = length(aws_lb_listener_rule.admin) == 1 && length(aws_lb_listener_rule.admin_assets) == 1 && length(aws_lb_listener_rule.admin_extra_cidr) == 1
    error_message = "Only explicitly allowed sources may receive forwarding rules."
  }
  assert {
    condition     = aws_lb_listener_rule.deny_admin_host.priority == 40 && aws_lb_listener_rule.deny_admin_host.action[0].fixed_response[0].status_code == "403"
    error_message = "Admin host must always have a catch-all denial."
  }
}

run "cidr_conditions" {
  command = plan
  plan_options {
    target = [aws_lb_listener_rule.admin, aws_lb_listener_rule.admin_extra_cidr, aws_lb_listener_rule.admin_assets]
  }
  variables {
    admin_allowed_cidrs = ["192.0.2.0/24", "198.51.100.0/24", "203.0.113.0/24"]
  }
  assert {
    condition     = toset(flatten([for c in aws_lb_listener_rule.admin[0].condition : [for ip in c.source_ip : ip.values]])) == toset(["192.0.2.0/24", "198.51.100.0/24"])
    error_message = "Main admin rule must restrict the first two CIDRs."
  }
  assert {
    condition     = toset(flatten([for c in aws_lb_listener_rule.admin_extra_cidr[0].condition : [for ip in c.source_ip : ip.values]])) == toset(["203.0.113.0/24"])
    error_message = "Extra admin rule must restrict the third CIDR."
  }
  assert {
    condition     = toset(flatten([for c in aws_lb_listener_rule.admin_assets[0].condition : [for ip in c.source_ip : ip.values]])) == toset(var.admin_allowed_cidrs)
    error_message = "Admin assets must restrict all allowed CIDRs."
  }
}
