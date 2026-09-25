variable "aws_region" {
  description = "AWS region to deploy the enclave-host service into. Must match the region of the KMS key (kms_key_arn) and the VPC (vpc_id)."
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment. Controls tagging, the CloudWatch log group name, and which state file this module's backend config should point at."
  type        = string

  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "environment must be exactly 'staging' or 'production'."
  }
}

variable "vpc_id" {
  description = "ID of the existing VPC to deploy into. This module never creates a VPC."
  type        = string
}

variable "private_subnet_ids" {
  description = "Private subnet IDs (no route to an Internet Gateway) for the enclave-host ASG and internal NLB. Must span at least 2 distinct Availability Zones — enforced both by count here and by AZ diversity in network.tf's `check` block (which only runs during plan/apply, not validate)."
  type        = list(string)

  validation {
    condition     = length(var.private_subnet_ids) >= 2
    error_message = "private_subnet_ids must contain at least 2 subnet IDs (one per AZ, minimum 2 AZs) for ASG/NLB high availability."
  }
}

variable "lca_api_security_group_id" {
  description = "Security group ID attached to the lca-api Lambda's VPC ENIs. The ONLY principal allowed to reach the enclave-host API on port 8443."
  type        = string
}

variable "instance_type" {
  description = <<-EOT
    EC2 instance type for the enclave-host launch template. Must be at least
    '*.xlarge' (>= 4 vCPU): AWS Nitro Enclaves carves cpu_count vCPUs out of
    the instance exclusively for the enclave, so the parent OS + vsock-proxy
    + escrow-enclave-host supervisor need vCPUs left over on top of that. A
    2-vCPU instance (e.g. m6i.large) cannot host a 2-vCPU enclave — see
    .sisyphus/notepads/nitro-escrow-enclave/decisions.md D1.
  EOT
  type        = string
  default     = "m6i.xlarge"

  validation {
    condition     = !can(regex("\\.(nano|micro|small|medium|large)$", var.instance_type))
    error_message = "instance_type must not be '*.large' or smaller (nano/micro/small/medium/large all reject — these are <= 2 vCPU families). Use '*.xlarge' or bigger; default is m6i.xlarge. See decisions.md D1."
  }
}

variable "asg_min_size" {
  description = "Minimum number of enclave-host instances. Must stay >= 2 for AZ-level fault tolerance — escrow release fails closed if the enclave-host fleet is unreachable."
  type        = number
  default     = 2

  validation {
    condition     = var.asg_min_size >= 2
    error_message = "asg_min_size must be >= 2 (design requires >= 2 AZs of enclave-host capacity)."
  }
}

variable "asg_max_size" {
  description = "Maximum number of enclave-host instances the ASG may scale to."
  type        = number
  default     = 4

  validation {
    condition     = var.asg_max_size >= var.asg_min_size
    error_message = "asg_max_size must be >= asg_min_size."
  }
}

variable "enclave_cpu_count" {
  description = "vCPUs reserved exclusively for the Nitro Enclave (written to /etc/nitro_enclaves/allocator.yaml's cpu_count). Per decisions.md D1, this is 2 on an m6i.xlarge (4 vCPU total)."
  type        = number
  default     = 2

  validation {
    condition     = var.enclave_cpu_count >= 2
    error_message = "enclave_cpu_count must be >= 2 (AWS Nitro Enclaves requires at least 2 vCPUs for the enclave)."
  }
}

variable "enclave_memory_mib" {
  description = "MiB of memory reserved exclusively for the Nitro Enclave (written to /etc/nitro_enclaves/allocator.yaml's memory_mib)."
  type        = number
  default     = 2048

  validation {
    condition     = var.enclave_memory_mib >= 2048
    error_message = "enclave_memory_mib must be >= 2048 (AWS Nitro Enclaves minimum)."
  }
}

variable "eif_s3_uri" {
  description = "s3:// URI of the built + PCR-measured Enclave Image File (.eif) to run, e.g. s3://learncard-escrow-eif/escrow-enclave-v1.2.3.eif. Produced by the P2 reproducible-build pipeline; fetched by user-data via `aws s3 cp` at instance boot."
  type        = string

  validation {
    condition     = can(regex("^s3://[a-zA-Z0-9.\\-]{3,63}/.+\\.eif$", var.eif_s3_uri))
    error_message = "eif_s3_uri must look like s3://<bucket>/<key>.eif."
  }
}

variable "enclave_image_version" {
  description = "Version/tag identifier for the enclave image (e.g. a semver or git SHA), used to name the fetched EIF locally and stamped into the escrow-enclave-host unit's environment for observability."
  type        = string

  validation {
    condition     = length(var.enclave_image_version) > 0
    error_message = "enclave_image_version must not be empty."
  }
}

variable "kms_key_arn" {
  description = "ARN of the CMK (created in P3.2) whose key policy pins kms:RecipientAttestation:PCR0/1/2 to this enclave's measurements. Passed in for now — this module does not create or manage the key."
  type        = string

  validation {
    condition     = can(regex("^arn:aws[a-zA-Z-]*:kms:[a-z0-9-]+:[0-9]{12}:key/.+$", var.kms_key_arn))
    error_message = "kms_key_arn must be a full KMS key ARN, e.g. arn:aws:kms:us-east-1:123456789012:key/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx."
  }
}

variable "roughtime_servers" {
  description = "Pinned Roughtime servers the enclave-host's UDP relay forwards to (the enclave itself verifies each response's signature — the relay is untrusted, see decisions.md D2). Default is Cloudflare + Google; both must be present for the enclave's overlap-of-intervals check to have >= 2 independent sources."
  type = list(object({
    host = string
    port = number
  }))
  default = [
    { host = "roughtime.cloudflare.com", port = 2003 },
    { host = "roughtime.sandbox.google.com", port = 2002 },
  ]

  validation {
    condition     = length(var.roughtime_servers) >= 2
    error_message = "roughtime_servers must list at least 2 independent servers (time-source disagreement must be detectable — decisions.md D2)."
  }
}

variable "instance_profile_name" {
  description = "Name of the IAM instance profile (created in P3.2) to attach to enclave-host instances. Its role may only call kms:Decrypt under the RecipientAttestation condition, plus the DynamoDB ledger + S3 audit writes needed by the P3.3 parent binary. Passed in for now — this module does not create or manage IAM."
  type        = string
}

variable "cloudwatch_log_kms_key_arn" {
  description = "Optional CMK ARN to encrypt the escrow-enclave-host CloudWatch log group. Leave null to use CloudWatch's default encryption."
  type        = string
  default     = null
}

variable "tags" {
  description = "Extra tags merged onto every resource, on top of the fixed Project/ManagedBy/Environment tags this module always sets."
  type        = map(string)
  default     = {}
}
