# infra/escrow-enclave

Terraform for the **enclave-host** service that will run the escrow-recovery
Nitro Enclave (P3.1 of `.sisyphus/plans/nitro-escrow-enclave.md`). lca-api
stays on Lambda; this stack provisions the EC2/ASG/NLB substrate the Lambda
talks to over the private network.

## What this provisions

- Private-subnet `aws_launch_template` (AL2023, `enclave_options.enabled`,
  IMDSv2-only, encrypted EBS, no public IP, no SSH key) with user-data that
  installs `aws-nitro-enclaves-cli`, configures the allocator
  (`cpu_count`/`memory_mib`), configures a `vsock-proxy` allowlisted to KMS
  only, fetches the `.eif` from S3, and wires up (but does not start) a
  placeholder `escrow-enclave-host.service` for the P3.3 parent binary.
- `aws_autoscaling_group` (min 2, across the subnets you pass in) with
  `health_check_type = "ELB"` and a rolling `instance_refresh`.
- Internal `aws_lb` (Network Load Balancer, TCP :8443) + target group with a
  TCP health check on a **separate** port (:8444).
- One security group: ingress 8443 only from `lca_api_security_group_id`,
  ingress 8444 only from the VPC CIDR (NLB health-check source), egress 443
  (KMS/S3/DynamoDB) and UDP to the configured Roughtime ports.
- `aws_cloudwatch_log_group` at `/learncard/escrow-enclave-host/<environment>`,
  365-day retention.

## What this does NOT provision (P3.2, separate)

- The KMS CMK (with the `kms:RecipientAttestation:PCR0/1/2` key-policy
  conditions) — pass its ARN in via `kms_key_arn`.
- The IAM role/instance profile — pass its name in via
  `instance_profile_name`. Per decisions.md D7, that role must be scoped to
  `kms:Decrypt` under the attestation condition plus the DynamoDB
  ledger/S3 audit permissions the P3.3 parent binary needs — nothing more.
- The S3 bucket holding the `.eif` (referenced by `eif_s3_uri`), the DynamoDB
  ledger tables, and the S3 Object Lock audit bucket.

## Inputs

See `variables.tf` for full descriptions/validation. Notable ones:

| Variable                                | Notes                                                                                                                                             |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `instance_type`                         | Default `m6i.xlarge`. Validation rejects `*.large` and smaller — a 2-vCPU instance cannot host a 2-vCPU enclave (decisions.md D1).                |
| `private_subnet_ids`                    | >= 2 required by variable validation; a `check` block (plan/apply only) also asserts they span >= 2 distinct AZs and have no public IP on launch. |
| `kms_key_arn` / `instance_profile_name` | Placeholders until P3.2 lands — pass in ARNs/names from that stack's outputs (or hand-created interim values for a staging spike).                |
| `roughtime_servers`                     | Defaults to Cloudflare + Google per decisions.md D2. Must have >= 2 entries.                                                                      |

## Apply procedure (manual/CI — not run by this task)

```bash
cd infra/escrow-enclave
terraform init \
  -backend-config="bucket=<state-bucket>" \
  -backend-config="key=escrow-enclave/<environment>/terraform.tfstate" \
  -backend-config="region=<region>" \
  -backend-config="dynamodb_table=<lock-table>"
terraform plan  -var-file=<environment>.tfvars
terraform apply -var-file=<environment>.tfvars
```

`terraform apply` and the resulting staging attestation check (confirming the
enclave-host actually serves a real Nitro attestation document, not the
software-mode stub) are **manual/CI verification steps** — this task does
not and cannot run them (no AWS credentials available in this environment,
and per the plan's Accept criteria for P3, that verification belongs to a
later step once P3.2/P3.3 exist to make the ASG's instances actually pass
their health check).

## Local verification (what this task DOES do)

No AWS credentials required:

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
```

## Operational notes

- **VPC endpoints recommended.** The security group's egress to 443 is
  `0.0.0.0/0` because this module doesn't assume Interface/Gateway VPC
  endpoints exist for KMS/S3/DynamoDB in the target VPC. If they do (or once
  P3.2 adds them), tightening egress to the endpoint's SG/prefix list is a
  safe follow-up — it does not require touching this module's inputs.
- **Roughtime egress is inherently broad.** `roughtime.cloudflare.com` and
  `roughtime.sandbox.google.com` don't have stable IPs a security group can
  pin, so UDP egress to their ports is `0.0.0.0/0`. The enclave verifies each
  response's signature itself (decisions.md D2), so the relay path being
  network-open is an accepted, documented tradeoff, not an oversight.
- **The ASG will not pass its health check until P3.3 ships.** The
  `escrow-enclave-host.service` placeholder unit is enabled but not started
  by user-data (its `ExecStart` binary doesn't exist yet), so nothing listens
  on 8444 out of the box. That's expected for this infra-only change.
