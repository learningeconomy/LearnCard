#!/usr/bin/env python3
"""Drive the installed synthetic lab through Android UI; never touches the main LearnCard app."""
import argparse
import json
from pathlib import Path
import re
import subprocess
import time
import xml.etree.ElementTree as ET

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--serial', required=True)
parser.add_argument('--adb', default='adb')
parser.add_argument('--output', required=True, type=Path)
args = parser.parse_args()
args.output.mkdir(parents=True, exist_ok=True)
ADB = [args.adb, '-s', args.serial]
HOLDER = 'com.learncard.dclab.holder'
VERIFIER = 'com.learncard.dclab.verifier'
VERIFIED = 'Verified: issuer signature, disclosures, nonce, audience and holder binding.'
checks = []


def adb(*parts):
    return subprocess.check_output(ADB + list(parts), stderr=subprocess.DEVNULL)


def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/lc2157-proof-window.xml')
    return list(ET.fromstring(adb('shell', 'cat', '/sdcard/lc2157-proof-window.xml')).iter('node'))


def wait(label, cls=None, timeout=45):
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            snapshot = nodes()
        except (subprocess.CalledProcessError, ET.ParseError):
            # Accessibility may be temporarily unavailable while a WebView/activity starts.
            continue
        for node in snapshot:
            if label in (node.get('text'), node.get('content-desc')) and (not cls or node.get('class') == cls):
                return node
    raise RuntimeError(f'UI did not show: {label}')


def tap(label, cls=None):
    node = wait(label, cls)
    assert node.get('enabled') == 'true', f'Disabled: {label}'
    left, top, right, bottom = map(int, re.findall(r'\d+', node.get('bounds')))
    adb('shell', 'input', 'tap', str((left + right) // 2), str((top + bottom) // 2))


def launch(package):
    adb('shell', 'am', 'start', '-n', package + '/com.learncard.dclab.LabActivity')


def screenshot(name):
    (args.output / f'{name}.png').write_bytes(adb('exec-out', 'screencap', '-p'))


def passed(name):
    checks.append(name)
    print('PASS', name, flush=True)


def consent(prefix):
    tap('Request Course Details')
    wait('Sample Course Completion')
    wait('Course name')
    wait('Completion date')
    screenshot(prefix + '-system-picker')
    tap('Agree and continue')
    wait('Review requested details')
    wait('Share Details')
    screenshot(prefix + '-consent')


try:
    launch(HOLDER)
    tap('Register Sample')
    wait('1 sample registered. Open LearnCard Verifier Lab to request it.')
    screenshot('registered')
    launch(VERIFIER)
    consent('warm')
    passed('register metadata and discover in system picker')
    claim = 'Course name: Introduction to Verifiable Credentials'
    tap(claim, 'android.widget.CheckBox')
    assert wait('Share Details').get('enabled') == 'false'
    passed('required claim deselection disables approval')
    tap(claim, 'android.widget.CheckBox')
    tap('Share Details')
    wait(VERIFIED)
    screenshot('warm-verified')
    passed('warm native roundtrip and cryptographic verification')

    consent('cancel')
    tap('Cancel')
    wait('Canceled. No credential was received.')
    assert not any(n.get('resource-id') == 'result' for n in nodes())
    screenshot('canceled')
    passed('holder cancellation delivers no credential or stale result')

    # Ordinary background process death, not force-stop (which changes component eligibility).
    adb('shell', 'am', 'kill', HOLDER)
    deadline = time.monotonic() + 15
    while time.monotonic() < deadline:
        result = subprocess.run(ADB + ['shell', 'pidof', HOLDER], capture_output=True)
        if not result.stdout.strip():
            break
        time.sleep(0.25)
    else:
        raise RuntimeError('Holder process still running; cold-start test invalid')
    consent('cold')
    assert adb('shell', 'pidof', HOLDER).strip()
    tap('Share Details')
    wait(VERIFIED)
    screenshot('cold-verified')
    passed('process absent before request; restored holder reads stored sample and signs')

    launch(HOLDER)
    tap('Clear Samples')
    wait('Samples cleared from Android.')
    screenshot('cleared')
    launch(VERIFIER)
    tap('Request Course Details')
    wait('No matching credential is registered.')
    screenshot('no-credential')
    passed('registry clear removes sample from subsequent matching')
finally:
    # Native-specific evidence. This is deliberately not an lc verify report.
    commit = subprocess.check_output(['git', 'rev-parse', 'HEAD'], text=True).strip()
    report = {'kind': 'android-emulator-lab', 'commit': commit, 'serial': args.serial, 'passed': checks,
              'complete': len(checks) == 6,
              'not_verified': ['main LearnCard account integration', 'physical device',
                               'browser caller', 'independent verifier', 'Linux lc verify catalog']}
    (args.output / 'native-proof.json').write_text(json.dumps(report, indent=2) + '\n')
