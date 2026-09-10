import unittest
from compare import compare, safe


def finding(rule='rule', path='a.ts', fingerprint='hash', line=1):
    return {'ruleId': rule, 'partialFingerprints': {'primaryLocationLineHash': fingerprint}, 'locations': [{'physicalLocation': {'artifactLocation': {'uri': path}, 'region': {'startLine': line}}}]}


class ComparisonTests(unittest.TestCase):
    def test_line_shifts_match_and_different_rules_do_not(self):
        remaining, added, absent = compare([finding(), finding(rule='old')], [finding(line=99), finding(rule='new')])
        self.assertEqual((len(remaining), len(added), len(absent)), (1, 1, 1))
        self.assertEqual(added[0]['ruleId'], 'new')
        self.assertEqual(absent[0]['ruleId'], 'old')

    def test_duplicate_findings_are_not_lost(self):
        remaining, added, absent = compare([finding(), finding()], [finding()])
        self.assertEqual((len(remaining), len(added), len(absent)), (1, 0, 1))

    def test_report_escapes_untrusted_text(self):
        self.assertEqual(safe('<script>|`\n'), '&lt;script&gt;&#124;&#96; ')


if __name__ == '__main__':
    unittest.main()

class WorkflowMetadataTests(unittest.TestCase):
    def test_metadata_is_written_after_analysis_and_before_upload(self):
        from pathlib import Path
        workflow = (Path(__file__).resolve().parents[2] / '.github/workflows/codeql-full.yml').read_text()
        self.assertLess(workflow.index('uses: github/codeql-action/analyze@v4'), workflow.index('commit.txt'))
        self.assertLess(workflow.index('commit.txt'), workflow.index('uses: actions/upload-artifact@v4'))
