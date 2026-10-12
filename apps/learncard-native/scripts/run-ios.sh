#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
source "$task_root/scripts/simulator.sh"
lc_prepare_simulator
bash "$task_root/scripts/build-ios.sh" -quiet
xcrun simctl install "$lc_native_device" "$task_root/ios/.derivedData/Build/Products/Debug-iphonesimulator/LearnCardNative.app"
open -a Simulator --args -CurrentDeviceUDID "$lc_native_device"
xcrun simctl launch --terminate-running-process "$lc_native_device" org.learningeconomy.learncard.native.experiment "$@"
