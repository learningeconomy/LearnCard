"""Propose, never merge, a stable Apple provider release. No release text is executed."""

import hashlib
import json
import os
import re
import subprocess
import urllib.request
from pathlib import Path


def api(endpoint, payload=None):
    command = ['gh', 'api', endpoint]
    if payload is not None:
        command += ['--method', 'POST', '--input', '-']
    result = subprocess.run(command, input=json.dumps(payload) if payload else None,
                            text=True, capture_output=True, check=True)
    return json.loads(result.stdout)


def propose(repo, branch, title, body):
    owner = repo.split('/')[0]
    existing = api(f'repos/{repo}/pulls?state=all&head={owner}:{branch}')
    if existing:
        print('An update PR already exists; review it manually.')
        return
    subprocess.run(['gh', 'pr', 'create', '--repo', repo, '--base', 'main', '--head', branch,
                    '--title', title, '--body', body], check=True)


def main():
    upstream = 'klausbetz/apple-identity-provider-keycloak'
    release = api(f'repos/{upstream}/releases/latest')
    tag = release['tag_name']
    if release['draft'] or release['prerelease'] or not re.fullmatch(r'v?\d+\.\d+\.\d+', tag):
        raise ValueError('Expected a stable semantic-version release')
    version = tag.removeprefix('v')
    paths = [Path('infra/keycloak/Dockerfile'), Path('infra/keycloak/Dockerfile.dev')]
    contents = [path.read_text() for path in paths]
    pins = []
    for content in contents:
        match = re.search(r'/releases/download/([^/]+)/apple-identity-provider-([\d.]+)\.jar', content)
        if match is None:
            raise ValueError('Dockerfile is missing the expected Apple provider pin')
        pins.append(match.group(2))
    if len(set(pins)) != 1:
        raise ValueError('Dockerfile provider pins disagree; repair manually')
    if tuple(map(int, version.split('.'))) <= tuple(map(int, pins[0].split('.'))):
        print('Provider is already up to date.')
        return
    name = f'apple-identity-provider-{version}.jar'
    asset = next(asset for asset in release['assets'] if asset['name'] == name)
    url = f'https://github.com/{upstream}/releases/download/{tag}/{name}'
    if asset['browser_download_url'] != url:
        raise ValueError('Unexpected release asset URL')
    with urllib.request.urlopen(url, timeout=120) as response:
        checksum = hashlib.sha256(response.read()).hexdigest()
    repo = os.environ['GITHUB_REPOSITORY']
    branch = f'dependabot/keycloak-apple-{version}'
    title = f'build(keycloak): update Apple provider to {version}'
    body = (f'Provider release: {release["html_url"]}\n\nSHA-256: `{checksum}`\n\n'
            '- [ ] Confirm compatibility with Keycloak 26.x minor.\n'
            '- [ ] Build both images and test Apple sign-in before merging.\n'
            '- [ ] Approve/run required CI for this token-created PR before merging.\n\n'
            '## Upstream release notes (untrusted release content)\n\n' + (release['body'] or 'No notes supplied.'))
    # Existing branches (including closed PRs) are left alone; no force updates.
    refs = api(f'repos/{repo}/git/matching-refs/heads/{branch}')
    if any(ref['ref'] == f'refs/heads/{branch}' for ref in refs):
        # Retry an orphan branch after a transient PR API/settings failure.
        propose(repo, branch, title, body)
        return
    base = os.environ['GITHUB_SHA']
    commit = api(f'repos/{repo}/git/commits/{base}')
    entries = []
    for path, content in zip(paths, contents):
        content = re.sub(r'--checksum=sha256:[0-9a-f]{64}',
                         f'--checksum=sha256:{checksum}', content)
        content = re.sub(r'/releases/download/[^/]+/apple-identity-provider-[\d.]+\.jar',
                         f'/releases/download/{tag}/{name}', content)
        content = re.sub(r'/providers/apple-identity-provider-[\d.]+\.jar',
                         f'/providers/{name}', content)
        entries.append({'path': str(path), 'mode': '100644', 'type': 'blob', 'content': content})
    tree = api(f'repos/{repo}/git/trees', {'base_tree': commit['tree']['sha'], 'tree': entries})
    updated = api(f'repos/{repo}/git/commits',
                  {'message': title, 'tree': tree['sha'], 'parents': [base]})
    api(f'repos/{repo}/git/refs', {'ref': f'refs/heads/{branch}', 'sha': updated['sha']})
    propose(repo, branch, title, body)


if __name__ == '__main__':
    main()
