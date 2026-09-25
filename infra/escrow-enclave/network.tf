data "aws_vpc" "selected" {
  id = var.vpc_id
}

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
  description = "escrow-enclave-host: 8443 from lca-api only, 8444 (NLB health) from VPC, no public ingress"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Enclave-host API (8443), reachable only from the lca-api Lambda security group"
    from_port       = 8443
    to_port         = 8443
    protocol        = "tcp"
    security_groups = [var.lca_api_security_group_id]
  }

  # NLB health-check requests always originate from the load balancer's own
  # node IPs inside the target VPC/subnets, regardless of client source IP
  # preservation for regular traffic — hence VPC CIDR, not the lca-api SG.
  ingress {
    description = "NLB TCP health checks (8444) from within the VPC"
    from_port   = 8444
    to_port     = 8444
    protocol    = "tcp"
    cidr_blocks = [data.aws_vpc.selected.cidr_block]
  }

  egress {
    description = "HTTPS egress for KMS/S3/DynamoDB (VPC endpoints recommended — see README)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  dynamic "egress" {
    for_each = var.roughtime_servers
    content {
      description = "Roughtime UDP relay egress to ${egress.value.host}:${egress.value.port}"
      from_port   = egress.value.port
      to_port     = egress.value.port
      protocol    = "udp"
      cidr_blocks = ["0.0.0.0/0"]
    }
  }

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-sg" })
}
