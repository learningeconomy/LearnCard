"""Compare full SARIF findings without treating GitHub dismissal state as scan output."""
import collections
import html
import json
import pathlib
import sys


def load(directory):
    directory = pathlib.Path(directory)
    runs = []
    for file in directory.glob('*.sarif'):
        runs.extend(json.loads(file.read_text())['runs'])
    if len(runs) != 1:
        raise ValueError('Expected one JavaScript/TypeScript scan per side')
    run = runs[0]
    versions = [(run['tool']['driver']['name'], run['tool']['driver']['semanticVersion'])]
    for extension in run['tool'].get('extensions', []):
        if 'pr-diff-range' in extension['name']:
            raise ValueError('Diff-informed results cannot be used for this comparison')
        versions.append((extension['name'], extension.get('semanticVersion')))
    rules = sorted(rule['id'] for extension in run['tool'].get('extensions', []) for rule in extension.get('rules', []))
    return directory, run.get('results', []), (versions, rules)


def key(result):
    location = result['locations'][0]['physicalLocation']
    fingerprint = result.get('partialFingerprints', {}).get('primaryLocationLineHash')
    if fingerprint is None:
        raise ValueError('Missing stable location fingerprint')
    return result['ruleId'], location['artifactLocation']['uri'], fingerprint


def compare(baseline, target):
    old = collections.defaultdict(list)
    for result in baseline:
        old[key(result)].append(result)
    remaining, added = [], []
    for result in target:
        matches = old[key(result)]
        if matches:
            matches.pop()
            remaining.append(result)
        else:
            added.append(result)
    return remaining, added, [result for matches in old.values() for result in matches]


def safe(value):
    return html.escape(str(value)).replace('|', '&#124;').replace('`', '&#96;').replace('\n', ' ')


def report(baseline_dir, target_dir):
    old_dir, old, old_config = load(baseline_dir)
    new_dir, new, new_config = load(target_dir)
    if old_config != new_config:
        raise ValueError('CodeQL versions, query packs, or rule sets differ')
    remaining, added, absent = compare(old, new)
    print('# Full CodeQL comparison\n')
    print(f"Baseline: `{safe((old_dir / 'commit.txt').read_text().strip())}`  ")
    print(f"Target: `{safe((new_dir / 'commit.txt').read_text().strip())}`\n")
    print('| Finding counts | Count |\n|---|---:|')
    for label, count in [('Baseline', len(old)), ('Target', len(new)), ('Remaining', len(remaining)), ('New locations', len(added)), ('No longer detected', len(absent))]:
        print(f'| {label} | {count} |')
    print('\nCounts include previously dismissed findings. They are raw scanner results, not GitHub open-alert counts. Matching uses rule, path, and line fingerprint; moved or rewritten locations may appear as an absent/new pair.\n')
    if (old_dir / 'config.yml').read_text() != (new_dir / 'config.yml').read_text():
        print('**Scan configurations differ.** Review the config files in both artifacts: exclusions or deleted files can remove findings without fixing vulnerable code.\n')
    for title, results in [('Remaining findings', remaining), ('New locations to review', added), ('No longer detected', absent)]:
        print(f'## {title}\n\n| Rule | Location | Message |\n|---|---|---|')
        for result in results:
            loc = result['locations'][0]['physicalLocation']
            path = loc['artifactLocation']['uri']
            line = loc.get('region', {}).get('startLine', '?')
            print(f"| {safe(result['ruleId'])} | {safe(path)}:{line} | {safe(result['message']['text'])} |")
        print()


if __name__ == '__main__':
    report(*sys.argv[1:])
