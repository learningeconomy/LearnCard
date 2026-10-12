#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
# No deliverable login, live staging exchange or developer's signed-in simulator.
export LC_NATIVE_TEST_EMAIL=native-test@example.invalid
export LC_NATIVE_SIMULATOR_NAME="LearnCard Native UI Checks"
export LC_NATIVE_SCHEME=LearnCardNative
export LC_NATIVE_LIVE_TEST=0
mkdir -p "$task_root/artifacts"
bun --conditions=development test "$task_root"/account-runtime/*.test.ts "$task_root/sdk-spike/staging.test.ts"
bash "$task_root/scripts/test-core.sh" 2>&1 | tee "$task_root/artifacts/swift-core.log"
lc_run="$(date +%Y%m%d-%H%M%S)-$$"
export LC_NATIVE_RESULT_PATH="$task_root/artifacts/native-regressions-$lc_run.xcresult"
bash "$task_root/scripts/test-ios.sh" -quiet
lc_export="$task_root/artifacts/native-attachments-$lc_run"
xcrun xcresulttool export attachments --path "$LC_NATIVE_RESULT_PATH" --output-path "$lc_export"
xcrun xcresulttool get test-results summary --path "$LC_NATIVE_RESULT_PATH" --compact > "$lc_export/native-test-summary.json"
bun --conditions=development "$task_root/sdk-spike/verify-native.ts" "$lc_export"
LC_NATIVE_CONFIGURATION=Release bash "$task_root/scripts/build-ios.sh" -quiet
