"""Reject unsafe filesystem targets before generation or security-floor mutation."""
import shutil
import subprocess
import tempfile
import unittest
from pathlib import Path

PACKAGE = Path(__file__).resolve().parents[1]
ROOT = PACKAGE.parents[1]
METADATA = ("pyproject.toml", "setup.py", "requirements.txt", "test-requirements.txt", ".travis.yml", ".gitlab-ci.yml", "openapi_client/__init__.py")


class ScriptSafetyTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix=".client-safety-", dir=PACKAGE)
        self.directory = Path(self.temp.name)

    def tearDown(self):
        self.temp.cleanup()

    def run_script(self, script, target):
        return subprocess.run(["bash", str(PACKAGE / script), str(target)], cwd=ROOT, capture_output=True, text=True, timeout=10)

    def stage(self):
        stage = self.directory / "stage"
        for name in METADATA:
            target = stage / name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(PACKAGE / "python-client" / name, target)
        return stage

    def test_generator_refuses_ancestors_existing_custom_outputs_and_outside_targets(self):
        sentinel = self.directory / "sentinel"
        sentinel.write_text("owned safety fixture")
        targets = [ROOT, ROOT.parent, PACKAGE, PACKAGE / "templates", self.directory, Path(tempfile.gettempdir()) / "must-not-create-pr979-client"]
        for target in targets:
            with self.subTest(target=target):
                self.assertNotEqual(self.run_script("generate-python.sh", target).returncode, 0)
                self.assertEqual(sentinel.read_text(), "owned safety fixture")

    def test_generator_and_floor_scripts_refuse_symlink_targets_and_parents(self):
        stage = self.stage()
        alias = self.directory / "alias"
        alias.symlink_to(stage, target_is_directory=True)
        parent_alias = self.directory / "parent-alias"
        parent_alias.symlink_to(self.directory, target_is_directory=True)
        original = (stage / "setup.py").read_bytes()
        for script in ("generate-python.sh", "apply-security-floors.sh"):
            for target in (alias, parent_alias / "stage"):
                with self.subTest(script=script, target=target):
                    self.assertNotEqual(self.run_script(script, target).returncode, 0)
                    self.assertEqual((stage / "setup.py").read_bytes(), original)

    def test_floors_refuse_missing_metadata_and_symlinked_generated_files(self):
        stage = self.stage()
        original = (stage / "pyproject.toml").read_bytes()
        setup = stage / "setup.py"
        setup.unlink()
        self.assertNotEqual(self.run_script("apply-security-floors.sh", stage).returncode, 0)
        setup.symlink_to(PACKAGE / "python-client/setup.py")
        self.assertNotEqual(self.run_script("apply-security-floors.sh", stage).returncode, 0)
        self.assertEqual((stage / "pyproject.toml").read_bytes(), original)

    def test_floor_postconditions_fail_on_exact_stage_without_touching_old_client(self):
        stage = self.stage()
        old = (PACKAGE / "python-client/setup.py").read_bytes()
        requirements = stage / "requirements.txt"
        requirements.write_text(requirements.read_text().replace("urllib3 >= 2.7.0", "urllib3 >= 0.0.1"))
        self.assertNotEqual(self.run_script("apply-security-floors.sh", stage).returncode, 0)
        self.assertEqual((PACKAGE / "python-client/setup.py").read_bytes(), old)
        self.assertIn("urllib3 >= 0.0.1", requirements.read_text())


if __name__ == "__main__":
    unittest.main(verbosity=2)
