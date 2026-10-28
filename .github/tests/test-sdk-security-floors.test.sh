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

ROOT = pathlib.Path(sys.argv.pop())
SCRIPT = ROOT / "packages/open-api-lcn-clients/apply-security-floors.sh"
FILELOCK_REQUIREMENTS = ['filelock>=4.2.1']
FILELOCK_POETRY = ">= 4.2.1"


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
            dev = f'''[tool.poetry.dependencies]
python = ">=3.10"
[tool.poetry.group.dev.dependencies]
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
            # Stock Python setup_cfg.mustache in OpenAPI Generator 7.25.0.
            "setup.cfg": "[flake8]\nmax-line-length=99\n",
            "setup.py": 'PYTHON_REQUIRES = ">= 3.9"\nREQUIRES = ["urllib3 >= 2.1.0, < 3.0.0"]\ndef setup(**kwargs):\n    pass\nsetup(\n    install_requires=REQUIRES,\n)\n',
            "requirements.txt": "urllib3 >= 2.1.0, < 3.0.0\n",
            "test-requirements.txt": "pytest >= 7.2.1\npytest-cov >= 2.8.1\nvirtualenv >= 21.14.13\ntox >= 3.9.0\n",
            ".travis.yml": 'python:\n  - "3.9"\n  - "3.10"\n  - "3.11"\n  - "3.12"\n',
            ".gitlab-ci.yml": "pytest-3.9:\n  image: python:3.9-alpine\npytest-3.10:\n  image: python:3.10-alpine\npytest-3.11:\n  image: python:3.11-alpine\npytest-3.12:\n  image: python:3.12-alpine\n",
            "README.md": "## Requirements\nPython 3.9+\n",
            "tox.ini": "[tox]\nenvlist = py3\n",
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
                        self.assertEqual(data["tool"]["poetry"]["dependencies"]["python"], ">=3.11")
                    self.assertEqual(data["project"]["requires-python"], ">=3.11")
                    self.assertEqual(data["project"]["dependencies"], ["urllib3 (>=2.7.0,<3.0.0)"])
                    setup = {}
                    exec((self.client / "setup.py").read_text(), setup)
                    self.assertEqual(setup["PYTHON_REQUIRES"], ">= 3.11")
                    self.assertIn("python_requires=PYTHON_REQUIRES,", (self.client / "setup.py").read_text())
                    self.assertEqual(setup["REQUIRES"], ["urllib3 >= 2.7.0, < 3.0.0"])
                    self.assertEqual((self.client / "requirements.txt").read_text(), "urllib3 >= 2.7.0, < 3.0.0\n")
                    requirements = (self.client / "test-requirements.txt").read_text().splitlines()
                    self.assertEqual(requirements, ["pytest >= 9.0.3", "pytest-cov >= 2.8.1", "virtualenv >= 21.14.13", "tox >= 4.11.0", "filelock >= 4.2.1"])
                    self.assertEqual((self.client / ".travis.yml").read_text(), 'python:\n  - "3.11"\n  - "3.12"\n')
                    self.assertEqual((self.client / ".gitlab-ci.yml").read_text(), "pytest-3.11:\n  image: python:3.11-alpine\npytest-3.12:\n  image: python:3.12-alpine\n")
                    self.assertIn("Python 3.11+", (self.client / "README.md").read_text())
                    self.assertIn("envlist = py311,py312", (self.client / "tox.ini").read_text())
                    self.assertEqual((self.client / "setup.cfg").read_text(), "[flake8]\nmax-line-length=99\n")
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
                self.assertIn("FAIL: 'filelock floor'", result.stderr)

    def test_missing_required_file_is_rejected(self):
        self.fixture(True)
        (self.client / "setup.py").unlink()
        self.assertNotEqual(self.run_script().returncode, 0)

    def assert_client_floors(self, client):
        # These are offline metadata assertions, NOT resolver evidence. The CI
        # resolution job resolves runtime + test dependencies together with pip.
        data = tomllib.loads((client / "pyproject.toml").read_text())
        self.assertEqual(data["project"]["requires-python"], ">=3.11")
        if "dependency-groups" in data:
            dev = data["dependency-groups"]["dev"]
        else:
            dev = [name + constraint for name, constraint in data["tool"]["poetry"]["group"]["dev"]["dependencies"].items()]
        test = (client / "test-requirements.txt").read_text().splitlines()
        for requirements in (dev, test):
            parsed = [Requirement(line) for line in requirements if line and not line.startswith("#")]
            for name, floor in (("filelock", "4.2.1"), ("virtualenv", "21.14.13")):
                matches = [req for req in parsed if req.name == name]
                self.assertEqual(len(matches), 1)
                self.assertIsNone(matches[0].marker)
                self.assertEqual(str(matches[0].specifier), ">=" + floor)

    def test_checked_in_and_generated_floors(self):
        self.assert_client_floors(SCRIPT.parent / "python-client")
        for modern in (False, True):
            self.fixture(modern)
            result = self.run_script()
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assert_client_floors(self.client)

    def test_conditional_or_unsafe_floors_are_rejected(self):
        for modern in (False, True):
            for filename in ("pyproject.toml", "test-requirements.txt"):
                for replacement in ("3.0.0", '4.2.1; python_version >= \\\"3.11\\\"'):
                    with self.subTest(modern=modern, filename=filename, replacement=replacement):
                        self.fixture(modern)
                        self.assertEqual(self.run_script().returncode, 0)
                        path = self.client / filename
                        path.write_text(path.read_text().replace("4.2.1", replacement))
                        result = self.run_script()
                        self.assertNotEqual(result.returncode, 0)
                        self.assertIn("FAIL: 'filelock floor'", result.stderr)

    def test_required_python_metadata_is_still_enforced(self):
        for filename in ("setup.py", "pyproject.toml"):
            with self.subTest(filename=filename):
                self.fixture()
                path = self.client / filename
                path.write_text(path.read_text().replace(">= 3.9", ">= 3.8").replace(">=3.9", ">=3.8"))
                result = self.run_script()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("floor", result.stderr)

    def test_setup_cfg_is_optional_but_declared_python_floor_is_enforced(self):
        for requirement in (None, ">=3.9", ">=3.10", ">=3.11", ">=3.8", "<3.11", "invalid"):
            with self.subTest(requirement=requirement):
                self.fixture()
                path = self.client / "setup.cfg"
                if requirement is None:
                    path.unlink()
                else:
                    path.write_text(f"[options]\npython_requires = {requirement}\n")
                result = self.run_script()
                if requirement in (">=3.8", "<3.11", "invalid"):
                    self.assertNotEqual(result.returncode, 0)
                    self.assertIn("Python 3.11 metadata", result.stderr)
                else:
                    self.assertEqual(result.returncode, 0, result.stderr)
                    if requirement is not None:
                        self.assertEqual(path.read_text(), "[options]\npython_requires = >=3.11\n")
                    else:
                        self.assertFalse(path.exists())

    def test_formatted_ci_and_python_metadata(self):
        self.fixture()
        for name in (".travis.yml", ".gitlab-ci.yml"):
            path = self.client / name
            path.write_text(path.read_text().replace('"', "'").replace("  ", "    "))
        gitlab = self.client / ".gitlab-ci.yml"
        gitlab.write_text(gitlab.read_text().replace("pytest-3.10:", "pytest-3.10: # legacy job"))
        project = self.client / "pyproject.toml"
        project.write_text(project.read_text().replace(">=3.9", ">=3.10").replace(
            "[project]\n", '[project]\nclassifiers = [\n  "Programming Language :: Python :: 3.10",\n  "Programming Language :: Python :: 3.11",\n]\n'))
        (self.client / "setup.cfg").write_text("[options]\npython_requires = >=3.10\n")
        workflow = self.client / ".github/workflows/python.yml"
        workflow.parent.mkdir(parents=True)
        workflow.write_text('python-version: ["3.9", "3.10", "3.11", "3.12"]\n')
        result = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(tomllib.loads(project.read_text())["project"]["classifiers"], ["Programming Language :: Python :: 3.11"])
        self.assertIn("python_requires = >=3.11", (self.client / "setup.cfg").read_text())
        for name in (".travis.yml", ".gitlab-ci.yml", ".github/workflows/python.yml"):
            text = (self.client / name).read_text()
            self.assertNotIn("3.9", text)
            self.assertNotIn("3.10", text)
            self.assertIn("3.11", text)
        for value in ('3.10', '\n  - "3.9"\n  - "3.10"'):
            workflow.write_text(f'python-version: {value}\nnode-version: "3.9"\n')
            result = self.run_script()
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertNotIn("3.10", workflow.read_text())
            self.assertIn('node-version: "3.9"', workflow.read_text())

    def test_workflow_parent_symlinks_are_rejected(self):
        for name in (".github", ".github/workflows"):
            with self.subTest(name=name):
                self.fixture()
                github = self.client / ".github"
                if github.is_symlink():
                    github.unlink()
                elif github.exists():
                    shutil.rmtree(github)
                outside = self.root / "outside"
                outside.mkdir(exist_ok=True)
                (outside / "workflows").mkdir(exist_ok=True)
                sentinel = outside / "ci.yml"
                sentinel.write_text('python-version: ["3.10"]\n')
                nested = outside / "workflows/ci.yml"
                nested.write_text(sentinel.read_text())
                alias = self.client / name
                alias.parent.mkdir(exist_ok=True)
                alias.symlink_to(outside, target_is_directory=True)
                result = self.run_script()
                self.assertNotEqual(result.returncode, 0)
                self.assertIn("Unsafe generated directory", result.stderr)
                self.assertEqual(sentinel.read_text(), 'python-version: ["3.10"]\n')
                self.assertEqual(nested.read_text(), sentinel.read_text())

    def test_generator_is_pinned(self):
        self.fixture()
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
            self.assertEqual(metadata["project"]["requires-python"], ">=3.11")
            self.assertEqual(metadata["project"]["dependencies"], ["urllib3 (>=2.7.0,<3.0.0)"])
            self.assert_client_floors(output)
            self.assertEqual((output / "setup.cfg").read_text(), "[flake8]\nmax-line-length=99\n")
            self.assertFalse((output / ".github").exists())



unittest.main()
PYTHON
