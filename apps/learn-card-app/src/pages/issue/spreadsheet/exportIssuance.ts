import { getFriendlyIssueError } from '../issueErrors';
import type { IssuanceRun } from './issuanceTypes';
import { effectiveRowValues, exportRosterCsv } from './roster';
import { recipientKey } from '../components/recipientTypes';

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
        run.draft.recipients.map(row => {
            const key = recipientKey(row);
            const outcome = run.outcomes[key];
            let frozen = outcome?.templateData;
            if (['queued', 'sent', 'confirming'].includes(outcome?.state ?? 'ready')) {
                if (!frozen) {
                    const attempt = [...run.attempts]
                        .reverse()
                        .find(item => item.rowIds.includes(key));
                    const index = attempt?.rowIds.indexOf(key) ?? -1;
                    frozen = attempt?.body.items[index]?.configuration?.templateData;
                }
                if (frozen)
                    return [
                        key,
                        Object.fromEntries(
                            Object.entries(frozen).filter(
                                (entry): entry is [string, string] => typeof entry[1] === 'string'
                            )
                        ),
                    ];
            }
            return [
                key,
                effectiveRowValues(row, variables, run.scopes, run.shared, run.draft.values),
            ];
        })
    );
    return exportRosterCsv(
        { ...run.draft, values },
        variables,
        Object.fromEntries(variables.map(name => [name, 'perRecipient' as const])),
        {},
        failures
    );
};
