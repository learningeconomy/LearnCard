#!/bin/bash
set -euo pipefail
task_root="$(cd "$(dirname "$0")/.." && pwd)"
bun --conditions=development "$task_root/scripts/prepare-account.ts"
swift test --package-path "$task_root/ios/NativeCore"
