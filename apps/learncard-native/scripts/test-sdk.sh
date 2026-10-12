#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
bun --conditions=development "$task_root/sdk-spike/prepare.ts"
export LC_NATIVE_RESULT_PATH="$task_root/artifacts/sdk-$(date +%Y%m%d-%H%M%S)-$$.xcresult"
bash "$task_root/scripts/test-ios.sh" -only-testing:LearnCardNativeUITests/SDKCompatibilityTests "$@"
lc_export="$task_root/artifacts/sdk-attachments-$(date +%Y%m%d-%H%M%S)-$$"
xcrun xcresulttool export attachments --path "$LC_NATIVE_RESULT_PATH" --output-path "$lc_export"
xcrun xcresulttool get test-results summary --path "$LC_NATIVE_RESULT_PATH" --compact > "$lc_export/native-test-summary.json"
bun --conditions=development "$task_root/sdk-spike/verify-native.ts" "$lc_export"
