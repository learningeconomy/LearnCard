# Keycloak network foundation

Independent environment root: dedicated three-AZ VPC, public/private subnets, NAT,
S3 gateway endpoint, 14-day CloudWatch VPC flow logs, public delegated DNS zone,
two regional ACM certificates and private admin DNS zone. No ECS, databases, ALBs,
address records, realm configuration or Serverless resources are managed here.

Terraform >= 1.10; AWS provider `~> 6.0`; VPC module pinned to **6.7.3** (requires
AWS >= 6.28). The committed lockfile covers Linux amd64/arm64 and macOS arm64.
The old flat root remains on AWS `~> 5.0` until Phase 3.

## Prerequisites

1. Apply [account bootstrap](../../../aws/bootstrap/README.md) in the selected
   account, migrate its state, and record its state bucket and deploy role outputs.
   This root reads only
   `/learncard-keycloak/<env>/bootstrap/workload_boundary_arn` from SSM. It does not
   read other Terraform state. The flow-log role uses that boundary.
2. An approved deployment session for the selected account, or a human admin for
   initial commissioning. Account IDs are in the committed non-secret tfvars;
   provider `allowed_account_ids` and a caller-identity precondition reject wrong
   accounts. Backend authentication is separate: verify its bucket/key yourself.
3. GoDaddy access to `learncard.app`, and permission to add subzone NS records.
   Do not move the apex nameservers. Confirm no conflicting records/delegations
   exist at the selected auth name. Public CAA policy must allow Amazon issuance.
4. Confirm the configured three standard AZs are available in the selected
   account and the CIDRs do not conflict with intended future peering networks.
   No peering to the Serverless VPCs is needed or created.

## First apply and DNS delegation

Use a separate checkout/copy of this root for each environment. Never migrate
network state between accounts or keys. Only the default Terraform workspace is
supported. The following Bash commands run from this root. Set `TF_STATE_BUCKET`
to that account's **bootstrap output**, and authenticate outside Terraform using
short-lived credentials. No access keys are stored in the backend or tfvars.

### Staging

```bash
export AWS_PROFILE=learncard-staging-deploy
read -r -p 'Staging bootstrap state bucket: ' TF_STATE_BUCKET
terraform init -reconfigure \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=keycloak/staging/network.tfstate" \
  -backend-config="region=us-east-1"
terraform apply -var-file=environments/staging.tfvars \
  -var=wait_for_certificate_validation=false
terraform output public_zone_name_servers
```

At GoDaddy's **learncard.app** zone, add an NS record set with name **auth.staging**
and all four nameservers from this output. Do not add `admin` A/AAAA/CNAME aliases
or delegate its private zone. Once delegation has propagated:

```bash
terraform apply -var-file=environments/staging.tfvars
```

### Production (in its separate directory)

```bash
export AWS_PROFILE=learncard-production-deploy
read -r -p 'Production bootstrap state bucket: ' TF_STATE_BUCKET
terraform init -reconfigure \
  -backend-config="bucket=$TF_STATE_BUCKET" \
  -backend-config="key=keycloak/production/network.tfstate" \
  -backend-config="region=us-east-1"
terraform apply -var-file=environments/production.tfvars \
  -var=wait_for_certificate_validation=false
terraform output public_zone_name_servers
```

At GoDaddy add the NS set named **auth**, with all four production nameservers.
After delegation propagates:

```bash
terraform apply -var-file=environments/production.tfvars
```

Validation defaults to true on the second and all subsequent runs. Do not persist
the first-apply override in tfvars. The first run creates validation CNAMEs in the
**public** auth zone for both certs without waiting for NS delegation; its cert
ARN outputs and SSM values may still represent pending certs. **Do not apply the
service root until the second network apply succeeds**. The validation resource
waits for ACM issuance; verify both certificates show ISSUED in the console.
Leave validation CNAMEs in place for automatic renewals.

Public DNS contains only zone NS/SOA and ACM validation CNAMEs at this phase.
The private zone `admin.<auth-host>` is attached only to this VPC; Phase 3 adds
its internal ALB alias. The public auth alias is also deferred to Phase 3.
Public certificates expose the admin hostname in certificate transparency; private
DNS/reachability, not secrecy of the hostname, is the security boundary.

## Inputs

| Input                             | Contract                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------------- |
| `environment`                     | Required staging or production                                                     |
| `expected_account_id`             | Required account ID from env tfvars                                                |
| `aws_region`                      | us-east-1 default                                                                  |
| `auth_hostname`                   | `auth.staging.learncard.app` / `auth.learncard.app`, validated against environment |
| `vpc_cidr`                        | Canonical IPv4 /16; tfvars use 10.80.0.0/16 / 10.81.0.0/16                         |
| `availability_zones`              | Exactly three distinct standard AZs in the selected region                         |
| `single_nat_gateway`              | true staging, false production; production true rejected                           |
| `wait_for_certificate_validation` | true; false only before first DNS delegation                                       |

Public /24s use subnet numbers 0,1,2; private /24s use 10,11,12, in AZ input order.
Production has one NAT per AZ. Staging's single NAT is cheaper but introduces an
AZ dependency and potentially cross-AZ charges. S3 traffic uses a gateway endpoint
on both public and private route tables; other APIs/IdPs use NAT. No interface
endpoints are provisioned. The VPC's default SG/route table/NACL are not adopted,
avoiding mutation of untagged AWS-created resources. Explicit route tables and
later explicit workload SGs are used. All six subnets use the unmanaged default
NACL with its AWS-created allow rules; out-of-band NACL changes affect workloads.

## Outputs and stable SSM contract

Each row is both a Terraform output and an SSM parameter, prefixed exactly with
`/learncard-keycloak/<env>/network/`. These names are the Phase 3 service contract.
Read list parameters with `split(",", data.aws_ssm_parameter.<name>.value)`;
Terraform list outputs remain native lists. Values are non-secret identifiers.

| Suffix / output            | SSM type   | Meaning                            |
| -------------------------- | ---------- | ---------------------------------- |
| `vpc_id`                   | String     | Dedicated VPC                      |
| `private_subnet_ids`       | StringList | Three private subnet IDs, AZ order |
| `public_subnet_ids`        | StringList | Three public subnet IDs, AZ order  |
| `public_zone_id`           | String     | Public auth zone ID                |
| `public_zone_name_servers` | StringList | Four GoDaddy delegation targets    |
| `auth_certificate_arn`     | String     | Regional auth certificate ARN      |
| `admin_certificate_arn`    | String     | Regional admin certificate ARN     |
| `private_zone_id`          | String     | VPC-associated admin zone ID       |
| `auth_hostname`            | String     | Shared public auth hostname        |
| `admin_hostname`           | String     | Private admin hostname             |

## Operations, checks and references

The public zone has `prevent_destroy`; intentional replacement needs review and
a coordinated parent delegation change. This is not protection against console/API
deletion. VPC/NAT removal interrupts all downstream services; destroy consumers
first and review dependencies. Never remove the public validation records on a
live environment. Flow logs retain 14 days; account admins own longer retention
or central export requirements.

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
tflint --init && tflint
terraform providers lock -platform=linux_amd64 -platform=linux_arm64 -platform=darwin_arm64
```

Offline checks do not test IAM authorization, DNS propagation, quota availability
or live provisioning. The first human staging apply must verify those; no cloud
apply is part of this change. Follow-up CI integration belongs to Phase 3.

Argument references: [VPC 6.7.3](https://github.com/terraform-aws-modules/terraform-aws-vpc/tree/v6.7.3),
[AWS 6.66.0 resources](https://github.com/hashicorp/terraform-provider-aws/tree/v6.66.0/website/docs/r)
(`vpc_endpoint`, `route53_zone`, `route53_record`, `acm_certificate`,
`acm_certificate_validation`, `ssm_parameter`), and
[S3 backend](https://developer.hashicorp.com/terraform/language/backend/s3).
