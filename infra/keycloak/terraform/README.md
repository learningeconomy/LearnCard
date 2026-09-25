# Keycloak Terraform roots

Each directory is an independent root with its own state and committed environment
tfvars. Do not run Terraform in this index directory. Cross-root discovery uses
SSM, never `terraform_remote_state`.

| Root                                               | Ownership                                                            |
| -------------------------------------------------- | -------------------------------------------------------------------- |
| [Account bootstrap](../../aws/bootstrap/README.md) | Human-admin state bucket, OIDC roles/boundary, ECR, budgets          |
| [Network](network/README.md)                       | VPC, subnets, NAT, flow logs, delegated zones and certificates       |
| [Service](service/README.md)                       | ARM64 ECS, Aurora, public/private ALBs, realm runner and access task |
| [Realm](realm/README.md)                           | Keycloak realms/clients/IdPs, applied privately through CodeBuild    |

First apply: **bootstrap → network (certificate wait off) → GoDaddy NS delegation →
network re-apply (certificate wait on) → service → realm → automation bootstrap**.
Use separate directories and account sessions for staging and production.

Terraform >= 1.10 with S3-native locking; CI pins 1.15.8. All AWS roots use provider
6.x and committed three-platform lockfiles. There are no DynamoDB lock tables.
The old flat root was never applied; its service files were moved without a state
migration. Read the service runbook's unresolved rotation and live private-access
gates before deployment, and the realm runbook's local hostname proof. Image
promotion and production user cutover remain separate workstreams.
