import { TRPCError } from '@trpc/server';
import { environment } from '@environment';

/** Signature authority is not package eligibility. Ecosystem-level package policy belongs here
 * when an ADR-010 analogue is adopted; catalog allowedListings never governs packages. */
export const assertWorkloadCurator = (publisherDid: string): void => {
    const curators = (environment.WORKLOAD_CURATOR_DIDS ?? '')
        .split(',')
        .map((did): string => did.trim());
    if (!curators.includes(publisherDid)) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Workload publisher is not an approved curator.',
        });
    }
};
