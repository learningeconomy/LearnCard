data "aws_ssm_parameter" "workload_boundary" {
  name = "${local.ssm_prefix}/bootstrap/workload_boundary_arn"
}

module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "6.7.3"

  name            = local.name
  cidr            = var.vpc_cidr
  azs             = var.availability_zones
  public_subnets  = [for index in range(3) : cidrsubnet(var.vpc_cidr, 8, index)]
  private_subnets = [for index in range(3) : cidrsubnet(var.vpc_cidr, 8, index + 10)]

  enable_dns_hostnames   = true
  enable_dns_support     = true
  enable_nat_gateway     = true
  single_nat_gateway     = var.single_nat_gateway
  one_nat_gateway_per_az = !var.single_nat_gateway

  # Do not adopt AWS-created default resources: the deploy role deliberately
  # cannot take over untagged resources, and workloads use explicit resources.
  manage_default_security_group = false
  manage_default_route_table    = false
  manage_default_network_acl    = false

  enable_flow_log                                 = true
  create_flow_log_cloudwatch_log_group            = true
  create_flow_log_cloudwatch_iam_role             = true
  flow_log_cloudwatch_log_group_retention_in_days = 14
  flow_log_cloudwatch_log_group_name_prefix       = "/aws/vpc-flow-log/"
  flow_log_cloudwatch_log_group_name_suffix       = local.name
  vpc_flow_log_iam_role_name                      = "${local.name}-flow-logs"
  vpc_flow_log_iam_role_use_name_prefix           = false
  vpc_flow_log_iam_policy_name                    = "${local.name}-flow-logs"
  vpc_flow_log_iam_policy_use_name_prefix         = false
  vpc_flow_log_permissions_boundary               = nonsensitive(data.aws_ssm_parameter.workload_boundary.value)
  flow_log_cloudwatch_iam_role_conditions = [
    {
      test     = "StringEquals"
      variable = "aws:SourceAccount"
      values   = [var.expected_account_id]
    }
  ]
}

resource "aws_vpc_endpoint" "s3" {
  vpc_id            = module.vpc.vpc_id
  service_name      = "com.amazonaws.${var.aws_region}.s3"
  vpc_endpoint_type = "Gateway"
  route_table_ids   = concat(module.vpc.private_route_table_ids, module.vpc.public_route_table_ids)
  tags              = { Name = "${local.name}-s3" }
}

# The pinned module scopes DescribeLogGroups to a log-group ARN, but AWS requires
# a wildcard resource for this discovery action. A boundary alone cannot grant it.
data "aws_iam_policy_document" "flow_log_discovery" {
  statement {
    actions   = ["logs:DescribeLogGroups"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "flow_log_discovery" {
  name       = "${local.name}-flow-log-discovery"
  role       = "${local.name}-flow-logs"
  policy     = data.aws_iam_policy_document.flow_log_discovery.json
  depends_on = [module.vpc]
}
