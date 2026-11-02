import hashlib
import json
import os
import signal
import re
from pathlib import Path
import subprocess
import time

BASELINE = 'a8a94b97e5b984a87500bc21c6d1278ca55d62db'
CANDIDATE = '2d6a6e6752cf7cdf487017116cced1ec71db4410'
EXPECTED = {
    'credentials': ['wallet-self-issue', 'wallet-detail-persistence', 'wallet-peer-claim'],
    'sharing': ['share-menu-copy', 'share-public-preview-isolation',
                'share-deleted-preview-recovery', 'share-endorsed-preview-stability',
                'share-anonymous-view'],
}
private = Path(os.environ['PRIVATE_LOG_DIR'])
stack = Path(os.environ['STACK_DIR'])
output = Path(os.environ['SUMMARY_DIR'])
output.mkdir(parents=True, exist_ok=True)
identities = {}
for label, revision in [('baseline', BASELINE), ('candidate', CANDIDATE)]:
    directory = private / label
    directory.mkdir(mode=0o700, exist_ok=True)
    hashes = {}
    for name in ['shared', 'sharing']:
        source = subprocess.check_output([
            'git', 'show', revision + ':apps/learn-card-app/scripts/verification/journeys/' + name + '.ts'])
        (directory / (name + '.ts')).write_bytes(source)
        hashes[name] = hashlib.sha256(source).hexdigest()
    (directory / 'manifest.json').write_text(json.dumps(hashes))
    identities[label] = {'revision': revision, 'sha256': hashes}

def failure_diagnostic(result):
    # Never copy error text/URLs/selector contents. Only fixed codes and source coordinates.
    error = result.get('error', '')
    if not isinstance(error, str):
        error = ''
    code = 'unclassified'
    for marker, label in [
        ('#modal-mid-root', 'owned-overlay-removal'),
        ("getByRole('dialog', { includeHidden: true })", 'global-hidden-dialog-removal'),
        ('More options', 'credential-options'),
        ('Share QR code', 'share-qr-control'), ('Copy Link', 'share-copy-control'),
        ('Post to LinkedIn', 'share-preview-link'), ('Vibe Curator', 'stock-badge-picker'),
        ('Boost a Friend', 'badge-picker-open'), ('Passport', 'passport-navigation'),
    ]:
        if marker in error:
            code = label
            break
    locations = [dict(file=name + '.ts', line=int(line), column=int(column))
        for name, line, column in re.findall(
            r'/verification/journeys/(shared|sharing|credentials)\.ts:(\d+):(\d+)', error)[:6]]
    return {'code': code, 'locations': locations}
trials = []
failed = False
for ordinal, label in enumerate(['baseline', 'candidate', 'candidate', 'baseline'], 1):
    before = set((stack / 'runs').glob('*')) if (stack / 'runs').exists() else set()
    hook_report = private / ('hook-' + str(ordinal) + '.json')
    environment = dict(os.environ, LCV_BENCH_SOURCE_DIR=str(private / label),
                       LCV_BENCH_HOOK_REPORT=str(hook_report))
    started = time.monotonic()
    with (private / ('trial-' + str(ordinal) + '.jsonl')).open('wb') as out, \
            (private / ('trial-' + str(ordinal) + '.log')).open('wb') as err:
        process = subprocess.Popen([
            'bun', '--preload', str(Path('scripts/navigation-benchmark-preload.ts').resolve()),
            '--conditions=development', 'apps/learn-card-app/scripts/verification/main.ts',
            'run', 'credentials', 'sharing', '--json', '--dir', str(stack)
        ], env=environment, stdout=out, stderr=err, start_new_session=True)
        timed_out = False
        try:
            process.wait(timeout=1200)
        except subprocess.TimeoutExpired:
            timed_out = True
            process.send_signal(signal.SIGTERM)
            try:
                process.wait(timeout=60)
            except subprocess.TimeoutExpired:
                os.killpg(process.pid, signal.SIGKILL)
                process.wait(timeout=10)
    row = {'trial': ordinal, 'variant': label, 'exitCode': process.returncode, 'timedOut': timed_out,
           'cliWallMs': round((time.monotonic() - started) * 1000), 'features': [],
           'coveragePassed': False, 'hookPassed': False}
    new_runs = set((stack / 'runs').glob('*')) - before
    report = {}
    if len(new_runs) == 1:
        try:
            value = json.loads((new_runs.pop() / 'report.json').read_text())
            if isinstance(value, dict) and isinstance(value.get('results'), list):
                report = value
        except (OSError, ValueError, TypeError):
            pass
    if report:
        results = [item for item in report['results'] if isinstance(item, dict)]
        for feature, entries in EXPECTED.items():
            result = next((item for item in results if item.get('feature') == feature), {})
            duration = result.get('durationMs')
            if not isinstance(duration, (int, float)) or not 0 <= duration <= 7200000:
                duration = None
            completed_entries = result.get('entries', [])
            if not isinstance(completed_entries, list):
                completed_entries = []
            completed_entries = [entry for entry in completed_entries if isinstance(entry, str)]
            row['features'].append({
                'feature': feature,
                'passed': result.get('status') == 'passed',
                'completedEntries': len(set(completed_entries) & set(entries)),
                'requiredEntries': len(entries), 'durationMs': duration,
                'failure': None if result.get('status') == 'passed' else failure_diagnostic(result)})
        row['coveragePassed'] = (report.get('status') == 'passed' and len(results) == 2 and
            all(item['passed'] and item['completedEntries'] == item['requiredEntries'] and
                item['durationMs'] is not None for item in row['features']))
    hook = {}
    try:
        value = json.loads(hook_report.read_text())
        if isinstance(value, dict) and isinstance(value.get('counts'), dict):
            hook = value
    except (OSError, ValueError, TypeError):
        pass
    if hook:
        row['hookPassed'] = (hook.get('counts') == {'shared': 1, 'sharing': 1} and
                             hook.get('hashes') == identities[label]['sha256'])
        row['hookCounts'] = {name: (hook['counts'].get(name, 0)
            if type(hook['counts'].get(name, 0)) is int else -1) for name in ['shared', 'sharing']}
    row['featureTotalMs'] = (sum(item['durationMs'] for item in row['features'])
                             if row['coveragePassed'] else None)
    trials.append(row)
    failed = failed or process.returncode != 0 or timed_out or not row['coveragePassed'] or not row['hookPassed']
    (output / 'navigation-trials.json').write_text(json.dumps({
        'schemaVersion': 1, 'identities': identities, 'trials': trials}, indent=2) + '\n')
    print(json.dumps(row), flush=True)
    # Never rerun or discard a failed trial; doctor must still establish a usable owned stack.
    with (private / ('doctor-' + str(ordinal) + '.log')).open('wb') as log:
        try:
            healthy = subprocess.run(['bun', '--conditions=development',
                'apps/learn-card-app/scripts/verification/main.ts', 'doctor', '--dir', str(stack)],
                stdout=log, stderr=log, check=False, timeout=120)
            usable = healthy.returncode == 0
        except subprocess.TimeoutExpired:
            usable = False
    if not usable:
        failed = True
        break
raise SystemExit(1 if failed or len(trials) != 4 else 0)
