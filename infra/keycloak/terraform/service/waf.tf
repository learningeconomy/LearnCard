locals {
  waf_managed_groups = ["AWSManagedRulesCommonRuleSet", "AWSManagedRulesKnownBadInputsRuleSet", "AWSManagedRulesAmazonIpReputationList"]
  waf_paths = {
    token  = { priority = 10, pattern = "^/realms/[^/]+/protocol/openid-connect/token/?$" }
    login  = { priority = 11, pattern = "^/realms/[^/]+/login-actions/.*$" }
    broker = { priority = 12, pattern = "^/realms/[^/]+/broker/.*$" }
  }
}

resource "aws_wafv2_web_acl" "keycloak" {
  name  = "${local.name}-public"
  scope = "REGIONAL"
  default_action {
    allow {}
  }

  dynamic "rule" {
    for_each = { for index, group in local.waf_managed_groups : group => index }
    content {
      name     = "${local.name}-${rule.value}"
      priority = rule.value
      override_action {
        dynamic "count" {
          for_each = var.waf_block_mode ? [] : [1]
          content {}
        }
        dynamic "none" {
          for_each = var.waf_block_mode ? [1] : []
          content {}
        }
      }
      statement {
        managed_rule_group_statement {
          name        = rule.key
          vendor_name = "AWS"
        }
      }
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name}-${rule.value}"
        sampled_requests_enabled   = false
      }
    }
  }

  dynamic "rule" {
    for_each = local.waf_paths
    content {
      name     = "${local.name}-rate-${rule.key}"
      priority = rule.value.priority
      action {
        dynamic "block" {
          for_each = var.waf_block_mode ? [1] : []
          content {}
        }
        dynamic "count" {
          for_each = var.waf_block_mode ? [] : [1]
          content {}
        }
      }
      statement {
        rate_based_statement {
          limit                 = var.waf_rate_limits[rule.key]
          aggregate_key_type    = "IP"
          evaluation_window_sec = 60
          scope_down_statement {
            regex_match_statement {
              regex_string = rule.value.pattern
              field_to_match {
                uri_path {}
              }
              text_transformation {
                priority = 0
                type     = "URL_DECODE"
              }
              text_transformation {
                priority = 1
                type     = "NORMALIZE_PATH"
              }
            }
          }
        }
      }
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${local.name}-rate-${rule.key}"
        sampled_requests_enabled   = false
      }
    }
  }
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name}-public"
    sampled_requests_enabled   = false
  }
}

resource "aws_wafv2_web_acl_association" "keycloak" {
  resource_arn = aws_lb.keycloak.arn
  web_acl_arn  = aws_wafv2_web_acl.keycloak.arn
}

resource "aws_cloudwatch_log_group" "waf" {
  name              = "aws-waf-logs-${local.name}"
  retention_in_days = 7
}

resource "aws_wafv2_web_acl_logging_configuration" "keycloak" {
  resource_arn            = aws_wafv2_web_acl.keycloak.arn
  log_destination_configs = [aws_cloudwatch_log_group.waf.arn]
  redacted_fields {
    single_header { name = "authorization" }
  }
  redacted_fields {
    single_header { name = "cookie" }
  }
  # OAuth codes and state can appear in query strings. Sampling is disabled above
  # because log redaction does not protect sampled requests.
  redacted_fields {
    query_string {}
  }
}
