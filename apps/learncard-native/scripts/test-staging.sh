#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
lc_staging="$task_root/sdk-spike/staging-account.ts"
lc_cleanup() {
    lc_status=$?
    if ! bun --conditions=development "$lc_staging" cleanup; then
        echo 'Staging cleanup needs a retry; the ignored staging-state.json was retained.' >&2
        lc_status=1
    fi
    exit "$lc_status"
}
trap lc_cleanup EXIT
python3 "$task_root/scripts/generate-project.py"
if [[ ! -f "$task_root/ios/NativeCore/Sources/LearnCardNativeSDK/Resources/didkit.wasm" ]]; then
    bun --conditions=development "$task_root/sdk-spike/prepare.ts"
fi
bun --conditions=development "$lc_staging" prepare
export LC_NATIVE_RESULT_PATH="$task_root/artifacts/staging-$(date +%Y%m%d-%H%M%S)-$$.xcresult"
LC_NATIVE_SCHEME=LearnCardNativeStaging bash "$task_root/scripts/test-ios.sh" -only-testing:LearnCardNativeUITests/StagingAccountTests "$@"
lc_export="$task_root/artifacts/staging-attachments-$(date +%Y%m%d-%H%M%S)-$$"
xcrun xcresulttool export attachments --path "$LC_NATIVE_RESULT_PATH" --output-path "$lc_export"
xcrun xcresulttool get test-results summary --path "$LC_NATIVE_RESULT_PATH" --compact > "$lc_export/native-test-summary.json"
bun --conditions=development "$lc_staging" verify "$lc_export"
