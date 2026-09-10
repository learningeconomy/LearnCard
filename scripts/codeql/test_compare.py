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
