# No AWS credentials or live resources: regression coverage for the private-admin
# architecture that replaces groundwork's public-host CIDR allowlist.
mock_provider "aws" {
  mock_data "aws_caller_identity" {
    defaults = { account_id = "281762601323" }
  }
  mock_data "aws_iam_policy_document" {
    defaults = { json = "{\"Version\":\"2012-10-17\",\"Statement\":[]}" }
  }
  mock_data "aws_ssm_parameter" {
    defaults = { value = "mock-value" }
  }
  mock_resource "aws_lb" {
    defaults = { arn = "arn:aws:elasticloadbalancing:us-east-1:281762601323:loadbalancer/app/mock/1234567890123456" }
  }
  mock_resource "aws_lb_listener" {
    defaults = { arn = "arn:aws:elasticloadbalancing:us-east-1:281762601323:listener/app/mock/1234567890123456/1234567890123456" }
  }
  mock_resource "aws_lb_target_group" {
    defaults = { arn = "arn:aws:elasticloadbalancing:us-east-1:281762601323:targetgroup/mock/1234567890123456" }
  }
}
mock_provider "aws" { alias = "backup_copy" }

override_resource {
  target = aws_lb.admin
  values = { arn = "arn:aws:elasticloadbalancing:us-east-1:281762601323:loadbalancer/app/admin/2222222222222222" }
}
override_resource {
  target = aws_lb_listener.admin
  values = { arn = "arn:aws:elasticloadbalancing:us-east-1:281762601323:listener/app/admin/2222222222222222/2222222222222222" }
}

variables {
  environment                         = "staging"
  expected_account_id                 = "281762601323"
  keycloak_image                      = "281762601323.dkr.ecr.us-east-1.amazonaws.com/learncard/keycloak@sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"
  bootstrap_admin_password_secret_arn = "arn:aws:secretsmanager:us-east-1:281762601323:secret:learncard-keycloak/staging/bootstrap-admin-abcdef"
}

override_data {
  target = data.aws_ssm_parameter.network["vpc_id"]
  values = { value = "vpc-12345678" }
}
override_data {
  target = data.aws_ssm_parameter.network["private_subnet_ids"]
  values = { value = "subnet-private-a,subnet-private-b" }
}
override_data {
  target = data.aws_ssm_parameter.network["public_subnet_ids"]
  values = { value = "subnet-public-a,subnet-public-b" }
}
override_data {
  target = data.aws_ssm_parameter.network["auth_hostname"]
  values = { value = "auth.example.com" }
}
override_data {
  target = data.aws_ssm_parameter.network["admin_hostname"]
  values = { value = "admin.auth.example.com" }
}
override_data {
  target = data.aws_ssm_parameter.network["auth_certificate_arn"]
  values = { value = "arn:aws:acm:us-east-1:281762601323:certificate/11111111-1111-1111-1111-111111111111" }
}
override_data {
  target = data.aws_ssm_parameter.network["admin_certificate_arn"]
  values = { value = "arn:aws:acm:us-east-1:281762601323:certificate/22222222-2222-2222-2222-222222222222" }
}
override_data {
  target = data.aws_subnet.public["subnet-public-a"]
  values = { vpc_id = "vpc-12345678", availability_zone = "us-east-1a" }
}
override_data {
  target = data.aws_subnet.public["subnet-public-b"]
  values = { vpc_id = "vpc-12345678", availability_zone = "us-east-1b" }
}

run "admin_access_is_private_and_fail_closed" {
  command = apply
  plan_options {
    target = [aws_lb_listener_rule.deny_admin, aws_lb_listener_rule.public, aws_lb_listener_rule.admin, aws_vpc_security_group_ingress_rule.private, aws_vpc_security_group_ingress_rule.public]
  }

  assert {
    condition     = aws_lb.admin.internal && toset(aws_lb.admin.subnets) == toset(local.private_subnet_ids) && toset(aws_lb.admin.security_groups) == toset([aws_security_group.keycloak["admin-alb"].id])
    error_message = "The admin ALB must remain internal, on private subnets, with only its restricted security group attached."
  }
  assert {
    condition = (aws_lb_listener.https.load_balancer_arn == aws_lb.keycloak.arn && aws_lb_listener.admin.load_balancer_arn == aws_lb.admin.arn &&
      aws_lb_listener_rule.public.listener_arn == aws_lb_listener.https.arn &&
      alltrue([for rule in aws_lb_listener_rule.deny_admin : rule.listener_arn == aws_lb_listener.https.arn]) &&
    alltrue([for rule in aws_lb_listener_rule.admin : rule.listener_arn == aws_lb_listener.admin.arn]))
    error_message = "Public denials and forwarding must attach to the public listener; admin forwarding must attach only to the private listener."
  }
  assert {
    condition = alltrue([for rule in aws_lb_listener_rule.deny_admin :
      rule.action[0].type == "fixed-response" && rule.action[0].fixed_response[0].status_code == "403" &&
      rule.priority < aws_lb_listener_rule.public.priority &&
      length(rule.condition) == 1
    ]) && toset(flatten([for rule in aws_lb_listener_rule.deny_admin : [for condition in rule.condition : [for path in condition.path_pattern : path.values]]])) == toset(["/admin*", "/realms/master", "/realms/master/*"])
    error_message = "Public admin and master paths must be denied before forwarding, without host or source-IP exceptions."
  }
  assert {
    condition     = aws_lb_listener.https.default_action[0].fixed_response[0].status_code == "404" && aws_lb_listener.admin.default_action[0].fixed_response[0].status_code == "404"
    error_message = "Both listeners must deny unmatched paths rather than default-forwarding."
  }
  assert {
    condition = toset([for rule in aws_vpc_security_group_ingress_rule.private : rule.referenced_security_group_id if rule.security_group_id == aws_security_group.keycloak["admin-alb"].id]) == toset([
      aws_security_group.keycloak["realm-runner"].id, aws_security_group.keycloak["access"].id
      ]) && alltrue([for rule in aws_vpc_security_group_ingress_rule.private :
      rule.from_port == 443 && rule.to_port == 443 && rule.ip_protocol == "tcp" && rule.cidr_ipv4 == null && rule.cidr_ipv6 == null
      if rule.security_group_id == aws_security_group.keycloak["admin-alb"].id
    ]) && alltrue([for rule in aws_vpc_security_group_ingress_rule.public : rule.security_group_id != aws_security_group.keycloak["admin-alb"].id])
    error_message = "Only the realm runner and access task may reach admin HTTPS; public CIDR ingress must never target the admin ALB."
  }
}
