# =============================================================================
# PR Preview Infrastructure
#
# Provisions all AWS resources needed for the full-stack PR preview system:
#   - EC2 instance with Elastic IP for running Docker preview stacks
#   - Security group (SSH, HTTP, HTTPS)
#   - Route53 wildcard DNS record
#   - Lambda function + Function URL for start/stop/status API
#   - IAM role with least-privilege EC2 permissions
#
# Usage:
#   cd preview/infra
#   cp terraform.tfvars.example terraform.tfvars  # fill in values
#   terraform init
#   terraform plan
#   terraform apply
#
# After apply, run the bootstrap script on the EC2:
#   ssh -i <private_key> ubuntu@$(terraform output -raw ec2_public_ip) \
#       'bash -s' < ../scripts/ec2-bootstrap.sh
# =============================================================================

terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }

    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }

  # Uncomment to use S3 backend for shared state:
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "preview-infra/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project   = "learncard-preview"
      ManagedBy = "terraform"
    }
  }
}

# -----------------------------------------------------------------------------
# Data Sources
# -----------------------------------------------------------------------------

data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/.build/lambda.zip"
}

# -----------------------------------------------------------------------------
# Networking
# -----------------------------------------------------------------------------

resource "aws_security_group" "preview" {
  name        = "preview-server-sg"
  description = "Security group for PR preview server"

  ingress {
    description = "SSH"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidrs
  }

  ingress {
    description = "HTTP (Caddy redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS (Caddy TLS)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "All outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "preview-server"
  }
}

resource "aws_eip" "preview" {
  domain = "vpc"

  tags = {
    Name = "preview-server"
  }
}

# -----------------------------------------------------------------------------
# EC2 Instance
# -----------------------------------------------------------------------------

resource "aws_key_pair" "preview" {
  key_name   = "preview-server"
  public_key = var.ssh_public_key
}

resource "aws_instance" "preview" {
  ami                    = data.aws_ami.ubuntu.id
  instance_type          = var.instance_type
  key_name               = aws_key_pair.preview.key_name
  vpc_security_group_ids = [aws_security_group.preview.id]

  root_block_device {
    volume_size = var.ebs_volume_size
    volume_type = "gp3"
  }

  tags = {
    Name = "preview-server"
  }
}

resource "aws_eip_association" "preview" {
  instance_id   = aws_instance.preview.id
  allocation_id = aws_eip.preview.id
}

# -----------------------------------------------------------------------------
# DNS
# -----------------------------------------------------------------------------

resource "aws_route53_record" "preview_wildcard" {
  zone_id = var.route53_zone_id
  name    = "*.${var.base_domain}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.preview.public_ip]
}

# -----------------------------------------------------------------------------
# Lambda IAM
# -----------------------------------------------------------------------------

resource "aws_iam_role" "lambda" {
  name = "preview-ec2-manager"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
    }]
  })
}

resource "aws_iam_role_policy" "lambda_ec2" {
  name = "ec2-start-stop"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["ec2:StartInstances", "ec2:StopInstances"]
        Resource = aws_instance.preview.arn
      },
      {
        Effect   = "Allow"
        Action   = "ec2:DescribeInstances"
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# -----------------------------------------------------------------------------
# Lambda Function
# -----------------------------------------------------------------------------

resource "aws_lambda_function" "preview_manager" {
  function_name    = "preview-ec2-manager"
  role             = aws_iam_role.lambda.arn
  handler          = "index.handler"
  runtime          = "nodejs20.x"
  timeout          = 30
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  environment {
    variables = {
      INSTANCE_ID = aws_instance.preview.id
      API_KEY     = var.api_key
    }
  }
}

resource "aws_lambda_function_url" "preview_manager" {
  function_name      = aws_lambda_function.preview_manager.function_name
  authorization_type = "NONE"
}

resource "aws_lambda_permission" "function_url_public" {
  statement_id           = "FunctionURLAllowPublicAccess"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.preview_manager.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}
