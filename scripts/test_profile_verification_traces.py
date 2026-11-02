"""Safety and accounting contracts for the diagnostic trace profiler."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import zipfile

spec = importlib.util.spec_from_file_location("profiler", Path(__file__).with_name("profile-verification-traces.py"))
profiler = importlib.util.module_from_spec(spec)
spec.loader.exec_module(profiler)


def event_pair(call="call@1", operation=("Frame", "goto"), start=100, stop=300, **extra):
    return [dict(type="before", callId=call, startTime=start, **{"class": operation[0]},
                 method=operation[1], title="DO-NOT-PUBLISH", params={"seed": "DO-NOT-PUBLISH"}),
            dict(type="after", callId=call, endTime=stop, **extra)]


class ProfileTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.folder = self.root / "runs" / "PRIVATE-RUN" / "sharing"
        self.folder.mkdir(parents=True)

    def tearDown(self):
        self.temp.cleanup()

    def archive(self, events, name="PRIVATE-ACTOR-trace.zip", version=8):
        path = self.folder / name
        records = [dict(type="context-options", version=version, title="DO-NOT-PUBLISH")] + events
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("trace.trace", "\n".join(json.dumps(e) for e in records))
            archive.writestr("resources/DO-NOT-PUBLISH", "DO-NOT-PUBLISH")
        return path

    def feature(self):
        return profiler.profile(self.root)["runs"][0]["features"][0]

    def test_only_fixed_names_and_numeric_accounting_leave_private_traces(self):
        events = event_pair() + event_pair("call@2", ("Page", "screenshot"), 400, 450,
                                          error={"message": "DO-NOT-PUBLISH"})
        events += [dict(type="log", message="https://DO-NOT-PUBLISH", time=300),
                   dict(type="frame-snapshot", snapshot={"seed": "DO-NOT-PUBLISH"})]
        self.archive(events)
        data = profiler.profile(self.root)
        text = json.dumps(data) + profiler.render(data)
        for private in ["DO-NOT-PUBLISH", "PRIVATE-ACTOR", "PRIVATE-RUN", "resources", "call@"]:
            self.assertNotIn(private, text)
        feature = data["runs"][0]["features"][0]
        self.assertEqual(feature["knownBrowserActiveMs"], 250)
        rows = {r["operation"]: r for r in feature["operations"]}
        self.assertEqual(rows["navigation.goto"]["totalMs"], 200)
        self.assertEqual(rows["evidence.screenshot"]["failedCalls"], 1)

    def test_overlap_is_merged_without_claiming_wall_time_or_dropping_api_sums(self):
        self.archive(event_pair("a", start=0, stop=100) + event_pair("b", start=50, stop=150)
                     + event_pair("c", ("Page", "screenshot"), 100, 200))
        feature = self.feature()
        self.assertEqual(feature["knownBrowserActiveMs"], 200)
        row = next(r for r in feature["operations"] if r["operation"] == "navigation.goto")
        self.assertEqual((row["calls"], row["totalMs"], row["activeMs"], row["maxMs"]),
                         (2, 200, 150, 100))

    def test_partial_invalid_and_unknown_calls_are_explicit_diagnostics(self):
        events = event_pair(stop=-1) + event_pair("unknown", ("DO-NOT-PUBLISH", "DO-NOT-PUBLISH"))
        events += [dict(type="before", callId="unfinished", startTime=100,
                        **{"class": "Frame"}, method="goto"),
                   dict(type="before", callId="malicious", startTime=100,
                        **{"class": ["DO-NOT-PUBLISH"]}, method={"private": True}),
                   None, "DO-NOT-PUBLISH"]
        self.archive(events)
        feature = self.feature()
        self.assertEqual(feature["operations"], [])
        self.assertEqual(feature["diagnostics"]["incompleteCalls"], 1)
        self.assertEqual(feature["diagnostics"]["unknownCalls"], 2)
        self.assertEqual(feature["diagnostics"]["malformedRows"], 3)
        self.assertNotIn("DO-NOT-PUBLISH", json.dumps(feature))

    def test_future_trace_version_is_not_treated_as_measured_zero(self):
        self.archive(event_pair(), version=9)
        feature = self.feature()
        self.assertEqual(feature["diagnostics"]["unsupportedArchives"], 1)
        self.assertEqual(feature["operations"], [])

    def test_bad_archive_and_limits_are_bounded_and_visible(self):
        (self.folder / "broken-trace.zip").write_text("DO-NOT-PUBLISH")
        self.archive(event_pair())
        with patch.object(profiler, "MAX_TRACE_BYTES", 10):
            feature = self.feature()
        self.assertEqual(feature["diagnostics"]["unreadableArchives"], 1)
        self.assertEqual(feature["diagnostics"]["limitedArchives"], 1)
        self.assertEqual(feature["operations"], [])

    def test_symlinks_and_unknown_feature_folders_are_not_read(self):
        self.archive(event_pair())
        unknown = self.root / "runs" / "PRIVATE-RUN" / "DO-NOT-PUBLISH"
        unknown.mkdir()
        (unknown / "ignored-trace.zip").write_text("DO-NOT-PUBLISH")
        (self.folder / "linked-trace.zip").symlink_to(unknown / "ignored-trace.zip")
        self.assertEqual(self.feature()["diagnostics"]["archives"], 1)
        self.assertEqual(len(profiler.profile(self.root)["runs"][0]["features"]), 1)

    def test_missing_directory_is_no_profile_not_success(self):
        data = profiler.profile(self.root / "missing")
        self.assertEqual(data, {"schemaVersion": 1, "runs": []})
        self.assertNotIn('"success"', json.dumps(data))

    def test_call_limit_discards_partial_measurements(self):
        self.archive(event_pair("a") + event_pair("b"))
        with patch.object(profiler, "MAX_CALLS", 1):
            feature = self.feature()
        self.assertEqual(feature["operations"], [])
        self.assertEqual(feature["diagnostics"]["limitedArchives"], 1)

    def test_malformed_rows_and_oversized_lines_do_not_copy_raw_bytes(self):
        path = self.folder / "malformed-trace.zip"
        records = (json.dumps(dict(type="context-options", version=8)) + "\n"
                   + "DO-NOT-PUBLISH" * 20 + "\n" + "\xff" + "\n")
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("trace.trace", records)
        with patch.object(profiler, "MAX_LINE_BYTES", 100):
            feature = self.feature()
        self.assertEqual(feature["diagnostics"]["malformedRows"], 2)
        self.assertNotIn("DO-NOT-PUBLISH", profiler.render(profiler.profile(self.root)))

    def test_total_byte_budget_bounds_scanning_across_archives(self):
        path = self.archive(event_pair(), name="a-trace.zip")
        self.archive(event_pair(), name="b-trace.zip")
        with zipfile.ZipFile(path) as archive:
            size = archive.getinfo("trace.trace").file_size
        with patch.object(profiler, "MAX_TOTAL_TRACE_BYTES", size + 1):
            feature = self.feature()
        self.assertEqual(feature["diagnostics"]["limitedArchives"], 1)
        self.assertEqual(feature["operations"][0]["calls"], 1)

    def test_duplicate_call_ids_are_visible_and_do_not_overwrite_start(self):
        before, after = event_pair(start=0, stop=200)
        duplicate = dict(before, startTime=150)
        self.archive([before, duplicate, after])
        feature = self.feature()
        self.assertEqual(feature["diagnostics"]["malformedRows"], 1)
        self.assertEqual(feature["operations"][0]["totalMs"], 200)

    def test_missing_version_cannot_look_like_supported_measurements(self):
        path = self.folder / "no-version-trace.zip"
        with zipfile.ZipFile(path, "w") as archive:
            archive.writestr("trace.trace", "\n".join(json.dumps(e) for e in event_pair()))
        feature = self.feature()
        self.assertEqual(feature["diagnostics"]["unsupportedArchives"], 1)
        self.assertEqual(feature["operations"], [])

    def test_non_finite_bool_and_excessive_durations_are_rejected(self):
        self.archive(event_pair("a", start=True) + event_pair("b", stop=float("inf"))
                     + event_pair("c", stop=profiler.MAX_DURATION_MS + 101))
        feature = self.feature()
        self.assertEqual(feature["operations"], [])
        self.assertEqual(feature["diagnostics"]["malformedRows"], 3)


if __name__ == "__main__":
    unittest.main()
