#!/bin/bash
set -euo pipefail
root="$(cd "$(dirname "$0")/../../.." && pwd)"
export PATH="${HOME}/.bun/bin:${PATH}"
export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-${HOME}/android-sdk}}"
cd "${root}/apps/learncard-native/android"
./gradlew testDebugUnitTest --stacktrace
