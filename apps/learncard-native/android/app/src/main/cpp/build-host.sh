#!/bin/bash
set -euo pipefail
out="$1"
mkdir -p "$out"
android_root="$(cd "$(dirname "$0")/../../../.." && pwd)"
quickjs="$android_root/third_party/quickjs"
java_home="${JAVA_HOME:-$(dirname "$(dirname "$(readlink -f "$(command -v javac)")")")}"
gcc -shared -fPIC -O2 -D_GNU_SOURCE \
    -I"$java_home/include" -I"$java_home/include/linux" \
    -I"$quickjs" \
    -o "$out/liblearncardquickjs.so" \
    "$android_root/app/src/main/cpp/jni.c" \
    "$quickjs/cutils.c" \
    "$quickjs/libregexp.c" \
    "$quickjs/libunicode.c" \
    "$quickjs/quickjs.c" \
    "$quickjs/xsum.c" \
    -lm -lpthread
