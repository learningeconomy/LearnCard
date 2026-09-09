---
'learn-card-app': patch
'@learncard/credential-library': patch
---

feat: render nested Assessment credentials in CLR transcripts

Assessments (`achievementType: Assessment`) were classified by the CLR normalizer but never
shown on the full transcript. They now get an Assessments section beneath Course History and a
detail panel that mirrors the course panel: rubric-based assessments show each criterion with
the achieved level, a proficiency scale and per-level descriptions; plain score assessments
(e.g. ACT) show scores with their min/max; both show framework alignments, evidence and the
source credential. Adds a `clr/demo-isd-diploma-assessments` fixture exercising rubric
`RubricCriterionLevel` results with `achievedLevel` and Carnegie Skills Progressions alignments.
