import { getFriendlyIssueError } from '../issueErrors';
import type { IssuanceRun } from './issuanceTypes';
import { effectiveRowValues, exportRosterCsv } from './roster';
import { recipientKey, type Recipient } from '../components/recipientTypes';

/** Accepted/uncertain rows display and compare the exact values frozen for submission. */
export const issuanceRowValues = (
    run: IssuanceRun,
    row: Recipient,
    variables: string[]
): Record<string, string> => {
    const key = recipientKey(row);
    const outcome = run.outcomes[key];
    if (['queued', 'sent', 'confirming'].includes(outcome?.state ?? 'ready')) {
        let frozen = outcome?.templateData;
        if (!frozen) {
            const attempt = [...run.attempts].reverse().find(item => item.rowIds.includes(key));
            const index = attempt?.rowIds.indexOf(key) ?? -1;
            frozen = attempt?.body.items[index]?.configuration?.templateData;
        }
        if (frozen)
            return Object.fromEntries(
                Object.entries(frozen).filter(
                    (entry): entry is [string, string] => typeof entry[1] === 'string'
                )
            );
    }
    return effectiveRowValues(row, variables, run.scopes, run.shared, run.draft.values);
};

/** A retry file contains only definite failures, never accepted or uncertain work. */
export const exportIssuanceCsv = (
    run: IssuanceRun,
    variables: string[],
    failuresOnly = false
): string => {
    const failures = failuresOnly
        ? Object.fromEntries(
              Object.entries(run.outcomes)
                  .filter(([, outcome]) => outcome.state === 'failed')
                  .map(([rowId, outcome]) => [
                      rowId,
                      getFriendlyIssueError({ message: outcome.error?.message }, 'people').message,
                  ])
          )
        : undefined;
    const values = Object.fromEntries(
        run.draft.recipients.map(row => [recipientKey(row), issuanceRowValues(run, row, variables)])
    );
    return exportRosterCsv(
        { ...run.draft, values },
        variables,
        Object.fromEntries(variables.map(name => [name, 'perRecipient' as const])),
        {},
        failures
    );
};
