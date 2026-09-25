variable "aws_region" {
  description = "AWS region matching the network root"
  type        = string
  default     = "us-east-1"
  validation {
    condition     = var.aws_region == "us-east-1"
    error_message = "This platform is commissioned in us-east-1; review all regional dependencies before expanding."
  }
}

variable "environment" {
  description = "Deployment environment"
  type        = string
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be staging or production."
  }
}

variable "expected_account_id" {
  description = "Expected account from environment tfvars; provider allowlist rejects wrong credentials"
  type        = string
  validation {
    condition     = can(regex("^[0-9]{12}$", var.expected_account_id))
    error_message = "Provide a 12-digit AWS account ID."
  }
}

variable "keycloak_image" {
  description = "Account-local learncard/keycloak ECR image digest, containing the optimized Linux ARM64 build"
  type        = string
  validation {
    condition     = can(regex("^${var.expected_account_id}\\.dkr\\.ecr\\.${var.aws_region}\\.amazonaws\\.com/learncard/keycloak@sha256:[a-f0-9]{64}$", var.keycloak_image))
    error_message = "Supply the account-local learncard/keycloak image pinned by sha256 digest, not a tag."
  }
}

variable "keycloak_version" {
  description = "Descriptive image version; must match the selected digest (does not build an image)"
  type        = string
  default     = "26.7.4"
  validation {
    condition     = can(regex("^26\\.[0-9]+\\.[0-9]+$", var.keycloak_version))
    error_message = "This platform targets a pinned Keycloak 26.x release."
  }
}

variable "desired_count" {
  description = "Initial count; Application Auto Scaling owns it after creation"
  type        = number
  default     = 1
  validation {
    condition     = floor(var.desired_count) == var.desired_count && var.desired_count >= var.min_task_count && var.desired_count <= var.max_task_count
    error_message = "Initial task count must be an integer within autoscaling bounds."
  }
}

variable "min_task_count" {
  description = "Autoscaling floor; production requires at least two"
  type        = number
  default     = 1
  validation {
    condition     = floor(var.min_task_count) == var.min_task_count && var.min_task_count >= (var.environment == "production" ? 2 : 1)
    error_message = "Minimum tasks must be a positive integer (at least two in production)."
  }
}

variable "max_task_count" {
  description = "Autoscaling ceiling; included in database pool budgeting"
  type        = number
  default     = 2
  validation {
    condition     = floor(var.max_task_count) == var.max_task_count && var.max_task_count >= var.min_task_count && var.max_task_count <= 20
    error_message = "Maximum tasks must be an integer from the minimum count through 20."
  }
}

variable "cpu_target_percent" {
  description = "ECS average CPU target tracking percentage"
  type        = number
  default     = 55
  validation {
    condition     = var.cpu_target_percent >= 20 && var.cpu_target_percent <= 80
    error_message = "Choose a CPU target between 20 and 80 percent."
  }
}

variable "task_cpu" {
  description = "Fargate CPU units (baseline staging 1024, production 2048)"
  type        = number
  default     = 1024
  validation {
    condition     = contains([1024, 2048], var.task_cpu)
    error_message = "Use 1024 or 2048 CPU units for the reviewed sizing baseline."
  }
}

variable "task_memory" {
  description = "Fargate memory in MiB; at least 2 GiB per vCPU"
  type        = number
  default     = 2048
  validation {
    condition     = var.task_memory >= var.task_cpu * 2 && var.task_memory <= var.task_cpu * 8 && var.task_memory % 1024 == 0
    error_message = "Use a supported 1-GiB increment between 2 and 8 GiB per vCPU."
  }
}

variable "db_min_capacity" {
  description = "Minimum per-instance Serverless v2 ACUs; production floor is 2"
  type        = number
  default     = 0.5
  validation {
    condition     = var.db_min_capacity >= (var.environment == "production" ? 2 : 0.5) && var.db_min_capacity <= 128 && floor(var.db_min_capacity * 2) == var.db_min_capacity * 2
    error_message = "Use half-ACU increments up to 128; minimum 0.5 staging / 2 production."
  }
}

variable "db_max_capacity" {
  description = "Maximum per-instance Serverless v2 ACUs"
  type        = number
  default     = 4
  validation {
    condition     = var.db_max_capacity >= var.db_min_capacity && var.db_max_capacity <= 128 && floor(var.db_max_capacity * 2) == var.db_max_capacity * 2
    error_message = "Maximum must be >= minimum, in half-ACU increments, up to 128."
  }
}

variable "db_instance_count" {
  description = "Serverless writer plus optional failover readers in distinct AZs"
  type        = number
  default     = 1
  validation {
    condition     = contains([1, 2, 3], var.db_instance_count) && (var.environment != "production" || var.db_instance_count >= 2)
    error_message = "Choose 1-3 instances; production requires at least two."
  }
}

variable "db_pool_size" {
  description = "Fixed initial/min/max connections per task; include 200% rolling surge in capacity testing"
  type        = number
  default     = 10
  validation {
    condition     = floor(var.db_pool_size) == var.db_pool_size && var.db_pool_size >= 1 && var.db_pool_size * var.max_task_count * 2 < var.db_connection_budget * 0.7
    error_message = "Pool must be a positive integer; pools at 200% of maximum tasks must stay below 70% of the connection budget."
  }
}

variable "db_connection_budget" {
  description = "Connection budget at or below Aurora's max_connections, which Serverless v2 derives from maximum ACU and holds fixed while scaling; confirm after apply"
  type        = number
  default     = 100
  validation {
    condition     = floor(var.db_connection_budget) == var.db_connection_budget && var.db_connection_budget >= 10
    error_message = "Provide an integer connection budget of at least ten."
  }
}

variable "db_rotation_risk_acknowledged" {
  description = "Acknowledges Phase 3 spike-first remains open: ECS retains startup DB credentials across RDS secret rotation"
  type        = bool
  default     = false
}

variable "db_backup_retention_days" {
  description = "Aurora PITR retention"
  type        = number
  default     = 14
  validation {
    condition     = floor(var.db_backup_retention_days) == var.db_backup_retention_days && var.db_backup_retention_days >= 1 && var.db_backup_retention_days <= 35
    error_message = "Use 1-35 whole days."
  }
}

variable "db_deletion_protection" {
  description = "Disable only for reviewed teardown"
  type        = bool
  default     = true
}

variable "bootstrap_admin_password_secret_arn" {
  description = "Existing same-account, same-region plain-string bootstrap password secret; never read into Terraform"
  type        = string
  validation {
    condition     = can(regex("^arn:aws:secretsmanager:${var.aws_region}:${var.expected_account_id}:secret:learncard-keycloak/${var.environment}/.+$", var.bootstrap_admin_password_secret_arn))
    error_message = "Use a secret ARN within learncard-keycloak/<environment>/ in this account and region."
  }
}

variable "bootstrap_admin_username" {
  description = "Temporary administrator; delete after the realm automation identity is established"
  type        = string
  default     = "admin"
}

variable "admin_forward_port" {
  description = "Advertised break-glass HTTPS port; PD-4 hostname/forwarding spike must verify this before use"
  type        = number
  default     = 8443
  validation {
    condition     = floor(var.admin_forward_port) == var.admin_forward_port && var.admin_forward_port >= 1024 && var.admin_forward_port <= 65535
    error_message = "Choose an unprivileged integer port from 1024 to 65535."
  }
}

variable "additional_certificate_arns" {
  description = "Additional regional ACM SNI certificates for future branded auth domains"
  type        = list(string)
  default     = []
  validation {
    condition     = length(var.additional_certificate_arns) <= 24 && alltrue([for arn in var.additional_certificate_arns : can(regex("^arn:aws:acm:${var.aws_region}:${var.expected_account_id}:certificate/.+$", arn))])
    error_message = "Supply at most 24 ACM certificate ARNs in this region/account."
  }
}

variable "log_retention_days" {
  description = "CloudWatch retention"
  type        = number
  default     = 30
  validation {
    condition     = contains([7, 14, 30, 60, 90, 180, 365], var.log_retention_days)
    error_message = "Use a reviewed retention of 7,14,30,60,90,180 or 365 days."
  }
}

variable "waf_block_mode" {
  description = "Count during staging commissioning; enable blocking after reviewing a week of traffic"
  type        = bool
  default     = false
}

variable "waf_rate_limits" {
  description = "Per-source-IP requests per 60 seconds, independently scoped to each auth path"
  type        = object({ token = number, login = number, broker = number })
  default     = { token = 300, login = 200, broker = 200 }
  validation {
    condition     = alltrue([for limit in values(var.waf_rate_limits) : limit >= 10 && limit <= 2000000000 && floor(limit) == limit])
    error_message = "WAF limits must be whole numbers between 10 and 2 billion."
  }
}

variable "alarm_emails" {
  description = "Email subscribers to both severity topics; each subscription requires email confirmation"
  type        = list(string)
  default     = []
  validation {
    condition     = alltrue([for email in var.alarm_emails : can(regex("^[^@ ]+@[^@ ]+\\.[^@ ]+$", email))])
    error_message = "Supply valid email addresses."
  }
}

variable "login_error_threshold" {
  description = "Temporary LOGIN_ERROR count per 5 minutes; tune to five times measured 7-day baseline"
  type        = number
  default     = 100
}

variable "waf_block_threshold" {
  description = "Blocked requests per 5 minutes; calibrate after the count-mode observation week"
  type        = number
  default     = 100
}

variable "synthetic_signin_alarm_placeholder" {
  description = "Reserved only: no synthetic alarm is provisioned until a realm and scheduled sign-in publisher exist"
  type        = bool
  default     = false
  validation {
    condition     = !var.synthetic_signin_alarm_placeholder
    error_message = "Synthetic sign-in monitoring is not implemented; commission its publisher before enabling it."
  }
}

variable "enable_aws_backup" {
  description = "Enable daily Aurora snapshots and cross-region copies (off for low-cost staging)"
  type        = bool
  default     = false
}

variable "backup_copy_region" {
  description = "Cross-region AWS Backup destination in the same account"
  type        = string
  default     = "us-west-2"
  validation {
    condition     = var.backup_copy_region != var.aws_region && can(regex("^[a-z]{2}-[a-z]+-[0-9]+$", var.backup_copy_region))
    error_message = "Choose a valid region different from the source region."
  }
}

variable "tags" {
  description = "Additional tags; required platform tags take precedence"
  type        = map(string)
  default     = {}
}
