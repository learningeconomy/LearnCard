#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
bun --conditions=development "$task_root/scripts/prepare-account.ts"
nice -n 10 swift test --jobs "${LC_NATIVE_BUILD_JOBS:-2}" --package-path "$task_root/ios/NativeCore"
