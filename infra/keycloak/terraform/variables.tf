variable "aws_region" {
  description = "AWS region for resources and the regional ACM certificate"
  type        = string
}

variable "environment" {
  description = "Deployment environment (staging or production)"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "name_prefix" {
  description = "Resource name prefix; environment is appended (use a distinct prefix per stack)"
  type        = string
  default     = "learncard-keycloak"
  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{0,18}[a-z0-9]$", var.name_prefix)) && !strcontains(var.name_prefix, "--") && !startswith(var.name_prefix, "internal-")
    error_message = "Use 2-20 lowercase letters, digits or hyphens, starting with a letter and ending with a letter or digit; consecutive hyphens and the internal- prefix are not allowed."
  }
}

variable "vpc_id" {
  description = "Existing VPC with DNS support and outbound access for private tasks"
  type        = string
}

variable "private_subnet_ids" {
  description = "Private task and database subnets spanning at least two availability zones"
  type        = list(string)
  validation {
    condition     = length(toset(var.private_subnet_ids)) >= 2
    error_message = "Provide at least two distinct private subnets."
  }
}

variable "public_subnet_ids" {
  description = "Public ALB subnets spanning at least two availability zones, routed to an internet gateway"
  type        = list(string)
  validation {
    condition     = length(toset(var.public_subnet_ids)) >= 2
    error_message = "Provide at least two distinct public subnets."
  }
}

variable "acm_certificate_arn" {
  description = "Issued ACM certificate ARN in aws_region covering both hostnames"
  type        = string
}

variable "route53_zone_id" {
  description = "Public Route 53 hosted zone ID containing both hostnames"
  type        = string
}

variable "hostname" {
  description = "Public Keycloak DNS name without scheme or path (e.g., auth.learncard.app)"
  type        = string
}

variable "admin_hostname" {
  description = "Separate admin DNS name without scheme or path (e.g., auth-admin.learncard.app)"
  type        = string
}

variable "keycloak_image" {
  description = "Full private ECR image URI with an immutable non-latest tag, built from infra/keycloak/Dockerfile"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}\\.dkr\\.ecr\\.[a-z0-9-]+\\.amazonaws\\.com(\\.cn)?/.+:[A-Za-z0-9_][A-Za-z0-9_.-]*$", var.keycloak_image)) && !endswith(var.keycloak_image, ":latest")
    error_message = "Provide a private ECR image URI with a pinned tag other than latest."
  }
}

variable "keycloak_version" {
  description = "Keycloak version for descriptive tags only; does not select or build the image"
  type        = string
  default     = "26.7.4"
}

variable "desired_count" {
  description = "Desired Fargate task count; production requires at least two after the clustering networking blocker is resolved"
  type        = number
  default     = 2
  validation {
    condition     = var.desired_count >= 1 && floor(var.desired_count) == var.desired_count
    error_message = "Desired count must be a positive integer."
  }
}

variable "task_cpu" {
  description = "Fargate task CPU units; must form a supported pair with task_memory"
  type        = number
  default     = 1024
}

variable "task_memory" {
  description = "Fargate task memory in MiB; must form a supported pair with task_cpu"
  type        = number
  default     = 2048
}

variable "db_min_capacity" {
  description = "Minimum Aurora Serverless v2 capacity in ACUs (no auto-pause)"
  type        = number
  default     = 0.5
  validation {
    condition     = var.db_min_capacity >= 0.5 && var.db_min_capacity <= 128 && floor(var.db_min_capacity * 2) == var.db_min_capacity * 2
    error_message = "Minimum capacity must be 0.5-128 ACUs in increments of 0.5."
  }
}

variable "db_max_capacity" {
  description = "Maximum Aurora Serverless v2 capacity in ACUs per instance"
  type        = number
  default     = 4
  validation {
    condition     = var.db_max_capacity >= 0.5 && var.db_max_capacity <= 128 && floor(var.db_max_capacity * 2) == var.db_max_capacity * 2
    error_message = "Maximum capacity must be 0.5-128 ACUs in increments of 0.5."
  }
}

variable "db_backup_retention_days" {
  description = "Aurora automated backup and point-in-time recovery retention in days"
  type        = number
  default     = 14
  validation {
    condition     = var.db_backup_retention_days >= 1 && var.db_backup_retention_days <= 35 && floor(var.db_backup_retention_days) == var.db_backup_retention_days
    error_message = "Backup retention must be an integer from 1 to 35 days."
  }
}

variable "db_deletion_protection" {
  description = "Protect Aurora against accidental deletion; disable explicitly before planned teardown"
  type        = bool
  default     = true
}

variable "db_password_secret_arn" {
  description = "Secrets Manager ARN containing the database password as a plain string (not JSON), encrypted with the AWS-managed Secrets Manager key"
  type        = string
}

variable "bootstrap_admin_password_secret_arn" {
  description = "Secrets Manager ARN containing the bootstrap admin password as a plain string, encrypted with the AWS-managed Secrets Manager key"
  type        = string
}

variable "bootstrap_admin_username" {
  description = "Temporary bootstrap administrator username; provision a permanent administrator and remove the temporary account after setup"
  type        = string
  default     = "admin"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1096, 1827, 2192, 2557, 2922, 3288, 3653], var.log_retention_days)
    error_message = "Choose a supported nonzero CloudWatch retention period."
  }
}

variable "admin_allowed_cidrs" {
  description = "Up to three IPv4 CIDRs allowed on the admin hostname; empty allows all sources (authentication is still required)"
  type        = list(string)
  default     = []
  validation {
    condition     = length(var.admin_allowed_cidrs) <= 3 && alltrue([for cidr in var.admin_allowed_cidrs : can(cidrnetmask(cidr))])
    error_message = "Provide at most three valid IPv4 CIDRs (ALB condition limit)."
  }
}

variable "tags" {
  description = "Additional AWS tags; required Project, ManagedBy, Environment and KeycloakVersion tags take precedence"
  type        = map(string)
  default     = {}
}
