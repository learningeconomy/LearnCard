"""Structural verification, separate from behavior/transport contract tests."""
import ast
import importlib
import pkgutil
import sys
from pathlib import Path


def main():
    client = Path(__file__).resolve().parents[1] / "python-client"
    sources = sorted(client.rglob("*.py"))
    for source in sources:
        ast.parse(source.read_text(), filename=str(source))
    sys.path.insert(0, str(client))
    package = importlib.import_module("openapi_client")
    modules = sorted(module.name for module in pkgutil.walk_packages(package.__path__, "openapi_client."))
    for module in modules:
        importlib.import_module(module)
    print(f"Parsed {len(sources)} generated Python files and imported {len(modules) + 1} client modules")


if __name__ == "__main__":
    main()
