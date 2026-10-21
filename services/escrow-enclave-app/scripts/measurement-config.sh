#!/usr/bin/env bash
# Public, measured names only. Explicit allowlist: never serialize ambient AWS credentials.
set -euo pipefail
jq -n \
    --arg region "${ESCROW_AUTHORITY_REGION:-}" \
    --arg accountId "${ESCROW_AUTHORITY_ACCOUNT_ID:-}" \
    --arg table "${ESCROW_AUTHORITY_TABLE:-}" \
    --arg writerUser "${ESCROW_AUTHORITY_WRITER_USER:-}" \
    --arg tenant "${ESCROW_AUTHORITY_TENANT:-}" \
    --arg environment "${ESCROW_AUTHORITY_ENVIRONMENT:-}" \
    --arg generation "${ESCROW_AUTHORITY_GENERATION:-}" \
    --arg credentialKmsKeyArn "${ESCROW_AUTHORITY_CREDENTIAL_KMS_KEY_ARN:-}" \
    --arg emailRegion "${ESCROW_EMAIL_REGION:-}" \
    --arg emailAccountId "${ESCROW_EMAIL_ACCOUNT_ID:-}" \
    --arg senderUser "${ESCROW_EMAIL_SENDER_USER:-}" \
    --arg from "${ESCROW_EMAIL_FROM:-}" \
    --arg identity "${ESCROW_EMAIL_IDENTITY:-}" \
    --arg configurationSet "${ESCROW_EMAIL_CONFIGURATION_SET:-}" \
    '{authority: {region: $region, accountId: $accountId, table: $table, writerUser: $writerUser, tenant: $tenant, environment: $environment, generation: $generation, credentialKmsKeyArn: $credentialKmsKeyArn}, email: {region: $emailRegion, accountId: $emailAccountId, senderUser: $senderUser, from: $from, identity: $identity, configurationSet: $configurationSet}}'
