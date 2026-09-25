# =============================================================================
# escrow-enclave — KMS CMK for the escrow private key (P3.2)
#
# This is THE security boundary of the whole design (decisions.md D7): the
# enclave-host EC2 role can call kms:Decrypt, but AWS KMS itself refuses the
# call unless it carries a signed Nitro attestation document whose
# PCR0/PCR1/PCR2 match one of the pinned measurement tuples below. There is
# no path — not the admin role, not lca-api (never named in this policy at
# all), not even the account root — to plaintext Decrypt without a matching
# attestation. See statements 5–8 (DenyCreateGrant,
# DenyDecryptWithoutAttestation, and the two debug-mode-PCR denies) — a
# present-but-all-zero (debug-mode) attestation document is NOT the same
# thing as "no attestation", which is why there are four denies, not one.
#
# Deliberately NOT done here: creating the escrow-kms-admin IAM role/user
# itself. That role is expected to be owned by a separate,
# security-team-controlled process (or hand-created) and is only referenced
# here by ARN (var.kms_admin_role_arn) — see README.md's two-person
# key-policy change procedure.
# =============================================================================

data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

locals {
  # Non-cryptographic KMS management actions, EXPLICITLY ENUMERATED — no
  # wildcards. Two reasons, not one:
  #   1. A wildcard like kms:Get*/kms:List*/kms:Put* silently absorbs any
  #      future AWS API addition under that prefix with no PR diff to
  #      review — the whole point of building this policy from
  #      aws_iam_policy_document (README's two-person procedure) is that a
  #      reviewer can see every granted action named explicitly.
  #   2. kms:Create* included kms:CreateGrant, which was a REAL bypass of
  #      the attestation gate, not a hypothetical one (caught in review):
  #      a grant can Allow kms:Decrypt with NO PCR condition at all, and a
  #      caller could satisfy DenyDecryptWithoutAttestation (statement 6)
  #      trivially by presenting a debug-mode enclave's attestation
  #      document — debug mode DOES produce a real, present attestation
  #      document, just one whose PCR0/PCR1/PCR2/ImageSha384 are all-zero.
  #      "an attestation was provided" is therefore NOT a sufficient gate
  #      by itself. kms:CreateGrant is excluded from this list entirely AND
  #      explicitly denied for every principal, unconditionally (statement
  #      5, DenyCreateGrant) — belt AND suspenders, so a future edit that
  #      accidentally re-added it here would still be blocked by the Deny.
  #   kms:RevokeGrant/kms:RetireGrant/kms:ListGrants are kept ("for
  #   cleanup"): they only ever remove or enumerate existing grants, never
  #   create one, so they cannot reopen this path.
  kms_admin_actions = [
    "kms:CancelKeyDeletion",
    "kms:CreateAlias",
    "kms:DeleteAlias",
    "kms:DescribeKey",
    "kms:DisableKey",
    "kms:DisableKeyRotation",
    "kms:EnableKey",
    "kms:EnableKeyRotation",
    "kms:GetKeyPolicy",
    "kms:GetKeyRotationStatus",
    "kms:ListAliases",
    "kms:ListGrants",
    "kms:ListKeyPolicies",
    "kms:ListResourceTags",
    "kms:PutKeyPolicy",
    "kms:RetireGrant",
    "kms:RevokeGrant",
    "kms:ScheduleKeyDeletion",
    "kms:TagResource",
    "kms:UntagResource",
    "kms:UpdateAlias",
    "kms:UpdateKeyDescription",
  ]

  # The exact PCR0/PCR1/PCR2/ImageSha384 value AWS Nitro Enclaves reports
  # for a DEBUG-mode enclave (96 hex chars = SHA384-digest width, all
  # zero) — see statements 7/8. A debug attestation document is real and
  # signed, so it is NOT caught by the "no attestation at all" Null check
  # in statement 6; it must be rejected by matching this specific value.
  debug_enclave_zero_measurement = "000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000"

  # Keyed by label (uniqueness enforced by variables.tf's validation) so the
  # dynamic "statement" block below can never silently collapse two
  # measurement tuples into one key-policy statement.
  enclave_measurements_by_label = { for m in var.enclave_measurements : m.label => m }
}

data "aws_iam_policy_document" "escrow_kms_key_policy" {
  # ---------------------------------------------------------------------
  # 1. Root account break-glass — the SAME narrow non-crypto admin action
  #    list as statement 2, NOT AWS's usual "Enable IAM User Permissions"
  #    kms:* default template. Purpose is only to avoid permanently
  #    locking the key if kms_admin_role_arn is ever deleted or
  #    misconfigured: because this key policy has no IAM-delegation
  #    statement, it is the ONLY authorization source for every action on
  #    this key (see statement 2's note), so SOMEONE must always retain
  #    kms:PutKeyPolicy or the key becomes unmanageable forever.
  #    Tradeoff: AWS's default kms:* root statement is strictly more
  #    convenient (any future IAM policy could delegate access to anyone),
  #    but would mean a compromised or over-permissioned root/IAM-admin
  #    session could grant itself Decrypt via an ordinary IAM identity
  #    policy alone, with no key-policy change and thus no two-person
  #    review required. We deliberately give up that convenience here;
  #    revisit only with explicit written sign-off.
  # ---------------------------------------------------------------------
  statement {
    sid    = "RootAccountBreakGlassAdministration"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = ["arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"]
    }

    actions   = local.kms_admin_actions
    resources = ["*"]
  }

  # ---------------------------------------------------------------------
  # 2. Dedicated escrow-kms-admin role — the intended day-to-day path for
  #    key administration. Because this key policy does NOT include a
  #    blanket "Enable IAM User Permissions" (kms:*) statement, IAM
  #    identity policies attached elsewhere in the account CANNOT grant
  #    any principal — including lca-api's Lambda execution role —
  #    kms:Decrypt or kms:Encrypt on this specific key. This key policy is
  #    the sole authorization source for those two actions. That is what
  #    makes "no lca-api access" an actual standing invariant rather than
  #    a point-in-time fact some unrelated future IAM change could quietly
  #    break.
  # ---------------------------------------------------------------------
  statement {
    sid    = "EscrowKmsAdminManagement"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [var.kms_admin_role_arn]
    }

    actions   = local.kms_admin_actions
    resources = ["*"]
  }

  # ---------------------------------------------------------------------
  # 3. Decrypt — ONE statement PER measurement tuple (decisions.md D7).
  #    Three separate `condition` blocks inside a single `statement` are
  #    ANDed together by IAM, so a request must match THIS tuple's PCR0
  #    AND PCR1 AND PCR2 simultaneously. Using one array-valued condition
  #    per PCR key shared across ALL tuples instead (e.g. a single
  #    statement with PCR0 IN [tupleA.pcr0, tupleB.pcr0] AND PCR1 IN
  #    [tupleA.pcr1, tupleB.pcr1] ...) would let a request mix PCR0 from
  #    tuple A with PCR1 from tuple B — a measurement combination that was
  #    never actually built or published. Debug-mode enclaves report
  #    all-zero PCRs and can never match a real (non-zero) pinned tuple.
  # ---------------------------------------------------------------------
  dynamic "statement" {
    for_each = local.enclave_measurements_by_label

    content {
      sid    = "AllowDecryptForMeasurement${replace(statement.value.label, "/[^a-zA-Z0-9]/", "")}"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = [aws_iam_role.enclave_host.arn]
      }

      actions   = ["kms:Decrypt"]
      resources = ["*"]

      condition {
        test     = "StringEqualsIgnoreCase"
        variable = "kms:RecipientAttestation:PCR0"
        values   = [statement.value.pcr0]
      }

      condition {
        test     = "StringEqualsIgnoreCase"
        variable = "kms:RecipientAttestation:PCR1"
        values   = [statement.value.pcr1]
      }

      condition {
        test     = "StringEqualsIgnoreCase"
        variable = "kms:RecipientAttestation:PCR2"
        values   = [statement.value.pcr2]
      }
    }
  }

  # ---------------------------------------------------------------------
  # 4. Encrypt — first-boot sealing of the freshly generated escrow private
  #    key, BEFORE any attestation-conditioned Decrypt grant is even
  #    relevant (the enclave has no sealed key to decrypt yet). AWS KMS's
  #    Encrypt API has no `Recipient` parameter at all — attestation
  #    conditions (kms:RecipientAttestation:*) are only ever evaluated for
  #    Decrypt, DeriveSharedSecret, GenerateDataKey, GenerateDataKeyPair,
  #    and GenerateRandom (confirmed against AWS's Nitro Enclaves KMS
  #    documentation) — so PCR conditions cannot gate Encrypt. Instead we
  #    condition on an encryption-context marker the enclave must supply.
  #    Net effect: the host role can always CREATE a ciphertext blob under
  #    this key (even a compromised host), but per statement 3 it can only
  #    ever DECRYPT one back out while presenting a valid attestation for a
  #    pinned measurement — a host that encrypts garbage, or replays a
  #    captured ciphertext, gains nothing without also running the real,
  #    attested enclave image.
  # ---------------------------------------------------------------------
  statement {
    sid    = "AllowEncryptForBootSealing"
    effect = "Allow"

    principals {
      type        = "AWS"
      identifiers = [aws_iam_role.enclave_host.arn]
    }

    actions   = ["kms:Encrypt"]
    resources = ["*"]

    condition {
      test     = "StringEquals"
      variable = "kms:EncryptionContext:purpose"
      values   = ["escrow-enclave-key"]
    }
  }

  # ---------------------------------------------------------------------
  # 5. Unconditional Deny of kms:CreateGrant for every principal —
  #    including escrow-kms-admin and root. Grants are a SEPARATE
  #    authorization mechanism from this key policy's statements; a grant
  #    can Allow kms:Decrypt to any principal with NO PCR condition at
  #    all, which would let an admin (or a root break-glass session)
  #    silently reopen unattested Decrypt without ever touching
  #    kms:PutKeyPolicy — i.e. without the MFA gate (statement 9) and
  #    without a reviewable key-policy diff (README's two-person
  #    procedure). Since local.kms_admin_actions no longer includes
  #    kms:CreateGrant at all, this Deny is currently redundant with that
  #    omission — it exists as an independent second control so a future
  #    edit that carelessly re-adds kms:CreateGrant to the admin action
  #    list is still blocked: an explicit Deny always overrides any Allow
  #    elsewhere in this same policy document.
  # ---------------------------------------------------------------------
  statement {
    sid    = "DenyCreateGrant"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["kms:CreateGrant"]
    resources = ["*"]
  }

  # ---------------------------------------------------------------------
  # 6. Universal fail-closed Deny: if the request carries no attestation
  #    document at all (kms:RecipientAttestation:ImageSha384 is absent —
  #    Null test = true), Decrypt is denied for EVERY principal, including
  #    the admin role and root. An explicit Deny always overrides any
  #    Allow — from another key-policy statement, an IAM identity policy,
  #    OR a grant — so this is the real enforcement backstop for statement
  #    3, not just documentation of intent.
  #
  #    IMPORTANT limitation (caught in review, fixed by statements 7/8):
  #    a DEBUG-mode enclave's attestation document is real and present —
  #    "no attestation at all" is Null/absent, which is NOT the same
  #    condition as "an attestation whose PCRs are trivially all-zero".
  #    This statement alone does not reject a debug-mode attestation;
  #    statements 7 and 8 close that gap explicitly.
  # ---------------------------------------------------------------------
  statement {
    sid    = "DenyDecryptWithoutAttestation"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["kms:Decrypt"]
    resources = ["*"]

    condition {
      test     = "Null"
      variable = "kms:RecipientAttestation:ImageSha384"
      values   = ["true"]
    }
  }

  # ---------------------------------------------------------------------
  # 7/8. Deny Decrypt outright for a DEBUG-mode enclave's attestation —
  #    matched on PCR0 (7) and, independently, on ImageSha384 (8), since
  #    ImageSha384 is documented to correspond to PCR0 but is a distinct
  #    condition key that a future statement could theoretically be
  #    conditioned on instead. Two separate Deny statements (rather than
  #    two conditions on one statement) so EITHER one matching is
  #    sufficient to deny — conditions within a single statement are
  #    ANDed, which would require BOTH to be zero simultaneously and could
  #    be trivially avoided.
  #
  #    Why this matters even though no Allow statement above grants
  #    unconditional Decrypt: statement 3's per-measurement Allows already
  #    require a match against real, non-zero pinned PCR values, so a
  #    debug attestation (all-zero) cannot satisfy them today. This is
  #    deliberate defense-in-depth against a DIFFERENT future mistake —
  #    e.g. a careless edit that adds a new Allow statement, or a grant
  #    (see statement 5) that a future policy change might Allow — rather
  #    than a gap in the current Allow set.
  # ---------------------------------------------------------------------
  statement {
    sid    = "DenyDecryptForDebugModeEnclavePCR0"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["kms:Decrypt"]
    resources = ["*"]

    condition {
      test     = "StringEqualsIgnoreCase"
      variable = "kms:RecipientAttestation:PCR0"
      values   = [local.debug_enclave_zero_measurement]
    }
  }

  statement {
    sid    = "DenyDecryptForDebugModeEnclaveImageSha384"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["kms:Decrypt"]
    resources = ["*"]

    condition {
      test     = "StringEqualsIgnoreCase"
      variable = "kms:RecipientAttestation:ImageSha384"
      values   = [local.debug_enclave_zero_measurement]
    }
  }

  # ---------------------------------------------------------------------
  # 9. Deny PutKeyPolicy unless the caller's session is MFA-authenticated.
  #    Terraform/AWS cannot enforce true two-person approval by itself —
  #    this condition only proves ONE authenticated human with an MFA
  #    device pressed "apply". The second person is enforced by process:
  #    a CODEOWNERS-required security-team review on the PR that changed
  #    this file, completed BEFORE the MFA-authenticated apply happens.
  #    See README.md. BoolIfExists (not plain Bool) so a session with NO
  #    aws:MultiFactorAuthPresent context key at all — true for most
  #    non-interactive/instance-role sessions, and for some federated
  #    human sessions depending on IdP configuration — is treated as
  #    "MFA not present" and denied, rather than silently allowed through
  #    because the key was missing instead of explicitly "false".
  # ---------------------------------------------------------------------
  statement {
    sid    = "DenyPutKeyPolicyWithoutMFA"
    effect = "Deny"

    principals {
      type        = "AWS"
      identifiers = ["*"]
    }

    actions   = ["kms:PutKeyPolicy"]
    resources = ["*"]

    condition {
      test     = "BoolIfExists"
      variable = "aws:MultiFactorAuthPresent"
      values   = ["false"]
    }
  }
}

resource "aws_kms_key" "escrow" {
  description = "learncard escrow enclave (${var.environment}): symmetric CMK protecting the enclave-generated escrow private key. kms:Decrypt is gated by per-measurement Nitro attestation conditions in this key's policy — this is NOT a general-purpose encryption key and must never be referenced outside the escrow-enclave-host role."

  key_usage                = "ENCRYPT_DECRYPT"
  customer_master_key_spec = "SYMMETRIC_DEFAULT"
  enable_key_rotation      = true
  deletion_window_in_days  = 30

  policy = data.aws_iam_policy_document.escrow_kms_key_policy.json

  tags = merge(local.common_tags, { Name = "${local.name_prefix}-escrow-cmk" })
}

resource "aws_kms_alias" "escrow" {
  name          = "alias/learncard-escrow-enclave-${var.environment}"
  target_key_id = aws_kms_key.escrow.key_id
}
