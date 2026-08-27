#!/usr/bin/env bash
# Re-applies security dependency floors to the generated python-client.
#
# The open-api-generator workflow deletes and regenerates python-client/ from
# stock openapi-generator templates, which clobbers any manual edits. This
# script runs after generation to restore the minimum versions required to
# keep Dependabot security alerts closed.
#
# Floors (keep in sync with Dependabot):
#   - urllib3 >= 2.7.0    (GHSA: proxied redirect header leak, decompression bomb)
#   - pytest >= 9.0.3     (vulnerable tmpdir handling)
#   - filelock >= 3.20.3  (TOCTOU symlink attack; transitive via tox, pinned explicitly)
#   - tox >= 4.11.0       (tox 3.x is EOL and incompatible with pytest 9)
#   - requires-python >= 3.10 (floor required by the deps above)

set -euo pipefail

CLIENT_DIR="$(dirname "$0")/python-client"

sed_i() {
    # portable in-place sed (GNU + BSD)
    if sed --version >/dev/null 2>&1; then sed -i "$@"; else sed -i '' "$@"; fi
}

sed_i \
    -e 's/tox = ">= 3\.9\.0"/tox = ">= 4.11.0"/' \
    -e 's/"urllib3 (>=2\.1\.0,<3\.0\.0)"/"urllib3 (>=2.7.0,<3.0.0)"/' \
    -e 's/requires-python = ">=3\.9"/requires-python = ">=3.10"/' \
    -e 's/pytest = ">= 7\.2\.1"/pytest = ">= 9.0.3"/' \
    "$CLIENT_DIR/pyproject.toml"

if ! grep -q '^filelock' "$CLIENT_DIR/pyproject.toml"; then
    # awk instead of sed: `\n` in a sed replacement is a GNU extension and is
    # silently ignored by BSD/macOS sed, which would skip the insertion.
    awk '{ print } /^pytest-cov =/ { print "filelock = \">= 3.20.3\"" }' \
        "$CLIENT_DIR/pyproject.toml" > "$CLIENT_DIR/pyproject.toml.tmp" &&
        mv "$CLIENT_DIR/pyproject.toml.tmp" "$CLIENT_DIR/pyproject.toml"
fi

sed_i \
    -e 's/PYTHON_REQUIRES = ">= 3\.9"/PYTHON_REQUIRES = ">= 3.10"/' \
    -e 's/"urllib3 >= 2\.1\.0, < 3\.0\.0"/"urllib3 >= 2.7.0, < 3.0.0"/' \
    "$CLIENT_DIR/setup.py"

sed_i 's/^urllib3 >= 2\.1\.0/urllib3 >= 2.7.0/' "$CLIENT_DIR/requirements.txt"

sed_i -e 's/^pytest >= 7\.2\.1/pytest >= 9.0.3/' -e 's/^tox >= 3\.9\.0/tox >= 4.11.0/' "$CLIENT_DIR/test-requirements.txt"
if ! grep -q '^filelock' "$CLIENT_DIR/test-requirements.txt"; then
    echo 'filelock >= 3.20.3' >> "$CLIENT_DIR/test-requirements.txt"
fi

sed_i 's/python-version: \["3\.9", /python-version: \[/' "$CLIENT_DIR/.github/workflows/python.yml"
sed_i '/^  - "3\.9"$/d' "$CLIENT_DIR/.travis.yml"
sed_i '/^pytest-3\.9:$/,/^  image: python:3\.9-alpine$/d' "$CLIENT_DIR/.gitlab-ci.yml"

# Post-condition checks: sed exits 0 on unmatched patterns, so if the
# openapi-generator stock template text drifts, the substitutions above
# silently no-op and the vulnerable floors come back. Fail loudly instead.
verify() {
    grep -qE "$2" "$1" || {
        echo "FAIL: '$3' not applied in $1 (generator template drift?)" >&2
        exit 1
    }
}
refute() {
    ! grep -qE "$2" "$1" || {
        echo "FAIL: '$3' still present in $1 (generator template drift?)" >&2
        exit 1
    }
}

verify "$CLIENT_DIR/pyproject.toml" 'urllib3 \(>=2\.7\.0,<3\.0\.0\)' 'urllib3 floor'
verify "$CLIENT_DIR/pyproject.toml" '^pytest = ">= 9\.0\.3"' 'pytest floor'
verify "$CLIENT_DIR/pyproject.toml" '^filelock = ">= 3\.20\.3"' 'filelock pin'
verify "$CLIENT_DIR/pyproject.toml" '^tox = ">= 4\.11\.0"' 'tox floor'
verify "$CLIENT_DIR/pyproject.toml" '^requires-python = ">=3\.10"' 'requires-python floor'
verify "$CLIENT_DIR/setup.py" 'PYTHON_REQUIRES = ">= 3\.10"' 'python floor'
verify "$CLIENT_DIR/setup.py" 'urllib3 >= 2\.7\.0, < 3\.0\.0' 'urllib3 floor'
verify "$CLIENT_DIR/requirements.txt" '^urllib3 >= 2\.7\.0' 'urllib3 floor'
verify "$CLIENT_DIR/test-requirements.txt" '^pytest >= 9\.0\.3' 'pytest floor'
verify "$CLIENT_DIR/test-requirements.txt" '^tox >= 4\.11\.0' 'tox floor'
verify "$CLIENT_DIR/test-requirements.txt" '^filelock >= 3\.20\.3' 'filelock pin'
refute "$CLIENT_DIR/.github/workflows/python.yml" '"3\.9"' 'python 3.9 matrix removal'
refute "$CLIENT_DIR/.travis.yml" '^  - "3\.9"' 'python 3.9 removal'
refute "$CLIENT_DIR/.gitlab-ci.yml" 'python:3\.9-alpine' 'python 3.9 job removal'

echo "Security floors applied to $CLIENT_DIR"
