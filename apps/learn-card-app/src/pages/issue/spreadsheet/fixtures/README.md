# Spreadsheet compatibility fixtures

`canvas-gradebook.csv` is the public fictional gradebook fixture from [Instructure Canvas](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/spec/fixtures/gradebooks/basic_course_with_sis_login_id.csv), copied unchanged. Upstream project license: [AGPL-3.0](https://github.com/instructure/canvas-lms/blob/1c9f0bb8013ed69c4f2efe11fd483025469b7e6c/LICENSE). It is test data, not a production student export.

The tests first verify that a gradebook with no email addresses cannot be sent. A derived in-memory variant supplies fictional emails to exercise Canvas header names, the Points Possible metadata row, and grade values.

CSV strings and SheetJS-generated XLSX workbooks cover quoting, locales, percentages, dates, formulas, and workbook limits. Representative sanitized exports produced by Google Sheets, Microsoft Excel, and a deployment's Canvas gradebook still belong in manual acceptance QA; these generated and upstream fixtures do not establish that QA.
