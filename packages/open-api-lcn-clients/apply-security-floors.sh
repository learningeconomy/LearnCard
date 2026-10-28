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
#   - filelock >= 4.2.1
#     (GHSA-9vhv-jxww-xfm5, GHSA-v4x8-3wr5-3wq8, GHSA-567q-5qvw-pf92;
#      patched filelock requires Python >= 3.11)
#   - tox >= 4.11.0       (tox 3.x is EOL and incompatible with pytest 9)
#   - virtualenv >= 21.14.13 (GHSA-cx6f-vjhg-g3cc; transitive via tox, pinned explicitly)
#   - requires-python >= 3.11 (no safe filelock + virtualenv solution on 3.10)

set -euo pipefail

PACKAGE_ROOT="$(realpath -m "$(dirname "$0")")"
CLIENT_DIR="$(realpath -ms "${1:-$PACKAGE_ROOT/python-client}")"

if [[ ! -d "$CLIENT_DIR" || -L "$CLIENT_DIR" ||
      "$CLIENT_DIR" != "$(realpath -m "$CLIENT_DIR")" ||
      "$CLIENT_DIR" != "$PACKAGE_ROOT/"* ]]; then
    echo 'Security-floor target must be an existing non-symlink directory inside the client package' >&2
    exit 1
fi
for file in pyproject.toml setup.py requirements.txt test-requirements.txt .travis.yml .gitlab-ci.yml README.md tox.ini openapi_client/__init__.py; do
    if [[ ! -f "$CLIENT_DIR/$file" || -L "$CLIENT_DIR/$file" ]]; then
        echo "Missing or unsafe generated file: $CLIENT_DIR/$file" >&2
        exit 1
    fi
done

TEMP_FILE=''
trap 'if [[ -n "$TEMP_FILE" ]]; then rm -f "$TEMP_FILE"; fi' EXIT

sed_i() {
    # portable in-place sed (GNU + BSD)
    if sed --version >/dev/null 2>&1; then sed -i "$@"; else sed -i '' "$@"; fi
}

sed_i \
    -e 's/tox = ">= 3\.9\.0"/tox = ">= 4.11.0"/' \
    -e 's/"tox>=3\.9\.0"/"tox>=4.11.0"/' \
    -e 's/"urllib3 (>=2\.1\.0,<3\.0\.0)"/"urllib3 (>=2.7.0,<3.0.0)"/' \
    -e 's/requires-python = ">=3\.9"/requires-python = ">=3.11"/' \
    -e 's/requires-python = ">=3\.10"/requires-python = ">=3.11"/' \
    -e 's/^python = ">=3\.9"/python = ">=3.11"/' \
    -e 's/^python = ">=3\.10"/python = ">=3.11"/' \
    -e 's/pytest = ">= 7\.2\.1"/pytest = ">= 9.0.3"/' \
    -e 's/"pytest>=7\.2\.1"/"pytest>=9.0.3"/' \
    "$CLIENT_DIR/pyproject.toml"

if ! grep -qE '^(filelock =|[[:space:]]*"filelock[>=])' "$CLIENT_DIR/pyproject.toml"; then
    # awk instead of sed: `\n` in a sed replacement is a GNU extension and is
    # silently ignored by BSD/macOS sed, which would skip the insertion.
    # OpenAPI Generator supports both Poetry assignments and PEP 735 arrays.
    TEMP_FILE="$(mktemp "$CLIENT_DIR/.pyproject.XXXXXX")"
    awk '
        { print }
        /^pytest-cov =/ { print "filelock = \">= 4.2.1\"" }
        /^[[:space:]]*"pytest-cov>=/ {
            print "  \"filelock>=4.2.1\","
        }
    ' \
        "$CLIENT_DIR/pyproject.toml" > "$TEMP_FILE" &&
        mv "$TEMP_FILE" "$CLIENT_DIR/pyproject.toml"
    TEMP_FILE=''
fi

if ! grep -qE '^(virtualenv =|[[:space:]]*"virtualenv>=)' "$CLIENT_DIR/pyproject.toml"; then
    TEMP_FILE="$(mktemp "$CLIENT_DIR/.pyproject.XXXXXX")"
    awk '
        { print }
        /^pytest-cov =/ { print "virtualenv = \">= 21.14.13\"" }
        /^[[:space:]]*"pytest-cov>=/ { print "  \"virtualenv>=21.14.13\"," }
    ' \
        "$CLIENT_DIR/pyproject.toml" > "$TEMP_FILE" &&
        mv "$TEMP_FILE" "$CLIENT_DIR/pyproject.toml"
    TEMP_FILE=''
fi

sed_i \
    -e 's/PYTHON_REQUIRES = ">= 3\.9"/PYTHON_REQUIRES = ">= 3.11"/' \
    -e 's/PYTHON_REQUIRES = ">= 3\.10"/PYTHON_REQUIRES = ">= 3.11"/' \
    -e 's/"urllib3 >= 2\.1\.0, < 3\.0\.0"/"urllib3 >= 2.7.0, < 3.0.0"/' \
    "$CLIENT_DIR/setup.py"

sed_i 's/^urllib3 >= 2\.1\.0/urllib3 >= 2.7.0/' "$CLIENT_DIR/requirements.txt"

sed_i -e 's/^pytest >= 7\.2\.1/pytest >= 9.0.3/' -e 's/^tox >= 3\.9\.0/tox >= 4.11.0/' "$CLIENT_DIR/test-requirements.txt"
if ! grep -q '^virtualenv' "$CLIENT_DIR/test-requirements.txt"; then
    sed_i '/^tox >=/i\
virtualenv >= 21.14.13
' "$CLIENT_DIR/test-requirements.txt"
fi
if ! grep -q '^filelock' "$CLIENT_DIR/test-requirements.txt"; then
    echo 'filelock >= 4.2.1' >> "$CLIENT_DIR/test-requirements.txt"
fi

# Use Python for whitespace/quote-independent edits of both stock and formatted
# metadata. Fail closed if a future generator introduces an unsupported layout.
python3 - "$CLIENT_DIR" <<'PYTHON'
from pathlib import Path
import re
import sys

client = Path(sys.argv[1]).resolve()

def update(name, transform, required):
    path = client / name
    if path.resolve() != path or not path.is_file():
        raise SystemExit(f"Missing or unsafe generated file: {path}")
    text = transform(path.read_text())
    if not re.search(required, text, re.M):
        raise SystemExit(f"FAIL: 'Python 3.11 metadata' not applied in {path}")
    path.write_text(text)

update("setup.py", lambda text: text if re.search(r"^\s*python_requires=", text, re.M)
       else text.replace("    install_requires=REQUIRES,", "    python_requires=PYTHON_REQUIRES,\n    install_requires=REQUIRES,"),
       r"^\s*python_requires=PYTHON_REQUIRES,$")
update("README.md", lambda text: re.sub(r"Python 3\.(?:9|10)\+", "Python 3.11+", text),
       r"Python 3\.11\+")
update("tox.ini", lambda text: re.sub(r"^envlist\s*=.*$", "envlist = py311,py312", text, flags=re.M),
       r"^envlist = py311,py312$")
update(".travis.yml", lambda text: re.sub(r'''^[ \t]*- ['"]3\.(?:[0-9]|10)['"][ \t]*(?:#[^\n]*)?\n''', "", text, flags=re.M),
       r'''^\s*- ['"]3\.11['"]''')
update(".gitlab-ci.yml", lambda text: re.sub(r"^pytest-3\.(?:[0-9]|10):[ \t]*(?:#[^\n]*)?\n(?:[ \t]+[^\n]*\n|\n)*", "", text, flags=re.M),
       r"^\s*image: python:3\.11-alpine$")
for name in (".travis.yml", ".gitlab-ci.yml"):
    if re.search(r"(?:['\"]|python:|pytest-)3\.(?:[0-9]|10)(?!\d)", (client / name).read_text()):
        raise SystemExit(f"FAIL: 'unsupported Python CI version' in {name}")

# The driver discards generated GitHub metadata after post-processing. Still
# update its Python matrix so standalone post-processing is safe as well.
for directory in (client / ".github", client / ".github/workflows"):
    if directory.is_symlink():
        raise SystemExit(f"Unsafe generated directory: {directory}")

def python_matrix(text):
    # Stock workflows use python-version inline arrays. Also handle scalar and
    # block-list values, without rewriting unrelated tools' version settings.
    lines = []
    block_indent = None
    for line in text.splitlines(keepends=True):
        field = re.match(r"^(\s*)python-version:\s*", line)
        indent = len(line) - len(line.lstrip())
        if field:
            block_indent = len(field[1])
        elif line.strip() and block_indent is not None and indent <= block_indent:
            block_indent = None
        if block_indent is not None:
            line = re.sub(r"(?<![\w.])3\.(?:[0-9]|10)(?![\d.])", "3.11", line)
            if re.search(r"(?<![\w.])3\.(?:[0-9]|10)(?!\d)", line):
                raise SystemExit("FAIL: 'unsupported Python CI version' in workflow")
        lines.append(line)
    return "".join(lines)

for path in (client / ".github/workflows").glob("*.y*ml"):
    update(str(path.relative_to(client)), python_matrix, r"\S")

for name in ("pyproject.toml", "setup.py", "setup.cfg"):
    path = client / name
    if path.exists():
        update(name, lambda text: re.sub(r"^.*Programming Language :: Python :: 3\.(?:[0-9]|10)['\", ]*\n", "", text, flags=re.M), r"\S")
        # The pinned generator's setup.cfg contains only flake8 settings. Do
        # not require packaging metadata there, but enforce it when declared.
        # setup.py and pyproject.toml retain their mandatory floor checks.
        if name == "setup.cfg" and re.search(r"^[ \t]*python_requires\s*=", path.read_text(), re.M):
            update(name, lambda text: re.sub(r"^([ \t]*python_requires\s*=\s*)>=\s*3\.(?:9|10)[ \t]*$", r"\g<1>>=3.11", text, flags=re.M),
                   r"^[ \t]*python_requires\s*=\s*>=\s*3\.11[ \t]*$")
        text = path.read_text()
        if re.search(r"^python\s*=", text, re.M) and not re.search(r'^python = ">=3\.11"$', text, re.M):
            raise SystemExit(f"FAIL: 'Poetry python floor' not applied in {path}")
        if re.search(r"python_requires\s*=\s*['\"]?>=\s*3\.(?:[0-9]|10)(?!\d)", text):
            raise SystemExit(f"FAIL: 'python_requires floor' not applied in {path}")
PYTHON

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
verify "$CLIENT_DIR/pyproject.toml" '^(pytest = ">= 9\.0\.3"|[[:space:]]*"pytest>=9\.0\.3",?)$' 'pytest floor'
verify "$CLIENT_DIR/pyproject.toml" '^(filelock = ">= 4\.2\.1"|[[:space:]]*"filelock>=4\.2\.1",?)$' 'filelock floor'
verify "$CLIENT_DIR/pyproject.toml" '^(virtualenv = ">= 21\.14\.13"|[[:space:]]*"virtualenv>=21\.14\.13",?)$' 'virtualenv floor'
verify "$CLIENT_DIR/pyproject.toml" '^(tox = ">= 4\.11\.0"|[[:space:]]*"tox>=4\.11\.0",?)$' 'tox floor'
verify "$CLIENT_DIR/pyproject.toml" '^requires-python = ">=3\.11"$' 'requires-python floor'
verify "$CLIENT_DIR/setup.py" 'PYTHON_REQUIRES = ">= 3\.11"$' 'python floor'
verify "$CLIENT_DIR/setup.py" 'urllib3 >= 2\.7\.0, < 3\.0\.0' 'urllib3 floor'
verify "$CLIENT_DIR/requirements.txt" '^urllib3 >= 2\.7\.0' 'urllib3 floor'
verify "$CLIENT_DIR/test-requirements.txt" '^pytest >= 9\.0\.3' 'pytest floor'
verify "$CLIENT_DIR/test-requirements.txt" '^tox >= 4\.11\.0' 'tox floor'
verify "$CLIENT_DIR/test-requirements.txt" '^virtualenv >= 21\.14\.13$' 'virtualenv floor'
verify "$CLIENT_DIR/test-requirements.txt" '^filelock >= 4\.2\.1$' 'filelock floor'
refute "$CLIENT_DIR/pyproject.toml" 'filelock.*(python|;|3\.20\.3)|virtualenv.*(python|;)' 'conditional security floors'
refute "$CLIENT_DIR/test-requirements.txt" '^(filelock|virtualenv).*;' 'conditional security floors'

echo "Security floors applied to $CLIENT_DIR"
