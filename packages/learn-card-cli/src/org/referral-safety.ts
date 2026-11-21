import { CliError } from '../errors';
import type { OrgApplyResult, OrgChange } from './apply';
import type { ReferralHandoff } from './referrals';

/** Only locally authored messages may cross the referral error boundary. */
export class ReferralConfigurationError extends Error {}

export class ReferralApplyError extends CliError {
    constructor(
        phase: string,
        error: unknown,
        changes: OrgChange[],
        referrals: ReferralHandoff[],
        outputs?: Omit<OrgApplyResult['outputs'], 'referrals'>
    ) {
        const reason =
            error instanceof ReferralConfigurationError
                ? error.message
                : 'The operation could not be confirmed; its response was omitted.';
        const progress = JSON.stringify({
            // Never serialize exception bodies, endpoint URLs, or service responses.
            changes: changes.map(({ resource, name, action, id }) => ({
                resource,
                name: resource === 'webhook' ? 'webhook' : name,
                action,
                id,
            })),
            outputs: { ...outputs, referrals },
        });
        super(`Referral apply stopped during ${phase}. ${reason}`, {
            code: 'REFERRAL_APPLY_INCOMPLETE',
            hint:
                'Keep the same spec, network, identity and private handoff file when retrying. ' +
                'Confirmed changes were not rolled back; a failed request may have committed. ' +
                'Restore any missing issued webhook secret securely from your secret store; ' +
                'rotation requires a separate explicit action. Do not rename resources to retry. ' +
                `Progress: ${progress}`,
            detail: progress,
        });
    }
}
