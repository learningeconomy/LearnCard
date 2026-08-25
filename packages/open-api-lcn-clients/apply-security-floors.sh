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
    sed_i 's/^pytest-cov = \(.*\)$/pytest-cov = \1\nfilelock = ">= 3.20.3"/' "$CLIENT_DIR/pyproject.toml"
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

echo "Security floors applied to $CLIENT_DIR"
