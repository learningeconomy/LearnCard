variable "aws_region" {
  description = "AWS region to deploy the enclave-host service into. Must match the region of the VPC (vpc_id). The escrow CMK (kms.tf) and ledger tables (ledger.tf) are created in this same region/module."
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
    services/escrow-enclave-app/SECURITY.md#design-decisions D1.
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

variable "sealed_key_object" {
  description = <<-EOT
    S3 key (within the artifacts bucket, storage.tf) the escrow-enclave-host
    parent reads/writes the KMS-sealed escrow key at (ESCROW_SEALED_KEY_OBJECT
    in the templated systemd unit, compute.tf). Must start with the
    "sealed-keys/" prefix — the only prefix iam.tf's WriteSealedKey statement
    grants s3:PutObject on, and the only prefix storage.tf's bucket policy
    enforces create-only (conditional s3:if-none-match) writes against.
    services/escrow-enclave-host/src/main.rs independently enforces this same
    prefix at application startup (fails closed otherwise), so a value here
    that violated it would never actually be writable in AWS either way.
  EOT
  type        = string
  default     = "sealed-keys/escrow-enclave-key-v1"

  validation {
    condition     = startswith(var.sealed_key_object, "sealed-keys/")
    error_message = "sealed_key_object must start with 'sealed-keys/' — the only prefix granted s3:PutObject (iam.tf) and enforced create-only (storage.tf)."
  }
}

variable "enclave_measurements" {
  description = <<-EOT
    Pinned Nitro Enclave measurement tuples this environment's escrow CMK
    key policy (kms.tf) trusts for kms:Decrypt. kms.tf generates ONE
    key-policy statement per tuple, each conditioned on ALL THREE of that
    tuple's PCR0/1/2 values matching simultaneously — never as independent
    per-PCR arrays across tuples, which would allow cross-combination
    measurements that were never actually built or published (decisions.md
    D7).

    1 entry  = a single pinned build.
    2 entries = N (currently deployed) + N+1 (next, mid-rotation).
    3 entries = N-1/N/N+1, only during an active rotation window; remove
                the oldest as soon as the rotation completes.

    See README.md's "Measurement rotation (N / N+1)" section and
    escrow-measurements.tfvars.example.
  EOT

  type = list(object({
    label = string
    pcr0  = string
    pcr1  = string
    pcr2  = string
  }))

  validation {
    condition     = length(var.enclave_measurements) >= 1 && length(var.enclave_measurements) <= 3
    error_message = "enclave_measurements must contain 1 to 3 tuples (N, optionally N+1, and at most one extra N-1/N+2 during an active rotation window)."
  }

  validation {
    condition = alltrue([
      for m in var.enclave_measurements :
      can(regex("^[0-9a-fA-F]{96}$", m.pcr0)) &&
      can(regex("^[0-9a-fA-F]{96}$", m.pcr1)) &&
      can(regex("^[0-9a-fA-F]{96}$", m.pcr2))
    ])
    error_message = "Every pcr0/pcr1/pcr2 value must be exactly 96 hex characters (a SHA384 digest, as emitted by `nitro-cli describe-eif`/`describe-enclaves`)."
  }

  validation {
    condition     = length(distinct([for m in var.enclave_measurements : m.label])) == length(var.enclave_measurements)
    error_message = "enclave_measurements labels must be unique — kms.tf's dynamic block keys its statements by label, so a duplicate label would silently collapse two tuples into one."
  }
}

variable "kms_admin_role_arn" {
  description = <<-EOT
    ARN of the dedicated escrow-kms-admin IAM role. That role is created
    OUTSIDE this module (e.g. a security-team-owned Terraform stack, or
    hand-created) and only referenced here by ARN. It is the sole
    non-root principal allowed to administer the escrow CMK's
    lifecycle/policy/tags (kms.tf) — deliberately NOT granted kms:Decrypt
    or kms:Encrypt. Key-policy edits additionally require an
    MFA-authenticated session; see README.md's two-person approval
    procedure.
  EOT
  type        = string

  validation {
    condition     = can(regex("^arn:aws[a-zA-Z-]*:iam::[0-9]{12}:role/.+$", var.kms_admin_role_arn))
    error_message = "kms_admin_role_arn must be a full IAM role ARN, e.g. arn:aws:iam::123456789012:role/escrow-kms-admin."
  }
}

variable "audit_retention_days" {
  description = <<-EOT
    S3 Object Lock COMPLIANCE-mode default retention period, in days, for
    the audit bucket (storage.tf). Default 2555 (~7 years). COMPLIANCE mode
    means NO principal — including the account root and escrow-kms-admin —
    can shorten, remove, or delete-before-expiry an object under this
    retention once written. Choose deliberately; this is not reversible
    per-object.
  EOT
  type        = number
  default     = 2555

  validation {
    condition     = var.audit_retention_days >= 1
    error_message = "audit_retention_days must be >= 1."
  }
}

variable "enable_ssm" {
  description = "Attach the AWS-managed AmazonSSMManagedInstanceCore policy to the enclave-host role, enabling Session Manager access (no SSH key/bastion needed). Off by default; enable per-environment for ops access."
  type        = bool
  default     = false
}

variable "ledger_monitor_sns_topic_arn" {
  description = "ARN of an SNS topic the escrow-ledger-monitor Lambda (P7.1 — its function is not created by this module, only its IAM role) publishes chain-mismatch/divergence alarms to. Leave null to omit the sns:Publish grant, e.g. before the topic exists yet."
  type        = string
  default     = null

  validation {
    condition     = var.ledger_monitor_sns_topic_arn == null || can(regex("^arn:aws[a-zA-Z-]*:sns:[a-z0-9-]+:[0-9]{12}:.+$", var.ledger_monitor_sns_topic_arn))
    error_message = "ledger_monitor_sns_topic_arn must be a full SNS topic ARN, or null."
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
  description = <<-EOT
    Optional override: name of an EXTERNALLY managed IAM instance profile to
    attach to enclave-host instances instead of the one this module creates
    (aws_iam_instance_profile.enclave_host in iam.tf). Leave null (the
    default) to use the created profile — that is the normal path for every
    real environment. An override only exists for a break-glass/staging
    scenario using a hand-created profile before iam.tf's role exists in a
    given account.
  EOT
  type        = string
  default     = null
}

variable "cloudwatch_log_kms_key_arn" {
  description = "Optional CMK ARN to encrypt the escrow-enclave-host CloudWatch log group. Leave null to use CloudWatch's default encryption."
  type        = string
  default     = null
}

# -----------------------------------------------------------------------
# M2: escrow-enclave-host parent binary deployment (host_binary_*) and its
# runtime configuration (escrow_*, host_bearer_token_*, host_tls_*) —
# templates/user-data.sh.tftpl downloads, verifies, installs, and launches
# the actual services/escrow-enclave-host binary instead of the old
# placeholder unit.
# -----------------------------------------------------------------------

variable "host_binary_s3_uri" {
  description = <<-EOT
    s3:// URI of the built escrow-enclave-host parent binary, e.g.
    s3://learncard-escrow-eif/escrow-enclave-host-v1.2.3. Must live in the
    same artifacts bucket this module creates (storage.tf) — iam.tf's
    ReadEifArtifacts statement grants s3:GetObject bucket-wide on that
    bucket, which already covers this object.
  EOT
  type        = string

  validation {
    condition     = can(regex("^s3://[a-zA-Z0-9.\\-]{3,63}/.+$", var.host_binary_s3_uri))
    error_message = "host_binary_s3_uri must look like s3://<bucket>/<key>."
  }
}

variable "host_binary_sha256" {
  description = "Required SHA-256 digest (64 lowercase/uppercase hex characters) of the host_binary_s3_uri object. user-data verifies the downloaded binary against this digest with `sha256sum -c` and aborts the boot (never starts the service) on any mismatch — this is the only integrity check on the parent binary before it runs as root."
  type        = string

  validation {
    condition     = can(regex("^[0-9a-fA-F]{64}$", var.host_binary_sha256))
    error_message = "host_binary_sha256 must be exactly 64 hex characters (a SHA-256 digest)."
  }
}

variable "escrow_key_id" {
  description = "Logical escrow key identifier (services/escrow-enclave-host's ESCROW_KEY_ID / services/escrow-enclave-app's KMS encryption-context \"keyId\"). Stable across measurement rotations (decisions.md D18) — changes only via deliberate key rotation or lost-sealed-key recovery, never on a routine enclave image update."
  type        = string

  validation {
    condition     = can(regex("^[A-Za-z0-9._-]{1,128}$", var.escrow_key_id))
    error_message = "escrow_key_id must be 1-128 characters of letters, digits, '.', '_', or '-'."
  }
}

variable "escrow_previous_key_ids" {
  description = "Up to 3 previous ESCROW_KEY_ID values the host will still accept during a deliberate key rotation or lost-sealed-key recovery (P9.1). Must be the same length as escrow_previous_key_objects (paired by index). Leave empty outside an active rotation window."
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.escrow_previous_key_ids) <= 3
    error_message = "escrow_previous_key_ids must contain at most 3 entries."
  }
}

variable "escrow_previous_key_objects" {
  description = "S3 object keys (within the artifacts bucket) holding the sealed key material for each entry in escrow_previous_key_ids, in the same order. Each must start with 'sealed-keys/' — the only prefix granted read/list access (iam.tf) — matching sealed_key_object's own requirement."
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.escrow_previous_key_objects) == length(var.escrow_previous_key_ids)
    error_message = "escrow_previous_key_objects must have exactly as many entries as escrow_previous_key_ids (paired by index)."
  }

  validation {
    condition     = alltrue([for o in var.escrow_previous_key_objects : startswith(o, "sealed-keys/")])
    error_message = "Every escrow_previous_key_objects entry must start with 'sealed-keys/'."
  }
}

variable "escrow_allow_first_boot" {
  description = <<-EOT
    Sets ESCROW_ALLOW_FIRST_BOOT on the host. Must be `true` only during the
    initial provisioning boot (the one time no sealed key object exists yet
    at sealed_key_object) — the host README is explicit that even then only
    S3's specific NoSuchKey result permits generating a new key; any other
    error (including access/transport errors) still fails closed. Flip back
    to `false` and roll the ASG once the first sealed-key object exists, so
    a later accidental deletion of that object can never silently trigger
    regeneration of a NEW escrow key under the same alias.
  EOT
  type        = bool
  default     = false
}

variable "host_bearer_token_parameter_name" {
  description = "Absolute SSM Parameter Store name (SecureString) holding the bearer token lca-api must present to the host's 8443 API (ESCROW_ENCLAVE_TOKEN_FILE, fetched by user-data and written to a root-only local file — never passed as a plain environment variable). Provisioned outside this module; only referenced here by name for the read-only IAM grant (iam.tf) and user-data's `aws ssm get-parameter --with-decryption` call."
  type        = string

  validation {
    condition     = startswith(var.host_bearer_token_parameter_name, "/")
    error_message = "host_bearer_token_parameter_name must be an absolute SSM parameter path."
  }
}

variable "host_tls_certificate_parameter_name" {
  description = "Absolute SSM Parameter Store name (SecureString) holding the PEM-encoded TLS certificate the host serves on 8443 (ESCROW_ENCLAVE_TLS_CERT). Provisioned outside this module; only referenced here by name."
  type        = string

  validation {
    condition     = startswith(var.host_tls_certificate_parameter_name, "/")
    error_message = "host_tls_certificate_parameter_name must be an absolute SSM parameter path."
  }
}

variable "host_tls_private_key_parameter_name" {
  description = "Absolute SSM Parameter Store name (SecureString) holding the PEM-encoded TLS private key paired with host_tls_certificate_parameter_name (ESCROW_ENCLAVE_TLS_KEY). Provisioned outside this module; only referenced here by name."
  type        = string

  validation {
    condition     = startswith(var.host_tls_private_key_parameter_name, "/")
    error_message = "host_tls_private_key_parameter_name must be an absolute SSM parameter path."
  }
}

variable "tags" {
  description = "Extra tags merged onto every resource, on top of the fixed Project/ManagedBy/Environment tags this module always sets."
  type        = map(string)
  default     = {}
}
