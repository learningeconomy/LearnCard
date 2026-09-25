# Terraform override-file semantics replace ONLY policy on the existing resource.
# This preserves its name/ARN/state and avoids editing the shared boundary file.
# The merged document retains every original statement and adds Backup-role-only
# permissions. This file MUST accompany deploy-observability.tf in bootstrap copies.
resource "aws_iam_policy" "workload_boundary" {
  policy = data.aws_iam_policy_document.observability_workload_boundary.json
}
