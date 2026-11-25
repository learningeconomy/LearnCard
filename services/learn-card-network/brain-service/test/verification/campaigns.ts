/**
 * Real signed SDK requests against an owned Linux verification stack.
 * Positive admin/data coverage lives in campaigns.spec.ts (disposable Neo4j): the
 * default stack intentionally grants no campaign administration to test actors.
 *
 * bun run --cwd apps/learn-card-app lc verify script \
 *   services/learn-card-network/brain-service/test/verification/campaigns.ts --dir <owned-dir>
 */
import type { VerificationScript } from '../../../../../apps/learn-card-app/scripts/verification/script';

const script: VerificationScript = async v => {
    const learner = await v.sdk(v.actors.learner);
    const other = await v.sdk(v.actors.recipient);
    const campaignId = 'verification-denied-campaign';

    await v.step(null, 'campaign-sdk-authorization', async () => {
        v.expect(await learner.invoke.campaignsIsAdmin()).toBe(false);
        await v
            .expect(
                learner.invoke.campaignsCreate({
                    id: campaignId,
                    name: 'Not authorized',
                    channels: ['inApp'],
                    message: { title: 'Denied' },
                })
            )
            .rejects.toThrow(/Campaign administrator access required/);
        await v
            .expect(other.invoke.campaignsList())
            .rejects.toThrow(/Campaign administrator access required/);
    });

    await v.step(null, 'campaign-dispatch-authorization', async () => {
        await v
            .expect(learner.invoke.campaignsSendTestToMe(campaignId))
            .rejects.toThrow(/Campaign administrator access required/);
        await v
            .expect(learner.invoke.campaignsDispatch(campaignId))
            .rejects.toThrow(/Campaign administrator access required/);
    });

    await v.step(null, 'campaign-sdk-user-isolation', async () => {
        v.expect(await learner.invoke.getMyCampaigns()).toEqual([]);
        v.expect(await other.invoke.getMyCampaigns()).toEqual([]);
        v.expect(await learner.invoke.recordCampaignEvent(campaignId, 'shown')).toBe(false);
        await v
            .expect(learner.invoke.enrollInCampaign(campaignId))
            .rejects.toThrow(/Campaign not found/);
    });

    const page = await v.newPage('announcement-preferences', { signInAs: v.actors.learner });
    await v.step(page, 'announcement-preferences-ui-persistence', async () => {
        await page.goto('/privacy-and-data');
        const email = page.getByRole('switch', { name: 'Email', exact: true });
        const push = page.getByRole('switch', { name: 'Push notifications', exact: true });
        await v.expect(email).toHaveAttribute('aria-checked', 'true');
        await email.click();
        await v.expect(email).toHaveAttribute('aria-checked', 'false');
        await push.click();
        await v.expect(push).toHaveAttribute('aria-checked', 'false');
        await page.reload();
        await v.expect(email).toHaveAttribute('aria-checked', 'false');
        await v.expect(push).toHaveAttribute('aria-checked', 'false');
        v.expect(await learner.invoke.getAnnouncementPreferences()).toEqual({
            announcementEmailOptOut: true,
            announcementPushOptOut: true,
        });
        v.expect(await other.invoke.getAnnouncementPreferences()).toEqual({
            announcementEmailOptOut: false,
            announcementPushOptOut: false,
        });
    });
    const anonymous = await v.newPage('unsubscribe-public');
    await v.step(anonymous, 'unsubscribe-public-error-retry', async () => {
        await anonymous.goto('/unsubscribe?token=invalid');
        await v.expect(anonymous.getByRole('alert')).toBeVisible();
        await anonymous.getByRole('button', { name: 'Try Again' }).click();
        await v.expect(anonymous.getByRole('alert')).toBeVisible();
        await v.expect(anonymous).toHaveURL(/\/unsubscribe\?token=invalid/);
    });

    return {
        authorization: 'passed',
        userIsolation: 'passed',
        adminDataCoverage: 'separate Neo4j integration suite',
    };
};

export default script;
