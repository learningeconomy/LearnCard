# Issue credentials from a spreadsheet

Use **Issue Credentials** to send one credential template to several people with different field values.

1. Choose a credential type and enter its details.
2. Choose **Specific people**, then **Upload spreadsheet**, or paste several spreadsheet rows into the people search.
3. Upload a CSV, TSV, or XLSX file. Files can contain up to 10,000 people and 200 columns and must be smaller than 10 MiB. For XLSX, select a visible worksheet.
4. Review the recipient email column and column-name row. Recipient detection uses email values; if both student and guardian columns contain emails, choose the intended recipients.
5. Choose **Review people** to open the recipient workspace. Desktop uses an editable table; phones use cards. Search the full roster or filter **Needs attention**. Each page contains at most 25 people. Fix invalid emails, duplicate recipients, missing required fields, invalid evidence links, and formulas without cached results, or **Skip** those rows.
6. Open **Credential fields** in the workspace to choose which fields are shared or different for each person. Headers match placeholders regardless of case, spaces, or underscores. Use the preview arrows to review each person.
7. Choose **Issue Credential**. Results distinguish sent, failed, waiting, and sends that need confirmation.

**Get CSV template** downloads the current field columns. With no recipients, it includes a marked example row; replace its email before issuing. **Download table** exports the current values. Uploading an edited table updates matching people and adds new ones. Keep the `__lc_run_id` and `__lc_row_id` columns: these preserve a row's identity even when correcting its email. These columns are never credential fields.

Evidence links and uploaded files become standard Open Badges Evidence entries. Importing a link does not fetch its contents.

```mermaid
flowchart LR
    Upload[Upload or paste] --> Review[Review and fix rows]
    Review --> Save[Save recovery data on this device]
    Save --> Send[Submit queued email batches]
    Send --> Results[Review results]
    Results --> Resume[Resume existing work]
    Results --> Retry[Retry definite failures]
```

## Start with a spreadsheet

You can also choose **Start from a link, file, or ID** before selecting a credential type. Upload a spreadsheet or paste its rows, review the recipient column, and choose **Add People**. The people and original cells remain available when choosing or changing the credential type.

Choose **Map columns** to open the column workspace. Each row shows the source column, example values, and its credential field. Choose **Include** to add it, or select an included column to remove it; the original cells remain available. Expand **Format options** for number and date settings.

| Column         | Credential field                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------- |
| Score or grade | An independent result linked to its scale; several grade columns can coexist.                                         |
| Credits        | A numeric credits-earned value, including zero.                                                                       |
| Hours          | Description text by default. To count hours as credits, choose **Credits earned** and enter the intended credit unit. |
| Evidence URL   | Standard Open Badges Evidence.                                                                                        |
| Awarded date   | When the achievement was awarded; issuance time remains separate.                                                     |
| Other text     | A personalized description field, preserving leading-zero identifiers.                                                |

Choose the spreadsheet's decimal format before adding numeric columns. Reviewed numeric values use a decimal point and no grouping separators. A percentage cell displayed as `95%` becomes a Percent result of `95`.

Choose an explicit date format for day/month or month/day text. An ISO calendar date keeps its day; a timestamp must include its timezone. Invalid dates and numbers stay visible for correction or skipping.

These mappings use the [Open Badges 3.0 fields](https://www.imsglobal.org/spec/ob/v3p0): standard Evidence, linked results, numeric credits, and awardedDate. Files and links do not require LearnCard-specific credential terms.

## Resume an interrupted run

Recovery data is saved in this browser's IndexedDB for the issuing account, network, and organization. Return to **Issue Credentials**, then choose **Restore Saved Run** and **Resume**. Stay on the original device and browser; clearing browser data removes recovery records. Recovery must save successfully before a send starts.

Email issuance continues on the server after leaving the page. Resume observes an existing batch or recovers its receipt using the original request. It does not restart successful rows. An unconfirmed submission older than the 24-hour replay window requires checking its results before another issuance.

**Retry Failed** and **Download Failed Rows** include only definite failures. Correct the exported failed rows and upload them into their saved run. Submitted rows remain in the run history and cannot be removed. Successful and uncertain rows are locked; definite failures remain editable for correction and retry. Sends that need confirmation are excluded from retry files; check their results before issuing again. Profile recipients are sent one at a time; a lost response needs confirmation because that send has no replay guarantee.

Settled recovery records are removed after 30 days. Unresolved records remain available for review. Use **Start Another Run** only when you intend a separate issuance.

Duplicate protection applies when restoring the same saved run or re-importing its exported CSV on this browser. Starting a new run from an original spreadsheet creates a new issuance and can send another credential to the same person.

Open **Review delivery issues** to search failed or unconfirmed sends in pages of 25. Correct definite failures in **Review people** before retrying; unconfirmed sends retain their recovery safeguards.

Choose **View delivery status** in the batch card to search every recipient and filter by Not sent, Queued, Sent, Failed, or Unconfirmed. The viewer updates as the active run receives results. The card comes into view once when sending starts; later updates leave your scroll position alone. The compact, full-width scene of colorful credential sheets moving through drifting clouds and the initial scroll respect your device’s reduced-motion setting.

Date fields use a calendar picker and a readable date. Timestamps are shown in UTC; changing the calendar date preserves the time. New dates use midnight UTC. Opening the workspace leaves the saved timestamp unchanged. Invalid source values stay visible until corrected.

Column mapping currently supports Open Badges credentials. Choose each Evidence or Portfolio column separately to include its links; importing the sheet alone does not add these fields. Selected columns stay visible with a checkmark so they can be removed. Exported CSVs distinguish mapped columns from the table’s separate Evidence link and preserve both on re-import.

The **Additional evidence** field and attachments in **Review people** supplement any evidence columns included through **Map columns**.
