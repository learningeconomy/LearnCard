import { TRPCError } from '@trpc/server';
import { z } from 'zod';
import {
    CampaignAudienceInputValidator,
    CampaignDispatchPreviewValidator,
    CampaignDispatchOptionsValidator,
    CampaignEventValidator,
    CampaignIdValidator,
    CampaignStatsValidator,
    CampaignStatusValidator,
    CampaignValidator,
    CreateCampaignInputValidator,
    ListCampaignsInputValidator,
    MyCampaignValidator,
    PageCampaignAudienceInputValidator,
    PaginatedCampaignAudienceValidator,
    PaginatedCampaignsValidator,
    UpdateCampaignInputValidator,
    type Campaign,
    type CampaignStats,
    type MyCampaign,
    type PaginatedCampaignAudience,
    type PaginatedCampaigns,
} from '@learncard/types';

import { t, profileRouteWithoutInputCapture } from '@routes';
import { isCampaignAdmin } from 'src/constants/campaigns';
import { enforceRateLimits } from '@helpers/rateLimit.helpers';
import { trace } from '@tracing';
import { createCampaign } from '@accesslayer/campaign/create';
import {
    getCampaign,
    listCampaigns,
    getLiveCampaignsForProfile,
    getCampaignStats,
} from '@accesslayer/campaign/read';
import { getCampaignDispatchPreview } from '@accesslayer/campaign/dispatch';
import { updateCampaign } from '@accesslayer/campaign/update';
import { deleteCampaign } from '@accesslayer/campaign/delete';
import {
    addCampaignAudience,
    previewCampaignAudience,
    pageCampaignAudience,
} from '@accesslayer/campaign/audience';
import { enrollInCampaign, recordCampaignEvent } from '@accesslayer/campaign/state';
import { dispatchCampaign } from '@helpers/campaign-queue.helpers';
import { sendCampaignTestToMe } from '@helpers/campaign-notifications.helpers';
import { getCampaignTests, acknowledgeCampaignTest } from '@accesslayer/campaign/test';

const campaignAdminRoute = profileRouteWithoutInputCapture
    .meta({ requiredScope: 'campaigns:admin' })
    .use(({ ctx, next }) => {
        if (!isCampaignAdmin(ctx.user.profile.profileId))
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Campaign administrator access required',
            });
        return next({ ctx });
    });

const campaignUserRoute = profileRouteWithoutInputCapture.use(async ({ ctx, next }) => {
    await enforceRateLimits([
        {
            key: `campaigns:user:${ctx.user.profile.profileId}`,
            limit: 60,
            windowSeconds: 60,
            description: '60 campaign requests per profile per minute',
        },
    ]);
    return next({ ctx });
});

const idInput = z.object({ campaignId: CampaignIdValidator }).strict();
const noInput = z.object({}).strict().default({});

export const campaignsRouter = t.router({
    sendTestToMe: campaignAdminRoute
        .input(idInput)
        .output(z.boolean())
        .mutation(async ({ ctx, input }): Promise<boolean> =>
            trace('route', 'campaigns:sendTestToMe', () =>
                sendCampaignTestToMe(input.campaignId, ctx.user.profile)
            )
        ),
    previewDispatch: campaignAdminRoute
        .input(idInput)
        .output(CampaignDispatchPreviewValidator)
        .query(async ({ input }) =>
            trace('route', 'campaigns:previewDispatch', () =>
                getCampaignDispatchPreview(input.campaignId)
            )
        ),
    dispatch: campaignAdminRoute
        .input(idInput.extend(CampaignDispatchOptionsValidator.shape))
        .output(z.object({ dispatchId: z.uuid() }))
        .mutation(async ({ input }): Promise<{ dispatchId: string }> =>
            trace('route', 'campaigns:dispatch', () =>
                dispatchCampaign(input.campaignId, input.expectedPreviewToken)
            )
        ),
    isAdmin: campaignUserRoute
        .meta({ requiredScope: 'campaigns:read' })
        .input(noInput)
        .output(z.boolean())
        .query(async ({ ctx }): Promise<boolean> =>
            trace('route', 'campaigns:isAdmin', async () =>
                isCampaignAdmin(ctx.user.profile.profileId)
            )
        ),
    create: campaignAdminRoute
        .input(CreateCampaignInputValidator)
        .output(CampaignValidator)
        .mutation(async ({ ctx, input }): Promise<Campaign> =>
            trace('route', 'campaigns:create', () =>
                createCampaign(input, ctx.user.profile.profileId)
            )
        ),
    update: campaignAdminRoute
        .input(UpdateCampaignInputValidator)
        .output(CampaignValidator)
        .mutation(async ({ input }): Promise<Campaign> =>
            trace('route', 'campaigns:update', () => updateCampaign(input))
        ),
    get: campaignAdminRoute
        .input(idInput)
        .output(CampaignValidator)
        .query(async ({ input }): Promise<Campaign> =>
            trace('route', 'campaigns:get', () => getCampaign(input.campaignId))
        ),
    list: campaignAdminRoute
        .input(ListCampaignsInputValidator.prefault({}))
        .output(PaginatedCampaignsValidator)
        .query(async ({ input }): Promise<PaginatedCampaigns> =>
            trace('route', 'campaigns:list', () => listCampaigns(input))
        ),
    delete: campaignAdminRoute
        .input(idInput)
        .output(z.boolean())
        .mutation(async ({ input }): Promise<boolean> =>
            trace('route', 'campaigns:delete', () => deleteCampaign(input.campaignId))
        ),
    setStatus: campaignAdminRoute
        .input(idInput.extend({ status: CampaignStatusValidator }))
        .output(CampaignValidator)
        .mutation(async ({ input }): Promise<Campaign> =>
            trace('route', 'campaigns:setStatus', () =>
                updateCampaign({ campaignId: input.campaignId, updates: { status: input.status } })
            )
        ),
    previewAudience: campaignAdminRoute
        .input(CampaignAudienceInputValidator)
        .output(z.object({ count: z.number() }))
        .query(async ({ input, ctx }): Promise<{ count: number }> =>
            trace('route', 'campaigns:previewAudience', async () => ({
                count: await previewCampaignAudience(input.campaignId, input.source, ctx.domain),
            }))
        ),
    addAudience: campaignAdminRoute
        .input(CampaignAudienceInputValidator)
        .output(z.object({ count: z.number() }))
        .mutation(async ({ input, ctx }): Promise<{ count: number }> =>
            trace('route', 'campaigns:addAudience', async () => ({
                count: await addCampaignAudience(input.campaignId, input.source, ctx.domain),
            }))
        ),
    pageAudience: campaignAdminRoute
        .input(PageCampaignAudienceInputValidator)
        .output(PaginatedCampaignAudienceValidator)
        .query(async ({ input }): Promise<PaginatedCampaignAudience> =>
            trace('route', 'campaigns:pageAudience', () =>
                pageCampaignAudience(input.campaignId, input.cursor, input.limit)
            )
        ),
    getStats: campaignAdminRoute
        .input(idInput)
        .output(CampaignStatsValidator)
        .query(async ({ input }): Promise<CampaignStats> =>
            trace('route', 'campaigns:getStats', () => getCampaignStats(input.campaignId))
        ),
    getMyCampaigns: campaignUserRoute
        .meta({ requiredScope: 'campaigns:read' })
        .input(noInput)
        .output(z.array(MyCampaignValidator))
        .query(async ({ ctx }): Promise<MyCampaign[]> =>
            trace('route', 'campaigns:getMyCampaigns', async () => {
                const profileId = ctx.user.profile.profileId;
                const tests = isCampaignAdmin(profileId) ? await getCampaignTests(profileId) : [];
                const campaigns = await getLiveCampaignsForProfile(profileId);
                return [
                    ...tests.map(test => ({
                        campaign: { id: test.campaignId, message: test.message, selfEnroll: false },
                        state: { shownCount: 0 },
                        testId: test.id,
                    })),
                    ...campaigns,
                ];
            })
        ),
    recordEvent: campaignUserRoute
        .meta({ requiredScope: 'campaigns:write' })
        .input(idInput.extend({ event: CampaignEventValidator, testId: z.uuid().optional() }))
        .output(z.boolean())
        .mutation(async ({ input, ctx }): Promise<boolean> =>
            trace('route', 'campaigns:recordEvent', async () => {
                if (input.testId) {
                    if (!isCampaignAdmin(ctx.user.profile.profileId)) return false;
                    // Private tests never write campaign engagement or audience state.
                    return input.event === 'shown'
                        ? acknowledgeCampaignTest(
                              ctx.user.profile.profileId,
                              input.campaignId,
                              input.testId
                          )
                        : true;
                }
                return recordCampaignEvent(
                    ctx.user.profile.profileId,
                    input.campaignId,
                    input.event
                );
            })
        ),
    enroll: campaignUserRoute
        .meta({ requiredScope: 'campaigns:write' })
        .input(idInput)
        .output(z.boolean())
        .mutation(async ({ input, ctx }): Promise<boolean> =>
            trace('route', 'campaigns:enroll', () =>
                enrollInCampaign(ctx.user.profile.profileId, input.campaignId)
            )
        ),
});

export type CampaignsRouter = typeof campaignsRouter;
