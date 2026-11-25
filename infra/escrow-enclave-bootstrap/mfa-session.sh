#!/usr/bin/env bash
# Assume escrow-kms-admin with MFA and store the 1-hour session as the
# AWS profile "escrow-kms-admin-session", so Terraform (which can't prompt
# for MFA) can use it via AWS_PROFILE.
#
# Usage: ./mfa-session.sh <6-digit MFA code> [account-id] [iam-user]
set -euo pipefail

code="${1:?usage: $0 <mfa-code> [account-id] [iam-user]}"
account="${2:-217358003896}"
user="${3:-jackson}"
source_profile="escrow-kms-admin-user"
target_profile="escrow-kms-admin-session"

# STS accepts only TOTP devices (ARN ":mfa/"), not passkeys/security keys (":u2f/").
serial=$(aws iam list-mfa-devices --profile "$source_profile" --user-name "$user" \
    --query "MFADevices[?contains(SerialNumber, ':mfa/')] | [0].SerialNumber" --output text)
[ "$serial" != "None" ] || {
    echo "No authenticator-app MFA device for $user. Passkeys can't be used from the CLI;" >&2
    echo "add an 'Authenticator app' MFA device in IAM, then retry." >&2
    exit 1
}

read -r key secret token expiry < <(aws sts assume-role --profile "$source_profile" \
    --role-arn "arn:aws:iam::${account}:role/escrow-kms-admin" \
    --role-session-name "${user}-mfa" --duration-seconds 3600 \
    --serial-number "$serial" --token-code "$code" \
    --query 'Credentials.[AccessKeyId,SecretAccessKey,SessionToken,Expiration]' --output text)

aws configure set aws_access_key_id "$key" --profile "$target_profile"
aws configure set aws_secret_access_key "$secret" --profile "$target_profile"
aws configure set aws_session_token "$token" --profile "$target_profile"
aws configure set region us-east-1 --profile "$target_profile"

echo "Profile $target_profile valid until $expiry"
