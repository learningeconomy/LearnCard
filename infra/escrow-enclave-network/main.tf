# Network substrate for the escrow-enclave stack: private subnets for the
# enclave hosts and internal NLB, NAT egress (Roughtime UDP and any AWS API
# without an endpoint), and gateway/interface endpoints for S3, DynamoDB and
# KMS. Kept separate from escrow-enclave so either can be torn down alone.

data "aws_availability_zones" "selected" {
  state = "available"

  filter {
    name   = "zone-id"
    values = var.availability_zone_ids
  }
}

locals {
  name_prefix = "escrow-enclave-${var.environment}"

  # Keyed by AZ ID so the plan is stable even if names map differently later.
  zone_name_by_id = zipmap(data.aws_availability_zones.selected.zone_ids, data.aws_availability_zones.selected.names)
  zones           = { for i, id in var.availability_zone_ids : id => { index = i, name = local.zone_name_by_id[id] } }

  nat_zone_ids = var.single_nat_gateway ? [var.availability_zone_ids[0]] : var.availability_zone_ids
}

check "requested_zone_ids_exist" {
  assert {
    condition     = length(data.aws_availability_zones.selected.zone_ids) == length(var.availability_zone_ids)
    error_message = "One or more availability_zone_ids is not available in this account/region."
  }
}

resource "aws_vpc" "this" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = local.name_prefix }
}

# Lock down the default security group: nothing should ever use it.
resource "aws_default_security_group" "this" {
  vpc_id = aws_vpc.this.id
}

resource "aws_internet_gateway" "this" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = local.name_prefix }
}

resource "aws_subnet" "public" {
  for_each = { for id in local.nat_zone_ids : id => local.zones[id] }

  vpc_id                  = aws_vpc.this.id
  availability_zone_id    = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, 100 + each.value.index)
  map_public_ip_on_launch = false

  tags = { Name = "${local.name_prefix}-public-${each.value.name}", Tier = "public" }
}

resource "aws_subnet" "private" {
  for_each = local.zones

  vpc_id                  = aws_vpc.this.id
  availability_zone_id    = each.key
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, each.value.index)
  map_public_ip_on_launch = false

  tags = { Name = "${local.name_prefix}-private-${each.value.name}", Tier = "private" }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.name_prefix}-public" }
}

resource "aws_route" "public_internet" {
  route_table_id         = aws_route_table.public.id
  destination_cidr_block = "0.0.0.0/0"
  gateway_id             = aws_internet_gateway.this.id
}

resource "aws_route_table_association" "public" {
  for_each = aws_subnet.public

  subnet_id      = each.value.id
  route_table_id = aws_route_table.public.id
}

resource "aws_eip" "nat" {
  for_each = aws_subnet.public

  domain = "vpc"
  tags   = { Name = "${local.name_prefix}-nat-${each.key}" }
}

resource "aws_nat_gateway" "this" {
  for_each = aws_subnet.public

  allocation_id = aws_eip.nat[each.key].id
  subnet_id     = each.value.id
  tags          = { Name = "${local.name_prefix}-${each.key}" }

  depends_on = [aws_internet_gateway.this]
}

resource "aws_route_table" "private" {
  for_each = local.zones

  vpc_id = aws_vpc.this.id
  tags   = { Name = "${local.name_prefix}-private-${each.value.name}" }
}

resource "aws_route" "private_nat" {
  for_each = local.zones

  route_table_id         = aws_route_table.private[each.key].id
  destination_cidr_block = "0.0.0.0/0"
  nat_gateway_id         = aws_nat_gateway.this[var.single_nat_gateway ? local.nat_zone_ids[0] : each.key].id
}

resource "aws_route_table_association" "private" {
  for_each = aws_subnet.private

  subnet_id      = each.value.id
  route_table_id = aws_route_table.private[each.key].id
}

resource "aws_vpc_endpoint" "gateway" {
  for_each = toset(["s3", "dynamodb"])

  vpc_id            = aws_vpc.this.id
  service_name      = "com.amazonaws.${var.aws_region}.${each.value}"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = [for rt in aws_route_table.private : rt.id]

  tags = { Name = "${local.name_prefix}-${each.value}" }
}

resource "aws_security_group" "kms_endpoint" {
  count = var.kms_interface_endpoint ? 1 : 0

  name        = "${local.name_prefix}-kms-endpoint"
  description = "KMS interface endpoint: HTTPS from inside the escrow VPC only"
  vpc_id      = aws_vpc.this.id

  ingress {
    description = "HTTPS from the escrow VPC"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = { Name = "${local.name_prefix}-kms-endpoint" }
}

resource "aws_vpc_endpoint" "kms" {
  count = var.kms_interface_endpoint ? 1 : 0

  vpc_id              = aws_vpc.this.id
  service_name        = "com.amazonaws.${var.aws_region}.kms"
  vpc_endpoint_type   = "Interface"
  private_dns_enabled = true
  subnet_ids          = [for s in aws_subnet.private : s.id]
  security_group_ids  = [aws_security_group.kms_endpoint[0].id]

  tags = { Name = "${local.name_prefix}-kms" }
}
