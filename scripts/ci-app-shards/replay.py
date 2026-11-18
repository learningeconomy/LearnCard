"""Compare the real affected Test graph and an app-only Vitest split on hosted runners."""
import collections
import json
import os
from pathlib import Path
import subprocess
import sys

APP = "learn-card-app"
APP_ROOT = "apps/learn-card-app"
TMP = Path(os.environ.get("RUNNER_TEMP", "/tmp"))
OUT = TMP / "shard-evidence"

def read(path):
    return json.loads(Path(path).read_text())

def require(condition, message):
    if not condition:
        raise RuntimeError(message)

def prepare(role):
    graph = read(TMP / "full-graph.json")["tasks"]["tasks"]
    require(len(graph) == 104 and APP + ":test" in graph, "Unexpected frozen workload")
    path = Path("scripts/ci-test-retries/reporter.ts")
    source = path.read_text()
    marker = "        const report = {"
    require(source.count(marker) == 1, "Unexpected retry reporter")
    source = "import { createHash } from 'node:crypto';\n" + source
    observe = """
        if (this.project === 'apps/learn-card-app' && process.env.APP_REPLAY_FILES) {
            const files = modules.map(module => ({
                path: relative(this.repositoryRoot, module.moduleId),
                cases: [...module.children.allTests()].map(test => createHash('sha256')
                    .update(JSON.stringify([test.fullName, test.location?.line ?? null, test.result().state]))
                    .digest('hex')).sort()
            })).sort((a, b) => a.path.localeCompare(b.path));
            writeFileSync(process.env.APP_REPLAY_FILES, JSON.stringify(files));
        }
"""
    path.write_text(source.replace(marker, observe + marker))
    if role.startswith("app-"):
        package = Path(APP_ROOT, "package.json")
        data = read(package)
        data["scripts"]["test"] += " --shard=" + role[-1] + "/2"
        package.write_text(json.dumps(data))
    OUT.mkdir(exist_ok=True)

def evidence(role):
    graph = read(TMP / "full-graph.json")["tasks"]["tasks"]
    tasks = {}
    for event in read("shard-trace.json"):
        if event.get("ph") == "X" and event.get("args", {}).get("target", {}).get("project"):
            name = event["name"]
            require(name not in tasks and event["args"]["status"] == "success", "Missing fresh success: " + name)
            tasks[name] = round(event["dur"] / 1e6, 3)
    want = {t for t in graph if graph[t]["target"]["target"] == "test"}
    if role == "remainder":
        want.remove(APP + ":test")
    elif role.startswith("app-"):
        want = {APP + ":test"}
    require({t for t in tasks if t.endswith(":test")} == want, "Wrong test project selection")
    if role == "control":
        require(set(tasks) == set(graph), "Control task set changed")
    reports = []
    for path in Path(os.environ["LC_CI_TEST_REPORT_DIR"]).glob("vitest-*"):
        r = read(path / "report.json")
        require(r["reason"] == "passed" and r["counts"]["failed"] == r["counts"]["pending"] == r["failedModules"] == r["unhandledErrors"] == 0, "Unsuccessful report")
        reports.append({"project": r["project"], **r["counts"]})
    files = read(os.environ["APP_REPLAY_FILES"]) if role != "remainder" else []
    report = {"role": role, "expectedTasks": sorted(graph), "tasks": tasks, "reports": reports, "files": files}
    (OUT / (role + ".json")).write_text(json.dumps(report))
    print(f"{role}: {len(tasks)} fresh tasks, {len(reports)} Vitest reports, {len(files)} app files")

def validate(folder, include_control):
    split = [read(folder / (role + ".json")) for role in ("remainder", "app-1", "app-2")]
    require(all(r["expectedTasks"] == split[0]["expectedTasks"] for r in split), "Different graphs")
    require(set().union(*(set(r["tasks"]) for r in split)) == set(split[0]["expectedTasks"]), "Incomplete candidate graph")
    files = sorted(split[1]["files"] + split[2]["files"], key=lambda f: f["path"])
    baseline_paths = sorted(str(p) for p in Path(APP_ROOT, "src").rglob("*.test.*") if p.suffix in (".ts", ".tsx"))
    require([f["path"] for f in files] == baseline_paths and len(files) == 481, "Incomplete or overlapping shard files")
    require(all(r["files"] and any(r["reports"]) for r in split[1:]), "Empty shard")
    if include_control:
        control = read(folder / "control.json")
        require(files == sorted(control["files"], key=lambda f: f["path"]), "App case identity or verdict differs from control")
        def totals(rows):
            result = collections.Counter()
            for row in rows:
                for key in ("passed", "skipped", "failed", "pending"):
                    result[row["project"], key] += row[key]
            return result
        require(totals(control["reports"]) == totals([row for r in split for row in r["reports"]]), "Full-suite report totals differ")
    print(f"Validated 104 unique tasks, {len(files)} app files, {sum(len(f['cases']) for f in files)} cases")

if __name__ == "__main__":
    op, arg = sys.argv[1:3]
    if op == "prepare": prepare(arg)
    elif op == "evidence": evidence(arg)
    else: validate(Path(arg), op == "compare")
