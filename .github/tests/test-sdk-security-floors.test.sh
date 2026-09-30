#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Python 3.11+ parses the resulting TOML so a misplaced or duplicate dependency
# cannot pass just because the shell script's text checks accept it.
python3 - "$REPO_ROOT" <<'PYTHON'
import pathlib
import shutil
import subprocess
import sys
import tempfile
import tomllib
import unittest

ROOT = pathlib.Path(sys.argv.pop())
SCRIPT = ROOT / "packages/open-api-lcn-clients/apply-security-floors.sh"


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
  "tox>=3.9.0",
  "mypy>=1.5",
]
'''
        else:
            dev = f'''[tool.poetry.group.dev.dependencies]
pytest = ">= {pytest_version}"
pytest-cov = ">= 2.8.1"
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
            "test-requirements.txt": "pytest >= 7.2.1\npytest-cov >= 2.8.1\ntox >= 3.9.0\n",
            ".travis.yml": 'python:\n  - "3.9"\n  - "3.10"\n',
            ".gitlab-ci.yml": "pytest-3.9:\n  image: python:3.9-alpine\npytest-3.10:\n  image: python:3.10-alpine\n",
        }
        for name, content in files.items():
            (self.client / name).write_text(content)
        # Deliberately no .github/: the workflow deletes it before this script.

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
                        self.assertEqual(deps.count("filelock>=3.20.3"), 1)
                        expected = ["pytest>=9.0.3", "tox>=4.11.0", "mypy>=1.5"]
                        for requirement in expected:
                            self.assertIn(requirement, deps)
                        self.assertNotIn("tox>=3.9.0", deps)
                    else:
                        deps = data["tool"]["poetry"]["group"]["dev"]["dependencies"]
                        for name, version in {"pytest": "9.0.3", "tox": "4.11.0", "filelock": "3.20.3", "mypy": "1.5"}.items():
                            self.assertEqual(deps[name], f">= {version}")
                    self.assertEqual(data["project"]["requires-python"], ">=3.10")
                    self.assertEqual(data["project"]["dependencies"], ["urllib3 (>=2.7.0,<3.0.0)"])
                    setup = {}
                    exec((self.client / "setup.py").read_text(), setup)
                    self.assertEqual(setup["PYTHON_REQUIRES"], ">= 3.10")
                    self.assertEqual(setup["REQUIRES"], ["urllib3 >= 2.7.0, < 3.0.0"])
                    self.assertEqual((self.client / "requirements.txt").read_text(), "urllib3 >= 2.7.0, < 3.0.0\n")
                    requirements = (self.client / "test-requirements.txt").read_text().splitlines()
                    self.assertEqual(requirements, ["pytest >= 9.0.3", "pytest-cov >= 2.8.1", "tox >= 4.11.0", "filelock >= 3.20.3"])
                    self.assertEqual((self.client / ".travis.yml").read_text(), 'python:\n  - "3.10"\n')
                    self.assertEqual((self.client / ".gitlab-ci.yml").read_text(), "pytest-3.10:\n  image: python:3.10-alpine\n")
                    before = {p.name: p.read_bytes() for p in self.client.iterdir()}
                    result = self.run_script()
                    self.assertEqual(result.returncode, 0, result.stderr)
                    self.assertEqual(before, {p.name: p.read_bytes() for p in self.client.iterdir()})
                    self.assertFalse((self.client / "pyproject.toml.tmp").exists())

    def test_unknown_or_missing_floors_still_fail(self):
        for modern in (False, True):
            for dependency in ("pytest", "tox", "filelock"):
                with self.subTest(modern=modern, dependency=dependency):
                    self.fixture(modern)
                    path = self.client / "pyproject.toml"
                    text = path.read_text()
                    if dependency == "filelock":
                        # The insertion anchor disappearing must not silently skip the pin.
                        text = "\n".join(line for line in text.splitlines() if "pytest-cov" not in line) + "\n"
                    elif dependency == "pytest":
                        text = text.replace("7.2.1", "8.0.0")
                    else:
                        text = text.replace("3.9.0", "3.10.0")
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

    def test_generator_is_pinned(self):
        workflow = (ROOT / ".github/workflows/open-api-generator.yml").read_text()
        self.assertRegex(workflow, r"(?m)^\s+generator-tag: v\d+\.\d+\.\d+$")


unittest.main()
PYTHON
