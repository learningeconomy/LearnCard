variable "aws_region" {
  description = "AWS region for all resources"
  type        = string
  default     = "us-east-1"
}

variable "instance_type" {
  description = "EC2 instance type (m5.xlarge = 4 vCPU, 16 GB — good for 1-2 concurrent previews)"
  type        = string
  default     = "m5.xlarge"
}

variable "ebs_volume_size" {
  description = "Root EBS volume size in GB (Docker images need space)"
  type        = number
  default     = 100
}

variable "ssh_public_key" {
  description = "SSH public key for EC2 access. Generate with: ssh-keygen -t ed25519 -f preview-server"
  type        = string
}

variable "api_key" {
  description = "API key for authenticating Lambda requests (used as x-api-key header)"
  type        = string
  sensitive   = true
}

variable "base_domain" {
  description = "Base domain for preview URLs (e.g., preview.learncard.com)"
  type        = string
  default     = "preview.learncard.com"
}

variable "route53_zone_id" {
  description = "Route53 hosted zone ID that contains the base domain"
  type        = string
}

variable "ssh_allowed_cidrs" {
  description = "CIDR blocks allowed to SSH into the EC2. Restrict to GitHub Actions IPs for production use."
  type        = list(string)
  default     = ["0.0.0.0/0"]
}
