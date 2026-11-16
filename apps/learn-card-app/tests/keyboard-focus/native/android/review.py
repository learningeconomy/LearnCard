"""Build, exercise, and record the account-free Android keyboard fixture."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import subprocess
import tempfile
import time
from urllib.parse import urlparse

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--device', required=True, help='Owned emulator serial, e.g. emulator-5558')
parser.add_argument('--output', help='Parent for a new private evidence directory')
parser.add_argument('--capture-only', action='store_true', help='Record the broken baseline without asserting host height')
parser.add_argument('--all-tests', action='store_true', help='Also check field switching, Back and interrupted dismissal')
args = parser.parse_args()
if not re.fullmatch(r'emulator-\d+', args.device):
    parser.error('This review runner only installs to an explicitly selected emulator.')
source = Path(__file__).resolve().parent
app = source.parents[3]
android = app / 'android'
config = json.loads((android / 'app/src/main/assets/capacitor.config.json').read_text())
url = urlparse(config.get('server', {}).get('url', ''))
if url.hostname not in {'127.0.0.1', 'localhost', '10.0.2.2'} or url.path != '/tests/keyboard-focus/animation.html':
    parser.error('Configure the native shell to load the local animation.html fixture first.')
if config.get('plugins', {}).get('CapacitorUpdater', {}).get('autoUpdate', True):
    parser.error('Disable Capgo auto-update for this local native review.')
sdk = Path(os.environ.get('ANDROID_HOME', Path.home() / 'Library/Android/sdk'))
adb = [str(sdk / 'platform-tools/adb'), '-s', args.device]
out = Path(tempfile.mkdtemp(prefix='lc-android-keyboard-', dir=args.output))
print(f'Private recording output: {out}', flush=True)
with (out / 'build.log').open('w') as log:
    subprocess.run([str(android / 'gradlew'), '-p', str(android), ':app:assembleDebug',
        ':app:assembleDebugAndroidTest', '-I', str(source / 'source.init.gradle'),
        f'-PkeyboardReviewSources={source}', '--max-workers=2', '--console=plain'],
        stdout=log, stderr=subprocess.STDOUT, check=True)
apk = android / 'app/build/outputs/apk/debug/app-debug.apk'
test_apk = android / 'app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk'
for path in (apk, test_apk):
    subprocess.run(adb + ['install', '-r', str(path)], check=True, capture_output=True)
if subprocess.run(adb + ['shell', 'pidof', 'screenrecord'], capture_output=True).stdout.strip():
    raise RuntimeError('Another recording is active on this emulator; leave it untouched.')
remote = '/sdcard/' + out.name + '.mp4'
with (out / 'recorder.log').open('w') as log:
    recorder = subprocess.Popen(adb + ['shell', 'screenrecord', '--bit-rate', '6000000',
        '--time-limit', '120', remote], stdout=log, stderr=subprocess.STDOUT)
    recorder_pid = None
    try:
        for _ in range(20):
            pids = subprocess.run(adb + ['shell', 'pidof', 'screenrecord'], capture_output=True, text=True).stdout.split()
            if len(pids) == 1:
                recorder_pid = pids[0]
                break
            time.sleep(0.1)
        if recorder_pid is None:
            raise RuntimeError('Native recorder did not start.')
        test = 'com.learncard.app.KeyboardAnimationTest'
        if not args.all_tests:
            test += '#keyboardOpenDismiss'
        result = subprocess.run(adb + ['shell', 'am', 'instrument', '-w', '-e', 'captureOnly',
            str(args.capture_only).lower(), '-e', 'class', test,
            'com.learncard.app.test/androidx.test.runner.AndroidJUnitRunner'],
            capture_output=True, text=True, timeout=110)
        (out / 'test.log').write_text(result.stdout + result.stderr)
    finally:
        if recorder_pid:
            subprocess.run(adb + ['shell', 'kill', '-2', recorder_pid], capture_output=True)
        try:
            recorder.wait(timeout=10)
        except subprocess.TimeoutExpired:
            recorder.terminate()
            recorder.wait(timeout=5)
subprocess.run(adb + ['pull', remote, str(out / 'native.mp4')], check=True, capture_output=True)
(out / 'metadata.json').write_text(json.dumps({
    'head': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=app, text=True).strip(),
    'dirty': bool(subprocess.check_output(['git', 'status', '--porcelain'], cwd=app, text=True).strip()),
    'apkSha256': hashlib.sha256(apk.read_bytes()).hexdigest(),
    'captureOnly': args.capture_only, 'device': args.device,
}, indent=2))
print(result.stdout, flush=True)
if result.returncode or 'OK (' not in result.stdout:
    raise SystemExit(1)
