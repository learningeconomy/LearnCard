# Authority Organizations guardrail

Separate **management-account** Terraform root. Do not run with member-account
`OrganizationAccountAccessRole`: that role cannot install an Organizations SCP.
`enable_enrollment_authority=false` creates nothing. Configure a security-owned
remote backend outside the escrow member account before real deployment; offline
verification uses `terraform init -backend=false` with an isolated `TF_DATA_DIR`.

When explicitly enabled, supply `account_id`, `environment`, and the exact
`admin_user_arns` already trusted by the bootstrap MFA `escrow-kms-admin` role.
The organization lookup rejects the management account and nonmember targets.
Organizations must have SCP support enabled; this module does not change the
organization's feature set or attach an organization-wide policy.

The attached deny-only SCP protects:

- The boundary itself: member-account `LeaveOrganization` is unconditionally
  denied. Offboarding requires a reviewed management-account removal.

- Writer/sender `CreateAccessKey`, `UpdateAccessKey`, `DeleteAccessKey` and IAM
  takeover paths, except the MFA-gated `escrow-kms-admin` role.
- Both dedicated users from console login profile creation/update, including by
  the provisioner. No console profile/access-key resource is managed by Terraform.
- The admin role's IAM configuration and the bootstrap MFA users from other
  account administrators. Human users keep their existing self-service policies;
  this SCP is not an Allow and does not grant one human access to another.
- All generation-named authority tables from nonwriter item access, standalone
  writes, PartiQL/batch/scan/query/export/TTL/Kinesis bypasses and nonadmin lifecycle or
  resource-policy changes. It also protects the credential artifacts bucket's
  policy/versioning/lifecycle configuration from nonadmins.
- The dedicated account's SES configuration/archiving and send APIs from everyone
  except the sender and MFA admin. Do not co-host unrelated SES workloads here.

The exception is the same-account role named exactly `escrow-kms-admin`. Its
existing trust requires MFA and age <3600 seconds. No per-request MFA check is
added to role sessions (AWS does not preserve that condition as true). Keep the
protected human list and role trust synchronized through two-person review.

Pass the resulting `authority_guardrail_policy_id` to the core stack only after
independent verification of policy content and attachment. The string receipt is
not a cryptographic proof. Management-account owners can change/remove SCPs and
remain trusted; the core stack cannot secure an SCP-exempt management account.
Admin restores require a new measured authority generation and reviewed continuity,
never rollback of the live authority. Key-policy rewrites remain the existing D10
break-glass risk, not an immutable boundary.

Tests mock all Organizations calls. They verify disabled counts, deny exceptions,
key-management actions, takeover protection and the 5120-byte SCP limit. A live
adversarial IAM evaluation is a separate deployment gate, not simulated by these
structural assertions.
