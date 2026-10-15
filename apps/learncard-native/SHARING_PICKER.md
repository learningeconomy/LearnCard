# Sharing picker for larger collections

October 15, 2026. Entry: header **+ → Share credentials**. Applies to selecting personal credentials for an existing LearnCard share link, not issuing a reusable creation.

## Interaction

- Search title, issuer and description. Multiple words combine, ignoring case and accents.
- **Category & date** opens a native filter sheet. Choose multiple semantic Passport categories, including Portfolio and Qualifications. No category selected means all categories. Family records stay in Families; unknown categories remain under Other.
- Dates mean **credential issue date**, not collection arrival. Any date, last 30 calendar days, this calendar year, and custom inclusive dates are available. Local calendar boundaries apply. Records with an unavailable issue date remain visible under Any date.
- Sort newest first, oldest first, title or issuer. Text sorting uses the selected locale and natural numeric ordering; ties have a stable record-ID order.
- Rows show supplied/fallback artwork, title, issuer, category and date. A clear selected outline/checkmark supplements the color.
- **Selected** shows every explicit choice, including items hidden by the current search/date/category filters. It ignores those filters, making it an audit of the selection. Switching back preserves the search and filters. Back from review preserves both selection and query.
- The footer keeps the selected count, Clear selection and Review selection accessible independently of the list. Up to 50 items may be selected, matching the existing share-link contract. At the limit, unselected rows are disabled; selected rows can still be removed. There is no implicit select-all operation.

## Paging and disclosure

The existing account runtime reads the LearnCloud personal index in pages of thirty and opens original credential content. Ordinary browsing requests later pages near the list bottom. Active search/category/date filters, oldest order and alphabetical order continue through remaining pages automatically. Results arrive progressively, with a progress indicator and an explicit incomplete-result caption until the final page. Empty internal index pages do not strand the browsing spinner.

There is no new backend index or server-side issuance-date query. Opening hundreds of remote credentials can take time, especially on a slow connection. Partial results remain usable. Failed reads retain the previous records and selection, show an explicit retry, and never become a completed empty state. Missing/repeated/cyclic cursors are refused before an automatic loop. Leaving the picker cancels subsequent reads; an in-flight read can complete. A later account refresh is still needed for changes made elsewhere during this session.

Filters and incoming pages cannot add items to the selection. Live selection requires an available original payload; unavailable records get an explanation rather than an empty export. The review blocks publication if a selected record disappears. Only selected IDs reach the existing share-link flow, which continues to preserve complete original credentials and public endorsements, require explicit publication confirmation, and support the existing expiry/passcode options. Read-only browsing never publishes anything.

## Source landmarks

| Responsibility                          | Source                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------ |
| Filter/date/sort and selection limit    | `ios/NativeCore/Sources/LearnCardNativeCore/CredentialPickerQuery.swift` |
| Cancellable paging/error/retry          | `ios/NativeCore/Sources/LearnCardNativeSDK/CredentialPickerLoader.swift` |
| Artwork list, filters, selection footer | `ios/Sources/ShareCredentialPicker.swift`                                |
| Review/publication boundary             | `ios/Sources/ShareCredentialsView.swift`                                 |
| Runtime cursor validation               | `account-runtime/collection-pagination.ts`, `account-runtime/runtime.ts` |
| Four-locale copy                        | `localization/Localizable.xcstrings`                                     |

The existing drawn design system supplies the artwork, neutral canvas, category colors, substantial type and touch sizes. No new generated bitmap is needed for these controls. English, Spanish, French and Arabic cover the new picker; legacy publication/review copy is not a complete localization migration.

## Regression coverage

Core query tests use 300 records, accent-insensitive multiword search, category combinations, inclusive local date boundaries, relative ranges, stable sorts, unchanged payloads, hidden selections and the 50-item cap. SDK tests cover a 243-item paged collection, a match on the last page, error/explicit retry, empty display pages, a filter applied during an existing read, cancellation, and plural/localization coverage. Bun tests reject non-advancing cursors.

Simulator tests cover combined categories with hidden selections, an exact review of those selections, later-page search, a date filter that removes a selected item from results, reset/sort, unsigned sample sharing, and Arabic dark/accessibility type with custom date controls. The existing multiple-credential/system-share test remains. All are discovered by the existing branch CI; synthetic fixtures do not prove a live share publication. See [TESTING](TESTING.md) for actual run results.
