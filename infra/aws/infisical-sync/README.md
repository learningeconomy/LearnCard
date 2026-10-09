# Infisical AWS Secrets Manager sync role

Human-admin-owned root that provisions the single IAM role the hosted Infisical
US instance assumes to push application secrets into AWS Secrets Manager. It
creates one role and one inline policy. It does not create, read, or delete any
secret values itself, and it manages no other infrastructure.

Terraform >= 1.10; AWS provider `~> 6.0` (exact version in the committed
three-platform lockfile). Applied in the account that owns the synced secrets
(`206533012615`, us-east-1).

## What it grants

Infisical authenticates by assuming `learncard-infisical-sync-<env>` from its
shared AWS account root (`arn:aws:iam::381492033652:root`). The trust policy
requires `sts:ExternalId` to equal the Infisical **project ID**, which blocks the
confused-deputy problem: the shared Infisical account cannot assume this role for
any project other than the one whose ID it presents.

The attached inline policy allows exactly:

- `secretsmanager:ListSecrets` and `secretsmanager:BatchGetSecretValue` on `*`.
  These two actions do not support resource-level scoping; `ListSecrets` exposes
  no secret values.
- `secretsmanager:GetSecretValue`, `CreateSecret`, `UpdateSecret`,
  `PutSecretValue`, `DescribeSecret`, `TagResource`, and `UntagResource`, scoped
  to this account/region secrets named
  `lca-api/*/runtime-secrets-*`, `brain-service/*/runtime-secrets-*`, and
  `learn-cloud-service/*/runtime-secrets-*`.

## Disable Secret Deletion

Enable Infisical's **Disable Secret Deletion** option on every sync integration.

This role deliberately has **no** `secretsmanager:DeleteSecret` (nor
`DeleteResourcePolicy` or other destructive actions). Infisical can create and
update the runtime secrets it manages but can never delete them. Secret deletion
remains a manual, human-reviewed operation performed with a separate privileged
session. Do not add `DeleteSecret` to this policy to "clean up" synced secrets;
schedule deletion out of band instead. Removing this restriction would let a
compromise of the shared Infisical account destroy production runtime secrets.

## Inputs

| Input                         | Default / purpose                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `environment`                 | Required: staging or production                                                                                                                         |
| `expected_account_id`         | Required, 12 digits; per-env file; provider allowlist and resource precondition                                                                         |
| `aws_region`                  | us-east-1; region holding the synced secrets                                                                                                            |
| `infisical_aws_principal_arn` | `arn:aws:iam::381492033652:root` (Infisical US); the assuming principal                                                                                 |
| `infisical_project_id`        | Required; the Infisical project ID used as the `sts:ExternalId` guard (not secret, but supply via `TF_VAR_infisical_project_id` rather than committing) |

## Outputs

| Output                    | Meaning                                                                |
| ------------------------- | ---------------------------------------------------------------------- |
| `infisical_sync_role_arn` | Role ARN to paste into the Infisical AWS Secrets Manager sync settings |

## Offline checks and references

```bash
terraform fmt -check -recursive
terraform init -backend=false
terraform validate
tflint --init && tflint
terraform providers lock -platform=linux_amd64 -platform=linux_arm64 -platform=darwin_arm64
```

Offline checks do not test IAM authorization or live secret access; a human must
confirm the Infisical sync connects and that denials (notably any delete attempt)
behave as intended. No cloud apply is part of this change.

Argument references: [AWS 6.66.0 resources](https://github.com/hashicorp/terraform-provider-aws/tree/v6.66.0/website/docs/r)
(`iam_role`, `iam_role_policy`) and
[Infisical AWS Secrets Manager sync](https://infisical.com/docs/integrations/secret-syncs/aws-secrets-manager).
The account guard checks provider identity, not the backend; independently verify
the backend bucket/account/key before init.
