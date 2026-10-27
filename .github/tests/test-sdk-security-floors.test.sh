#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Python 3.11+ parses the resulting TOML so a misplaced or duplicate dependency
# cannot pass just because the shell script's text checks accept it.
python3 - "$REPO_ROOT" <<'PYTHON'
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import tomllib
import unittest

# pip is available in the SDK CI environment; reuse its PEP 508 parser without
# requiring a network install just to run this offline regression suite.
from pip._vendor.packaging.requirements import Requirement
from pip._vendor.packaging.specifiers import SpecifierSet

ROOT = pathlib.Path(sys.argv.pop())
SCRIPT = ROOT / "packages/open-api-lcn-clients/apply-security-floors.sh"
FILELOCK_REQUIREMENTS = [
    'filelock>=4.2.1; python_version >= "3.11"',
    'filelock==3.20.3; python_version < "3.11"',
]
FILELOCK_POETRY = [
    {"version": ">= 4.2.1", "python": ">=3.11"},
    {"version": "== 3.20.3", "python": "<3.11"},
]


class SecurityFloorsTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="sdk security floors ")
        self.addCleanup(self.temp.cleanup)
        self.root = pathlib.Path(self.temp.name)
        self.script = self.root / SCRIPT.name
        shutil.copyfile(SCRIPT, self.script)
        self.client = self.root / "python-client"
        self.client.mkdir()

    def fixture(self, modern=False, pytest_version="7.2.1"):
        # Minimal generated metadata: v7.25.0 uses Poetry dev assignments;
        # upstream c3680afe switched to PEP 735 arrays (and already has pytest 9).
        if modern:
            dev = f'''[dependency-groups]
dev = [
  "pytest>={pytest_version}",
  "pytest-cov>=2.8.1",
  "virtualenv>=21.14.13",
  "tox>=3.9.0",
  "mypy>=1.5",
]
'''
        else:
            dev = f'''[tool.poetry.group.dev.dependencies]
pytest = ">= {pytest_version}"
pytest-cov = ">= 2.8.1"
virtualenv = ">= 21.14.13"
tox = ">= 3.9.0"
mypy = ">= 1.5"
'''
        files = {
            "pyproject.toml": '''[project]
name = "security-floor-fixture"
requires-python = ">=3.9"
dependencies = ["urllib3 (>=2.1.0,<3.0.0)"]
''' + dev,
            "setup.py": 'PYTHON_REQUIRES = ">= 3.9"\nREQUIRES = ["urllib3 >= 2.1.0, < 3.0.0"]\n',
            "requirements.txt": "urllib3 >= 2.1.0, < 3.0.0\n",
            "test-requirements.txt": "pytest >= 7.2.1\npytest-cov >= 2.8.1\nvirtualenv >= 21.14.13\ntox >= 3.9.0\n",
            ".travis.yml": 'python:\n  - "3.9"\n  - "3.10"\n',
            ".gitlab-ci.yml": "pytest-3.9:\n  image: python:3.9-alpine\npytest-3.10:\n  image: python:3.10-alpine\n",
        }
        for name, content in files.items():
            (self.client / name).write_text(content)
        (self.client / "openapi_client").mkdir(exist_ok=True)
        (self.client / "openapi_client/__init__.py").write_text("")
        # Floors also support the generated metadata after nested .github cleanup.

    def run_script(self):
        return subprocess.run(
            ["bash", str(self.script)], capture_output=True, text=True
        )

    def test_supported_layouts_and_idempotency(self):
        for modern in (False, True):
            for pytest_version in ("7.2.1", "9.0.3"):
                with self.subTest(modern=modern, pytest_version=pytest_version):
                    self.fixture(modern, pytest_version)
                    result = self.run_script()
                    self.assertEqual(result.returncode, 0, result.stderr)
                    data = tomllib.loads((self.client / "pyproject.toml").read_text())
                    if modern:
                        deps = data["dependency-groups"]["dev"]
                        for requirement in FILELOCK_REQUIREMENTS:
                            self.assertEqual(deps.count(requirement), 1)
                        expected = ["pytest>=9.0.3", "virtualenv>=21.14.13", "tox>=4.11.0", "mypy>=1.5"]
                        for requirement in expected:
                            self.assertIn(requirement, deps)
                        self.assertNotIn("tox>=3.9.0", deps)
                    else:
                        deps = data["tool"]["poetry"]["group"]["dev"]["dependencies"]
                        self.assertEqual(deps["filelock"], FILELOCK_POETRY)
                        for name, version in {"pytest": "9.0.3", "virtualenv": "21.14.13", "tox": "4.11.0", "mypy": "1.5"}.items():
                            self.assertEqual(deps[name], f">= {version}")
                    self.assertEqual(data["project"]["requires-python"], ">=3.10")
                    self.assertEqual(data["project"]["dependencies"], ["urllib3 (>=2.7.0,<3.0.0)"])
                    setup = {}
                    exec((self.client / "setup.py").read_text(), setup)
                    self.assertEqual(setup["PYTHON_REQUIRES"], ">= 3.10")
                    self.assertEqual(setup["REQUIRES"], ["urllib3 >= 2.7.0, < 3.0.0"])
                    self.assertEqual((self.client / "requirements.txt").read_text(), "urllib3 >= 2.7.0, < 3.0.0\n")
                    requirements = (self.client / "test-requirements.txt").read_text().splitlines()
                    self.assertEqual(requirements, ["pytest >= 9.0.3", "pytest-cov >= 2.8.1", "virtualenv >= 21.14.13", "tox >= 4.11.0", 'filelock >= 4.2.1; python_version >= "3.11"', 'filelock == 3.20.3; python_version < "3.11"'])
                    self.assertEqual((self.client / ".travis.yml").read_text(), 'python:\n  - "3.10"\n')
                    self.assertEqual((self.client / ".gitlab-ci.yml").read_text(), "pytest-3.10:\n  image: python:3.10-alpine\n")
                    before = {str(p.relative_to(self.client)): p.read_bytes() for p in self.client.rglob("*") if p.is_file()}
                    result = self.run_script()
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(before, {str(p.relative_to(self.client)): p.read_bytes() for p in self.client.rglob("*") if p.is_file()})
                    self.assertFalse((self.client / "pyproject.toml.tmp").exists())

    def test_unknown_or_missing_floors_still_fail(self):
        for modern in (False, True):
            for dependency in ("pytest", "virtualenv", "tox", "filelock"):
                with self.subTest(modern=modern, dependency=dependency):
                    self.fixture(modern)
                    path = self.client / "pyproject.toml"
                    text = path.read_text()
                    if dependency == "filelock":
                        # The insertion anchor disappearing must not silently skip the pin.
                        text = "\n".join(line for line in text.splitlines() if "pytest-cov" not in line) + "\n"
                    elif dependency == "pytest":
                        text = text.replace("7.2.1", "8.0.0")
                    elif dependency == "tox":
                        text = text.replace("3.9.0", "3.10.0")
                    else:
                        text = text.replace("21.14.13", "20.0.0")
                    path.write_text(text)
                    result = self.run_script()
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn(f"FAIL: '{dependency} ", result.stderr)
                    self.assertFalse((self.client / "pyproject.toml.tmp").exists())

    def test_existing_unsafe_filelock_is_rejected(self):
        for modern in (False, True):
            with self.subTest(modern=modern):
                self.fixture(modern)
                path = self.client / "pyproject.toml"
                text = path.read_text()
                if modern:
                    text = text.replace('dev = [', 'dev = [\n  "filelock>=3.0.0",')
                else:
                    text += 'filelock = ">= 3.0.0"\n'
                path.write_text(text)
                result = self.run_script()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("FAIL: 'filelock pin'", result.stderr)

    def test_missing_required_file_is_rejected(self):
        self.fixture(True)
        (self.client / "setup.py").unlink()
        self.assertNotEqual(self.run_script().returncode, 0)

    def assert_resolvable_floors(self, requirements, python_version):
        # Frozen PyPI Requires-Python metadata for known-safe release witnesses.
        # 4.2.1 cannot run on 3.10; 3.20.3 predates all three affected ranges.
        releases = {
            "filelock": {"3.20.3": ">=3.10", "4.2.1": ">=3.11"},
            "virtualenv": {"21.14.13": ">=3.9"},
        }
        selected = {name: [] for name in releases}
        environment = {"python_version": python_version, "python_full_version": python_version + ".0"}
        for line in requirements:
            requirement = Requirement(line)
            if requirement.name in selected and (
                requirement.marker is None or requirement.marker.evaluate(environment)
            ):
                selected[requirement.name].append(requirement)
        for name, requirements in selected.items():
            self.assertEqual(len(requirements), 1, (python_version, name, requirements))
            requirement = requirements[0]
            candidates = [
                version for version, requires_python in releases[name].items()
                if version in requirement.specifier
                and python_version in SpecifierSet(requires_python)
            ]
            self.assertTrue(candidates, (python_version, str(requirement)))
            if name == "filelock":
                self.assertEqual(candidates, ["3.20.3" if python_version == "3.10" else "4.2.1"])
                for unsafe in ("3.20.4", "3.22.0", "4.2.0"):
                    self.assertNotIn(unsafe, requirement.specifier)
            else:
                self.assertNotIn("21.14.12", requirement.specifier)

    def assert_client_resolvable(self, client):
        data = tomllib.loads((client / "pyproject.toml").read_text())
        if "dependency-groups" in data:
            dev = data["dependency-groups"]["dev"]
        else:
            dev = []
            for name, constraint in data["tool"]["poetry"]["group"]["dev"]["dependencies"].items():
                if isinstance(constraint, str):
                    dev.append(name + constraint)
                else:
                    for entry in constraint:
                        # Poetry's multiple constraints use Python specifiers,
                        # rather than PEP 508 marker strings.
                        operator = ">=" if entry["python"].startswith(">=") else "<"
                        version = entry["python"][len(operator):]
                        dev.append(f'{name}{entry["version"]}; python_version {operator} "{version}"')
        test = (client / "test-requirements.txt").read_text().splitlines()
        for python_version in ("3.10", "3.11", "3.12"):
            for source, requirements in (("dev", dev), ("test", test)):
                with self.subTest(client=str(client), python=python_version, source=source):
                    self.assert_resolvable_floors(requirements, python_version)

    def test_minimum_python_and_newer_resolvability(self):
        self.assert_client_resolvable(SCRIPT.parent / "python-client")
        for modern in (False, True):
            self.fixture(modern)
            result = self.run_script()
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assert_client_resolvable(self.client)

    def test_resolvability_check_catches_unconditional_filelock(self):
        with self.assertRaises(AssertionError):
            self.assert_resolvable_floors(["filelock>=4.2.1", "virtualenv>=21.14.13"], "3.10")

    def test_incomplete_filelock_markers_are_rejected(self):
        for modern in (False, True):
            for filename in ("pyproject.toml", "test-requirements.txt"):
                for version in ("3.20.3", "4.2.1"):
                    with self.subTest(modern=modern, filename=filename, version=version):
                        self.fixture(modern)
                        self.assertEqual(self.run_script().returncode, 0)
                        path = self.client / filename
                        # Preserve an existing entry while corrupting either arm;
                        # the insertion guard must not hide the missing safe pin.
                        path.write_text(path.read_text().replace(version, "3.0.0"))
                        result = self.run_script()
                        self.assertNotEqual(result.returncode, 0)
                        self.assertIn("FAIL: 'filelock pin'", result.stderr)

    def test_generator_is_pinned(self):
        self.fixture(True)
        package = SCRIPT.parent
        with tempfile.TemporaryDirectory(prefix=".pin-contract-", dir=package) as directory:
            output = pathlib.Path(directory) / "generated"
            trace = self.root / "docker-calls.jsonl"
            docker = self.root / "docker"
            # Fault-inject the external Docker boundary, not the driver. Mutable
            # image references or network-enabled runs fail the real CLI path.
            docker.write_text('''#!/usr/bin/env python3
import json
import os
import pathlib
import re
import shutil
import sys

args = sys.argv[1:]
images = [arg for arg in args if arg.startswith(("oven/bun", "openapitools/openapi-generator-cli"))]
if len(images) != 1 or not re.fullmatch(r"[^\\s]+@sha256:[a-f0-9]{64}", images[0]):
    raise SystemExit(90)
with open(os.environ["PIN_TRACE"], "a") as trace:
    trace.write(json.dumps({"image": images[0], "args": args}) + "\\n")
if args[0] in ("image", "pull"):
    raise SystemExit(0)
if args[0] != "run" or args[args.index("--network") + 1] != "none":
    raise SystemExit(91)
mounts = {}
for index, arg in enumerate(args[:-1]):
    if arg == "-v":
        source, target, *_ = args[index + 1].split(":")
        mounts[target] = pathlib.Path(source)
if args[-1] == "version":
    print("7.25.0")
elif "generate" in args:
    shutil.copytree(os.environ["PIN_FIXTURE"], mounts["/output"], dirs_exist_ok=True)
    (mounts["/output"] / ".github").mkdir()
elif "scripts/export-openapi.ts" in args:
    (mounts["/schema"] / "openapi.json").write_text("{}")
elif "/workspace/node_modules/prettier/bin/prettier.cjs" not in args:
    raise SystemExit(92)
''')
            docker.chmod(0o755)
            result = subprocess.run(
                ["bash", str(package / "generate-python.sh"), str(output)],
                cwd=ROOT,
                env={
                    "PATH": str(self.root) + os.pathsep + os.environ["PATH"],
                    "PIN_TRACE": str(trace),
                    "PIN_FIXTURE": str(self.client),
                },
                capture_output=True,
                text=True,
                timeout=20,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            calls = [json.loads(line) for line in trace.read_text().splitlines()]
            run_images = {call["image"].split("@")[0] for call in calls if call["args"][0] == "run"}
            self.assertEqual(run_images, {"oven/bun", "openapitools/openapi-generator-cli"})
            # Prove successful pin checks reached real floor processing and
            # promotion rather than passing on image inspection alone.
            metadata = tomllib.loads((output / "pyproject.toml").read_text())
            self.assertEqual(metadata["project"]["requires-python"], ">=3.10")
            self.assertEqual(metadata["project"]["dependencies"], ["urllib3 (>=2.7.0,<3.0.0)"])
            for requirement in FILELOCK_REQUIREMENTS:
                self.assertIn(requirement, metadata["dependency-groups"]["dev"])
            self.assertFalse((output / ".github").exists())



unittest.main()
PYTHON
