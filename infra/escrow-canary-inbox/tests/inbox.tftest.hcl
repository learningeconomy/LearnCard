mock_provider "aws" {
  mock_resource "aws_route53_zone" { defaults = { zone_id = "Z000000000000", name_servers = ["ns-1.example.invalid"] } }
  mock_resource "aws_ses_domain_identity" { defaults = { verification_token = "token", id = "inbox.example.com" } }
}
variables {
  monitoring_account_id = "000000000000"
  inbox_domain          = "inbox.example.com"
}
run "shared_inbox_contract" {
  command = apply
  assert {
    condition     = one(aws_route53_record.mx.records) == "10 inbound-smtp.us-east-1.amazonaws.com" && one(aws_route53_record.dmarc.records) == "v=DMARC1; p=reject; adkim=s; aspf=s" && one(aws_route53_record.spf.records) == "v=spf1 -all"
    error_message = "Receive-only domain: MX to SES inbound, SPF -all, DMARC reject."
  }
  assert {
    condition     = length(aws_ses_domain_identity_verification.inbox) == 0
    error_message = "Verification waits for delegation_complete."
  }
  assert {
    condition     = aws_ses_active_receipt_rule_set.inbox.rule_set_name == "escrow-canary-inbox"
    error_message = "This stack owns the single active rule set."
  }
  assert {
    condition = alltrue([for f in fileset(path.module, "*.tf") :
      !strcontains(file("${path.module}/${f}"), "resource \"aws_ses_receipt_rule\" ") &&
      !strcontains(file("${path.module}/${f}"), "resource \"aws_s3_bucket\"")
    ]) && length(regexall("prevent_destroy = true", file("${path.module}/main.tf"))) == 2
    error_message = "No rules or buckets here; the rule set and active set are prevent_destroy."
  }
}
run "verifies_after_delegation" {
  command = apply
  variables {
    delegation_complete = true
  }
  assert {
    condition     = length(aws_ses_domain_identity_verification.inbox) == 1
    error_message = "Verification is created once delegation is complete."
  }
}
