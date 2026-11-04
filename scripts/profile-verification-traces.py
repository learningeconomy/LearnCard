#!/usr/bin/env python3
"""Summarize private Playwright v8 traces without exporting their payloads.

Read archives in place; never extract screenshots, sources, URLs, selectors or errors.
This is diagnostic output, not verification success or exhaustive wall-time accounting.
"""

import argparse
import json
import math
import os
import sys
import zlib
from pathlib import Path
import zipfile

FEATURES = (
    "account", "language", "credentials", "sharing", "contacts", "app-store",
    "sdk", "cli", "sdk-to-app", "consent-flow", "docs", "ai-sessions",
)
# Protocol class/method pairs from the repository-pinned Playwright 1.62.1.
# Titles/apiName may contain user data; never use them as operation labels.
OPERATIONS = {
    ("Frame", "goto"): "navigation.goto",
    ("Page", "reload"): "navigation.reload",
    ("Page", "goBack"): "navigation.back",
    ("Page", "goForward"): "navigation.forward",
    ("Page", "screenshot"): "evidence.screenshot",
    ("Frame", "ariaSnapshot"): "evidence.aria-snapshot",
    ("Frame", "expect"): "assertion",
    ("Frame", "click"): "interaction.click",
    ("Frame", "fill"): "interaction.input",
    ("Frame", "press"): "interaction.input",
    ("Frame", "focus"): "interaction.input",
    ("Frame", "check"): "interaction.input",
    ("Frame", "selectOption"): "interaction.input",
    ("Frame", "waitForSelector"): "wait.selector",
    ("Frame", "waitForTimeout"): "wait.timeout",
    ("Frame", "waitForFunction"): "wait.function",
    ("Frame", "evaluateExpression"): "dom.evaluate",
    ("Frame", "evaluateExpressionHandle"): "dom.evaluate",
    ("Frame", "getAttribute"): "dom.read",
    ("Frame", "textContent"): "dom.read",
    ("Frame", "innerText"): "dom.read",
    ("Frame", "isVisible"): "dom.read",
    ("Frame", "queryCount"): "dom.read",
    ("BrowserContext", "newPage"): "page.create",
    ("BrowserContext", "storageState"): "evidence.session",
}
MAX_TRACE_BYTES = 256 * 1024 * 1024
MAX_TOTAL_TRACE_BYTES = 1024 * 1024 * 1024
MAX_LINE_BYTES = 4 * 1024 * 1024
MAX_CALLS = 100_000
MAX_DURATION_MS = 86_400_000


def number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def union_ms(intervals):
    """Count overlapping driver calls once within this feature's browser clock."""
    total = 0
    end = None
    for start, stop in sorted(intervals):
        if end is None or start > end:
            total += stop - start
            end = stop
        elif stop > end:
            total += stop - end
            end = stop
    return round(total)


def empty_diagnostics():
    return dict(archives=0, unsupportedArchives=0, unreadableArchives=0,
                limitedArchives=0, malformedRows=0, incompleteCalls=0, unknownCalls=0)


def read_archive(path, diagnostics, budget=None):
    """Return numeric spans with fixed operation labels; discard all other fields."""
    diagnostics["archives"] += 1
    spans = []
    try:
        with zipfile.ZipFile(path) as archive:
            files = [info for info in archive.infolist() if info.filename.endswith(".trace")]
            # Playwright uses stored/deflated members. Other decompressors may allocate
            # unbounded output internally even when ZipExtFile caps the returned bytes.
            if any(info.compress_type not in (zipfile.ZIP_STORED, zipfile.ZIP_DEFLATED)
                   for info in files):
                diagnostics["unsupportedArchives"] += 1
                return []
            trace_bytes = sum(info.file_size for info in files)
            if (not files or trace_bytes > MAX_TRACE_BYTES
                    or (budget is not None and trace_bytes > budget["bytes"])):
                diagnostics["limitedArchives"] += 1
                return []
            if budget is not None:
                budget["bytes"] -= trace_bytes
            calls = 0
            for info in files:
                pending = {}
                supported = False
                with archive.open(info) as stream:
                    while True:
                        line = stream.readline(MAX_LINE_BYTES + 1)
                        if not line:
                            break
                        if len(line) > MAX_LINE_BYTES:
                            diagnostics["malformedRows"] += 1
                            while line and not line.endswith(b"\n"):
                                line = stream.readline(MAX_LINE_BYTES + 1)
                            continue
                        try:
                            event = json.loads(line)
                        except (ValueError, UnicodeError):
                            diagnostics["malformedRows"] += 1
                            continue
                        if not isinstance(event, dict):
                            diagnostics["malformedRows"] += 1
                            continue
                        kind = event.get("type")
                        if kind == "context-options":
                            if event.get("version") != 8:
                                diagnostics["unsupportedArchives"] += 1
                                return []
                            supported = True
                        elif supported and kind == "before":
                            calls += 1
                            if calls > MAX_CALLS:
                                diagnostics["limitedArchives"] += 1
                                return []
                            pair = (event.get("class"), event.get("method"))
                            operation = (
                                OPERATIONS.get(pair)
                                if all(isinstance(value, str) for value in pair) else None
                            )
                            call_id, start = event.get("callId"), event.get("startTime")
                            if not operation:
                                diagnostics["unknownCalls"] += 1
                            elif isinstance(call_id, str) and number(start) and start >= 0:
                                if call_id in pending:
                                    diagnostics["malformedRows"] += 1
                                else:
                                    pending[call_id] = (operation, start)
                            else:
                                diagnostics["malformedRows"] += 1
                        elif supported and kind == "after":
                            call_id = event.get("callId")
                            call = pending.pop(call_id, None) if isinstance(call_id, str) else None
                            if call is None:
                                continue
                            operation, start = call
                            stop = event.get("endTime")
                            if not number(stop) or not 0 <= stop - start <= MAX_DURATION_MS:
                                diagnostics["malformedRows"] += 1
                                continue
                            spans.append((operation, start, stop, bool(event.get("error"))))
                if not supported:
                    diagnostics["unsupportedArchives"] += 1
                    return []
                diagnostics["incompleteCalls"] += len(pending)
    except (OSError, zipfile.BadZipFile, RuntimeError, EOFError, ValueError, zlib.error):
        diagnostics["unreadableArchives"] += 1
        return []
    return spans


def summarize(spans, diagnostics):
    rows = []
    for operation in sorted(set(OPERATIONS.values())):
        selected = [s for s in spans if s[0] == operation]
        if not selected:
            continue
        durations = [stop - start for _, start, stop, _ in selected]
        rows.append(dict(operation=operation, calls=len(selected),
                         failedCalls=sum(int(s[3]) for s in selected),
                         totalMs=round(sum(durations)), maxMs=round(max(durations)),
                         activeMs=union_ms([(s[1], s[2]) for s in selected])))
    return dict(diagnostics=diagnostics,
                knownBrowserActiveMs=union_ms([(s[1], s[2]) for s in spans]),
                operations=rows)


def profile(directory):
    runs = directory / "runs"
    results = []
    budget = {"bytes": MAX_TOTAL_TRACE_BYTES}
    if runs.is_symlink() or not runs.is_dir():
        return dict(schemaVersion=1, runs=[])
    for run in sorted(runs.iterdir()):
        if run.is_symlink() or not run.is_dir():
            continue
        features = []
        for feature in FEATURES:
            folder = run / feature
            if folder.is_symlink() or not folder.is_dir():
                continue
            diagnostics = empty_diagnostics()
            spans = []
            for index, trace in enumerate(sorted(folder.glob("*-trace.zip"))):
                if index >= 64:
                    diagnostics["limitedArchives"] += 1
                    break
                if trace.is_file() and not trace.is_symlink():
                    spans.extend(read_archive(trace, diagnostics, budget))
            features.append(dict(feature=feature, **summarize(spans, diagnostics)))
        results.append(dict(features=features))
    return dict(schemaVersion=1, runs=results)


def render(data):
    lines = ["# Verification browser-call profile", "",
             "Diagnostic only. Fixed operation names, counts and numeric durations; no raw trace payloads.", "",
             "API time includes browser/actionability/load waits. It is not server CPU time.",
             "Active time merges overlapping calls within a feature. Operation rows can overlap; do not add them together.",
             "Active time assumes a shared driver clock across that feature's traces; independent driver processes are not comparable.",
             "SDK work, untraced setup, trace/context closure and gaps between calls are outside this profile.",
             "Missing, unsupported or incomplete traces are reported, never verification success.", ""]
    for index, run in enumerate(data["runs"], 1):
        lines.extend([f"## Catalog run {index}", ""])
        for feature in run["features"]:
            lines.extend([f"### {feature['feature']}", "",
                          f"Known browser active time: {feature['knownBrowserActiveMs'] / 1000:.3f}s.",
                          f"Trace diagnostics: `{json.dumps(feature['diagnostics'], sort_keys=True)}`", "",
                          "| Operation | Calls | Failed | Sum (s) | Active (s) | Max (s) |",
                          "| --- | ---: | ---: | ---: | ---: | ---: |"])
            for row in feature["operations"]:
                lines.append(f"| {row['operation']} | {row['calls']} | {row['failedCalls']} | "
                             f"{row['totalMs'] / 1000:.3f} | {row['activeMs'] / 1000:.3f} | {row['maxMs'] / 1000:.3f} |")
            lines.append("")
    return "\n".join(lines) + "\n"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("stack_directory", type=Path)
    parser.add_argument("output_directory", type=Path)
    args = parser.parse_args()
    os.umask(0o077)
    data = profile(args.stack_directory)
    args.output_directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    (args.output_directory / "browser-profile.json").write_text(json.dumps(data, indent=2) + "\n")
    markdown = render(data)
    (args.output_directory / "browser-profile.md").write_text(markdown)
    if os.environ.get("GITHUB_STEP_SUMMARY"):
        with Path(os.environ["GITHUB_STEP_SUMMARY"]).open("a") as summary:
            summary.write(markdown)


if __name__ == "__main__":
    try:
        main()
    except Exception:
        # Unexpected parser/I/O errors must not print private trace values or paths in CI.
        print("Browser-call profiling failed; inspect private runner evidence.", file=sys.stderr)
        raise SystemExit(1)
