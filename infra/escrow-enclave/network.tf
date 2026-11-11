data "aws_subnet" "selected" {
  for_each = toset(var.private_subnet_ids)

  id = each.value
}

# terraform validate never evaluates data sources or check blocks (no AWS
# calls happen), so this is safe to run with no credentials; it only takes
# effect on `plan`/`apply` against real AWS resources.
check "private_subnets_span_multiple_azs" {
  assert {
    condition     = length(distinct([for s in data.aws_subnet.selected : s.availability_zone])) >= 2
    error_message = "private_subnet_ids must span at least 2 distinct Availability Zones."
  }
}

check "private_subnets_have_no_public_ip_on_launch" {
  assert {
    condition     = alltrue([for s in data.aws_subnet.selected : s.map_public_ip_on_launch == false])
    error_message = "private_subnet_ids must all have map_public_ip_on_launch = false — public subnets are not allowed for enclave-host."
  }
}

resource "aws_security_group" "enclave_host" {
  name        = "${local.name_prefix}-sg"
  description = "escrow-enclave-host: 8443 and 8444 (health) from the NLB only, no public ingress"
  vpc_id      = var.vpc_id

  # Both ports admit only the NLB's security group: lca-api reaches the API
  # through the NLB (same VPC or PrivateLink), and health checks come from it.
  ingress {
    description     = "Enclave-host API (8443) from the NLB"
    from_port       = 8443
    to_port         = 8443
    protocol        = "tcp"
    security_groups = [aws_security_group.nlb.id]
  }

  ingress {
    description     = "NLB HTTP health checks (8444)"
    from_port       = 8444
    to_port         = 8444
    protocol        = "tcp"
    security_groups = [aws_security_group.nlb.id]
  }

  egress {
    description = "HTTPS egress for KMS/S3/DynamoDB (VPC endpoints recommended, see README)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "egress" {
    for_each = toset([for s in var.roughtime_servers : tostring(s.port)])
    content {
      description = "Roughtime UDP relay egress port ${egress.value}"
      from_port   = tonumber(egress.value)
      to_port     = tonumber(egress.value)
      protocol    = "udp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-sg" })
}
