#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
helper="${SCRIPT_DIR}/measurement-config.sh"

# Unset configuration stays explicitly empty; no implicit activation/default domain.
env -i PATH="$PATH" bash "$helper" | jq -e \
    '([.authority[], .email[]] | length) == 14 and all(.authority[], .email[]; . == "")' >/dev/null

# Every allowlisted value survives exactly, including shell/JSON metacharacters.
env -i PATH="$PATH" \
    ESCROW_AUTHORITY_REGION='us-east-1' ESCROW_AUTHORITY_ACCOUNT_ID='123456789012' \
    ESCROW_AUTHORITY_TABLE='authority' ESCROW_AUTHORITY_WRITER_USER='writer' \
    ESCROW_AUTHORITY_TENANT='learncard' ESCROW_AUTHORITY_ENVIRONMENT='staging' \
    ESCROW_AUTHORITY_GENERATION='g1' ESCROW_AUTHORITY_CREDENTIAL_KMS_KEY_ARN='credential-cmk' \
    ESCROW_EMAIL_REGION='us-east-1' ESCROW_EMAIL_ACCOUNT_ID='123456789012' \
    ESCROW_EMAIL_SENDER_USER='sender' ESCROW_EMAIL_FROM='recovery@staging.notify.learncard.com' \
    ESCROW_EMAIL_IDENTITY='staging.notify.learncard.com' ESCROW_EMAIL_CONFIGURATION_SET="test\"\\\$value" \
    AWS_SECRET_ACCESS_KEY='MUST-NOT-APPEAR' ESCROW_AUTHORITY_SECRET_ACCESS_KEY='MUST-NOT-APPEAR' \
    bash "$helper" | jq -e '
        . == {authority: {region:"us-east-1", accountId:"123456789012", table:"authority", writerUser:"writer", tenant:"learncard", environment:"staging", generation:"g1", credentialKmsKeyArn:"credential-cmk"}, email: {region:"us-east-1", accountId:"123456789012", senderUser:"sender", from:"recovery@staging.notify.learncard.com", identity:"staging.notify.learncard.com", configurationSet:"test\"\\$value"}}
    ' >/dev/null
