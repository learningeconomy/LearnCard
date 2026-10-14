#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
bun --conditions=development "$task_root/scripts/prepare-account.ts"
nice -n 10 xcodebuild -jobs "${LC_NATIVE_BUILD_JOBS:-2}" -project "$task_root/ios/LearnCardNative.xcodeproj" \
    -scheme LearnCardNative -configuration "${LC_NATIVE_CONFIGURATION:-Debug}" \
    -destination 'generic/platform=iOS Simulator' \
    -derivedDataPath "$task_root/ios/.derivedData" CODE_SIGN_IDENTITY=- build "$@"
