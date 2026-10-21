import { expect, type Frame } from '@playwright/test';
import neo4j from 'neo4j-driver';
import { test } from './fixtures/test';
import { mockEmbedRoute, seedAppListing } from './app-store.helpers';
import { getBespokeLearnCard } from './wallet.helpers';
import { waitForAuthenticatedState } from './test.helpers';
import { CONTRACT_OWNER_SEED, TEST_USER_SEED } from './constants';

const requestContext = (frame: Frame) =>
    frame.evaluate(async () => {
        const requestId = crypto.randomUUID();
        const { promise, resolve, reject } = Promise.withResolvers<{
            type: string;
            data?: { raw?: { personalData?: Record<string, unknown>; credentials?: unknown[] } };
            error?: { code: string };
        }>();
        const receive = (event: MessageEvent) => {
            if (
                event.source !== parent ||
                event.data?.protocol !== 'LEARNCARD_V1' ||
                event.data?.requestId !== requestId
            )
                return;
            clearTimeout(timeout);
            window.removeEventListener('message', receive);
            resolve(event.data);
        };
        const timeout = setTimeout(() => {
            window.removeEventListener('message', receive);
            reject(new Error('No learner context response from host'));
        }, 20_000);
        window.addEventListener('message', receive);
        parent.postMessage(
            {
                protocol: 'LEARNCARD_V1',
                action: 'REQUEST_LEARNER_CONTEXT',
                requestId,
                payload: {
                    format: 'structured',
                    includeCredentials: false,
                    includePersonalData: true,
                },
            },
            '*'
        );
        return promise;
    });

test('iframe learner context rechecks consent after withdrawal', async ({ page }) => {
    const listing = await seedAppListing();
    const owner = await getBespokeLearnCard(CONTRACT_OWNER_SEED);
    await owner.invoke.createProfile({ profileId: 'context-owner', displayName: 'Context owner' });
    const contractUri = await owner.invoke.createContract({
        name: 'Iframe learner context',
        contract: {
            read: { anonymize: false, personal: { Name: { required: false } } },
            write: {},
        },
    });
    const driver = neo4j.driver(
        'bolt://localhost:7687',
        neo4j.auth.basic('neo4j', 'this-is-the-password')
    );
    const session = driver.session();
    try {
        await session.run(
            `MATCH (owner:Profile {profileId: 'context-owner'})
             MATCH (integration:Integration)-[:PUBLISHES_LISTING]->(listing:AppStoreListing {listing_id: $listingId})
             CREATE (integration)-[:CREATED_BY]->(owner)
             SET listing.launch_config_json = $launchConfig`,
            {
                listingId: listing.listingId,
                launchConfig: JSON.stringify({
                    url: 'https://test-embed-app.example.com',
                    contractUri,
                }),
            }
        );
    } finally {
        await session.close();
        await driver.close();
    }

    await waitForAuthenticatedState(page, { profileId: 'context-learner' });
    const learner = await getBespokeLearnCard(TEST_USER_SEED);
    const { termsUri } = await learner.invoke.consentToContract(contractUri, {
        terms: { read: { personal: { Name: 'Authorized learner' } }, write: {} },
    });
    await learner.invoke.installApp(listing.listingId);
    await mockEmbedRoute(page);
    await page.goto(`/app/${listing.listingId}`);
    await page.getByRole('button', { name: 'Open', exact: true }).click();
    const iframe = page.frameLocator(`iframe[title*="${listing.displayName}"]`);
    await expect(iframe.getByText('Test Embed App Loaded')).toBeVisible();
    const frame = page.frame({ url: /test-embed-app\.example\.com/ });
    if (!frame) throw new Error('Embedded app frame was not created');

    const authorized = await requestContext(frame);
    expect(authorized.type).toBe('SUCCESS');
    expect(authorized.data?.raw).toEqual({
        credentials: [],
        personalData: { Name: 'Authorized learner' },
    });

    await learner.invoke.withdrawConsent(termsUri);
    const withdrawn = await requestContext(frame);
    expect(withdrawn.type).toBe('ERROR');
    expect(withdrawn.error?.code).toBe('FORBIDDEN');
    expect(withdrawn.data).toBeUndefined();
});
