#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
lc_resources="$task_root/ios/NativeCore/Sources/LearnCardNativeSDK/Resources"
bun --conditions=development "$task_root/scripts/prepare-account.ts"
if [[ ! -f "$lc_resources/sdk.js" || ! -f "$lc_resources/vectors.json" || ! -f "$lc_resources/didkit.wasm" ]]; then
    bun --conditions=development "$task_root/sdk-spike/prepare.ts"
fi
source "$task_root/scripts/simulator.sh"
# A direct focused run must be as isolated as test-ci.sh. Never default tests to
# the signed-in manual-review simulator used by run-ios.sh.
export LC_NATIVE_SIMULATOR_NAME="${LC_NATIVE_SIMULATOR_NAME:-LearnCard Native UI Checks}"
lc_prepare_simulator
mkdir -p "$task_root/artifacts"
lc_result="${LC_NATIVE_RESULT_PATH:-$task_root/artifacts/ui-$(date +%Y%m%d-%H%M%S)-$$.xcresult}"
nice -n 10 xcodebuild -jobs "${LC_NATIVE_BUILD_JOBS:-2}" -project "$task_root/ios/LearnCardNative.xcodeproj" \
    -scheme "${LC_NATIVE_SCHEME:-LearnCardNative}" -configuration Debug \
    -destination "platform=iOS Simulator,id=$lc_native_device" \
    -derivedDataPath "$task_root/ios/.derivedData" \
    -resultBundlePath "$lc_result" -parallel-testing-enabled NO \
    CODE_SIGN_IDENTITY=- test "$@"
