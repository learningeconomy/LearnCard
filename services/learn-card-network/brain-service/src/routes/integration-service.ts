import { z } from 'zod';
import { t, openRouteWithoutInputCapture } from '@routes';
import {
    IntegrationGroupMetadata,
    requireServiceAccountAccess,
} from '@helpers/ecosystem-access.helpers';
import {
    SubmitRecordInputValidator,
    SubmitRecordResultValidator,
    submitProvisionedRecord,
} from '@helpers/record-release.helpers';

export const integrationServiceRouter = t.router({
    // Deliberately not the normal Group router: that router can expose subjects.
    readGroup: openRouteWithoutInputCapture
        .input(z.object({ groupId: z.string().min(1).max(200) }))
        .output(IntegrationGroupMetadata)
        .query(({ ctx, input }) =>
            requireServiceAccountAccess({
                principal: ctx.serviceAccount,
                resource: 'group',
                action: 'read',
                target: input.groupId,
            })
        ),
    // ADR-012 Transactional record-provisioning push; input is never logged or captured.
    submitRecord: openRouteWithoutInputCapture
        .input(SubmitRecordInputValidator)
        .output(SubmitRecordResultValidator)
        .mutation(({ ctx, input }) => submitProvisionedRecord(ctx.serviceAccount, input)),
});
export type IntegrationServiceRouter = typeof integrationServiceRouter;
