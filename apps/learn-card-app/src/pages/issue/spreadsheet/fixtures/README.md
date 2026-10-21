# Spreadsheet compatibility fixtures

`canvas-gradebook.csv` is the public fictional gradebook fixture from [Instructure Canvas](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/spec/fixtures/gradebooks/basic_course_with_sis_login_id.csv), copied unchanged. Upstream project license: [AGPL-3.0](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/LICENSE). It is test data, not a production student export.

The tests first verify that a gradebook with no email addresses cannot be sent. A derived in-memory variant supplies fictional emails to exercise Canvas header names, the Points Possible metadata row, and grade values.

`google-sheets-roster.csv` and `google-sheets-roster.xlsx` were exported by Google Sheets on 2026-10-21 from a newly created private sheet named **LC-2249 compatibility audit — fictional data**. All names, addresses, scores and links are fictional. These are the original downloaded bytes, not SheetJS-generated workbooks. The test checks both people's percentages, letter grades, numeric/zero credits, dates, evidence and leading-zero identifiers through mapping and `validateCredentialJsonLd`.

| File                        | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `google-sheets-roster.csv`  | `206fc654e58e681ae1f0968c4a6ae6bfd354f5661c0da13b2bab9e5519d27138` |
| `google-sheets-roster.xlsx` | `012fe49a965d3a8c0d288c33059dc1e9e99a4611a80e0a5da4987230a0fcce51` |

CSV strings and SheetJS-generated XLSX workbooks separately cover quoting, locales, formulas, and workbook limits. The Canvas fixture is upstream test data; it does not establish acceptance with a live Canvas gradebook export. Real Excel/Canvas roster exports still need acceptance QA. A Google-generated `.xlsx` is evidence for Google Sheets' XLSX export, not for Microsoft's Excel producer.
