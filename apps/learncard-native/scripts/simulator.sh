#!/bin/bash
# Shared by run-ios and test-ios; creates a dedicated simulator for this experiment.
lc_prepare_simulator() {
    lc_native_name="${LC_NATIVE_SIMULATOR_NAME:-LearnCard Native Lab}"
    if [[ -n "${LC_NATIVE_SIMULATOR_ID:-}" ]]; then
        lc_native_device="$LC_NATIVE_SIMULATOR_ID"
    else
        lc_native_device="$(xcrun simctl list devices available -j | python3 -c '
import json, sys
devices = json.load(sys.stdin)["devices"]
print(next((d["udid"] for group in devices.values() for d in group
            if d.get("isAvailable") and d["name"] == sys.argv[1]), ""))
' "$lc_native_name")"
        if [[ -z "$lc_native_device" ]]; then
            lc_runtime="$(xcrun simctl list runtimes -j | python3 -c '
import json, sys
runtimes = [r for r in json.load(sys.stdin)["runtimes"]
            if r.get("isAvailable") and ".iOS-" in r["identifier"]]
if not runtimes: sys.exit("Install an iOS simulator runtime in Xcode Settings > Components.")
print(max(runtimes, key=lambda r: tuple(map(int, r["version"].split("."))))["identifier"])
')"
            lc_device_type="$(xcrun simctl list runtimes -j | python3 -c '
import json, sys
runtime = next(r for r in json.load(sys.stdin)["runtimes"] if r["identifier"] == sys.argv[1])
types = [d for d in runtime.get("supportedDeviceTypes", []) if d["name"].startswith("iPhone")]
for name in ("iPhone 17 Pro", "iPhone 16 Pro", "iPhone 15 Pro", "iPhone Duo"):
    match = next((d for d in types if d["name"] == name), None)
    if match:
        print(match["identifier"])
        break
else:
    if not types: sys.exit("Install an iPhone device type compatible with the selected iOS runtime.")
    print(types[0]["identifier"])
' "$lc_runtime")"
            lc_native_device="$(xcrun simctl create "$lc_native_name" "$lc_device_type" "$lc_runtime")"
        fi
    fi
    lc_native_state="$(xcrun simctl list devices -j | python3 -c '
import json, sys
device_id = sys.argv[1]
print(next((d["state"] for group in json.load(sys.stdin)["devices"].values()
            for d in group if d["udid"] == device_id), "Missing"))
' "$lc_native_device")"
    if [[ "$lc_native_state" != "Booted" ]]; then
        xcrun simctl boot "$lc_native_device"
    fi
    xcrun simctl bootstatus "$lc_native_device" -b
}
