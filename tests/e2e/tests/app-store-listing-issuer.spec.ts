import { describe, it, expect, beforeEach } from 'vitest';
import { getLearnCardForUser, type LearnCard } from './helpers/learncard.helpers';
import { testUnsignedBoost } from './helpers/credential.helpers';

const getAppDidFromSlug = (slug: string): string => {
    const domain = 'localhost%3A4000';
    return `did:web:${domain}:app:${slug}`;
};

const setupSigningAuthority = async (lc: LearnCard, name: string, ownerDid?: string) => {
    const sa = await lc.invoke.createSigningAuthority(name, ownerDid);
    if (!sa) throw new Error(`Failed to create signing authority: ${name}`);
    if (!sa.endpoint || !sa.did) throw new Error(`Signing authority missing data: ${name}`);

    await lc.invoke.registerSigningAuthority(sa.endpoint, sa.name, sa.did);

    return sa;
};

describe('AppStoreListing Credential Issuance', () => {
    let alice: LearnCard;
    let bob: LearnCard;

    beforeEach(async () => {
        alice = await getLearnCardForUser('a');
        bob = await getLearnCardForUser('b');
    });

    describe('AppStoreListing issues credential via signing authority', () => {
        it('should issue credential via handleSendCredentialEvent and create CREDENTIAL_SENT relationships', async () => {
            // 1. Create integration
            const integrationId = await alice.invoke.addIntegration({
                name: 'Test Integration for Credential Issuance',
                description: 'Integration for testing credential issuance',
                whitelistedDomains: ['localhost'],
            });

            // 2. Create app listing with slug
            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Credential Test App',
                tagline: 'An app for testing credential issuance',
                full_description: 'This app demonstrates credential issuance via signing authority',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://localhost:8888' }),
            });

            // 3. Get the listing with generated slug
            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // 4. Create signing authority with app DID as owner
            const appDid = getAppDidFromSlug(listing.slug);
            const sa = await setupSigningAuthority(alice, 'app-cred-sa', appDid);

            // 5. Associate SA with listing
            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            // 6. Create a boost for the listing
            const boostUri = await alice.invoke.createBoost(testUnsignedBoost);

            // 7. Associate boost with listing using a template alias
            await alice.invoke.associateBoostWithListing(listingId, boostUri, 'test-template');

            // 8. Install the app for bob (required for app events)
            await alice.invoke.adminUpdateListingStatus(listingId, 'LISTED');
            await bob.invoke.installApp(listingId);

            // 9. Issue credential via sendCredential app event
            const result = await bob.invoke.sendAppEvent(listingId, {
                type: 'sendCredential',
                templateAlias: 'test-template',
                templateData: {},
            });

            // 10. Verify credential was created
            expect(result).toBeDefined();
            expect(result.credentialUri).toBeDefined();
            expect(typeof result.credentialUri).toBe('string');

            // 11. Verify the credential exists by fetching it
            const credential = await bob.invoke.getCredential(result.credentialUri);
            expect(credential).toBeDefined();

            // 12. Verify credential issuer is the app DID
            const issuer =
                typeof credential.issuer === 'object' ? credential.issuer.id : credential.issuer;
            expect(issuer).toBe(appDid);

            // 13. Verify CREDENTIAL_SENT relationship exists by checking received credentials
            const receivedCreds = await bob.invoke.getReceivedCredentials();
            const matchingCred = receivedCreds.find(
                (c: { uri: string }) => c.uri === result.credentialUri
            );
            expect(matchingCred).toBeDefined();
        });
    });

    describe('Credential has correct issuer DID', () => {
        it('should use app DID (did:web:domain:app:slug) when listing has a slug', async () => {
            // 1. Create integration
            const integrationId = await alice.invoke.addIntegration({
                name: 'Slug DID Test Integration',
                description: 'Testing app DID with slug',
                whitelistedDomains: ['localhost'],
            });

            // 2. Create app listing (will auto-generate slug)
            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Slug DID Test App',
                tagline: 'Testing slug-based DID',
                full_description: 'This app tests slug-based DID issuance',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://localhost:8888' }),
            });

            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // 3. Setup signing authority with app DID
            const appDid = getAppDidFromSlug(listing.slug);
            const sa = await setupSigningAuthority(alice, 'slug-did-sa', appDid);

            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            // 4. Create boost and associate with listing
            const boostUri = await alice.invoke.createBoost(testUnsignedBoost);
            await alice.invoke.associateBoostWithListing(listingId, boostUri, 'slug-test-template');

            // 5. List app and install for bob
            await alice.invoke.adminUpdateListingStatus(listingId, 'LISTED');
            await bob.invoke.installApp(listingId);

            // 6. Issue credential
            const result = await bob.invoke.sendAppEvent(listingId, {
                type: 'sendCredential',
                templateAlias: 'slug-test-template',
            });

            // 7. Verify credential issuer uses app DID format
            const credential = await bob.invoke.getCredential(result.credentialUri);
            const issuer =
                typeof credential.issuer === 'object' ? credential.issuer.id : credential.issuer;

            // Should be did:web:localhost%3A4000:app:{slug}
            expect(issuer).toBe(appDid);
            expect(issuer).toMatch(new RegExp(`^did:web:.*:app:${listing.slug}$`));
        });

        it('should use owner DID when listing does not have a slug', async () => {
            // 1. Create integration
            const integrationId = await alice.invoke.addIntegration({
                name: 'No Slug DID Test Integration',
                description: 'Testing owner DID without slug',
                whitelistedDomains: ['localhost'],
            });

            // 2. Create app listing
            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'No Slug DID Test App',
                tagline: 'Testing owner-based DID',
                full_description: 'This app tests owner-based DID issuance',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://localhost:8888' }),
            });

            const aliceDid = await alice.id.did();

            // 3. Setup signing authority
            const sa = await setupSigningAuthority(alice, 'no-slug-did-sa');
            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            // 4. Create boost and associate with listing
            const boostUri = await alice.invoke.createBoost(testUnsignedBoost);
            await alice.invoke.associateBoostWithListing(
                listingId,
                boostUri,
                'no-slug-test-template'
            );

            // 5. List app and install for bob
            await alice.invoke.adminUpdateListingStatus(listingId, 'LISTED');
            await bob.invoke.installApp(listingId);

            // 6. Issue credential
            const result = await bob.invoke.sendAppEvent(listingId, {
                type: 'sendCredential',
                templateAlias: 'no-slug-test-template',
            });

            // 7. Verify credential issuer uses owner DID
            const credential = await bob.invoke.getCredential(result.credentialUri);
            const issuer =
                typeof credential.issuer === 'object' ? credential.issuer.id : credential.issuer;

            // Should be the owner's DID (alice's DID)
            expect(issuer).toBe(aliceDid);
        });
    });

    describe('Boost ownership returns correct type', () => {
        it('should return type "appStoreListing" for boost owned by listing', async () => {
            // 1. Create integration
            const integrationId = await alice.invoke.addIntegration({
                name: 'Boost Ownership Test Integration',
                description: 'Testing boost ownership by listing',
                whitelistedDomains: ['localhost'],
            });

            // 2. Create app listing
            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Boost Ownership Test App',
                tagline: 'Testing boost ownership',
                full_description: 'This app tests boost ownership type',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://localhost:8888' }),
            });

            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // 3. Setup signing authority
            const appDid = getAppDidFromSlug(listing.slug);
            const sa = await setupSigningAuthority(alice, 'ownership-sa', appDid);

            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            // 4. Create boost specifically for the listing
            const boostUri = await alice.invoke.createBoost(testUnsignedBoost);
            await alice.invoke.associateBoostWithListing(listingId, boostUri, 'ownership-test');

            // 5. Call getBoostOwner and verify it returns appStoreListing type
            const owner = await alice.invoke.getBoostOwner(boostUri);

            expect(owner).toBeDefined();
            expect(owner.type).toBe('appStoreListing');
            expect(owner.listing).toBeDefined();
            expect(owner.listing.listing_id).toBe(listingId);
        });
    });

    describe('Notifications show listing display name', () => {
        it('should include listing display_name as sender in notification', async () => {
            // 1. Create integration
            const integrationId = await alice.invoke.addIntegration({
                name: 'Notification Test Integration',
                description: 'Testing notification display name',
                whitelistedDomains: ['localhost'],
            });

            // 2. Create app listing with specific display name
            const displayName = 'Awesome Test App Display Name';
            const listingId = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: displayName,
                tagline: 'Testing notification sender name',
                full_description: 'This app tests notification display names',
                icon_url: 'https://example.com/icon.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://localhost:8888' }),
            });

            const listing = await alice.invoke.getAppStoreListing(listingId);
            if (!listing?.slug) throw new Error('Listing slug not set');

            // 3. Setup signing authority
            const appDid = getAppDidFromSlug(listing.slug);
            const sa = await setupSigningAuthority(alice, 'notification-sa', appDid);

            await alice.invoke.associateListingWithSigningAuthority(
                listingId,
                sa.endpoint,
                sa.name,
                sa.did,
                true
            );

            // 4. Create boost and associate with listing
            const boostUri = await alice.invoke.createBoost(testUnsignedBoost);
            await alice.invoke.associateBoostWithListing(listingId, boostUri, 'notification-test');

            // 5. List app and install for bob
            await alice.invoke.adminUpdateListingStatus(listingId, 'LISTED');
            await bob.invoke.installApp(listingId);

            // 6. Issue credential
            await bob.invoke.sendAppEvent(listingId, {
                type: 'sendCredential',
                templateAlias: 'notification-test',
            });

            // 7. Check bob's notifications
            const notifications = await bob.invoke.getNotifications();

            // Find notification related to the credential
            const credentialNotification = notifications.find(
                (n: { type: string; message?: string }) =>
                    n.type === 'CREDENTIAL_RECEIVED' || n.message?.includes(displayName)
            );

            expect(credentialNotification).toBeDefined();

            // Verify the notification contains the listing display name
            if (credentialNotification?.from) {
                const fromDisplayName =
                    typeof credentialNotification.from === 'object'
                        ? credentialNotification.from.displayName ||
                          credentialNotification.from.profileId
                        : credentialNotification.from;
                expect(fromDisplayName).toBe(displayName);
            }
        });
    });

    describe('Queries return credentials by listing issuer', () => {
        it('should return credentials issued by a specific listing', async () => {
            // 1. Create integration
            const integrationId = await alice.invoke.addIntegration({
                name: 'Query Test Integration',
                description: 'Testing credential queries by listing',
                whitelistedDomains: ['localhost'],
            });

            // 2. Create first app listing
            const listing1Id = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Query Test App 1',
                tagline: 'First app for query testing',
                full_description: 'This is the first app for testing queries',
                icon_url: 'https://example.com/icon1.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://app1.example.com' }),
            });

            const listing1 = await alice.invoke.getAppStoreListing(listing1Id);
            if (!listing1?.slug) throw new Error('Listing 1 slug not set');

            // 3. Create second app listing
            const listing2Id = await alice.invoke.createAppStoreListing(integrationId, {
                display_name: 'Query Test App 2',
                tagline: 'Second app for query testing',
                full_description: 'This is the second app for testing queries',
                icon_url: 'https://example.com/icon2.png',
                launch_type: 'EMBEDDED_IFRAME',
                launch_config_json: JSON.stringify({ iframeUrl: 'https://app2.example.com' }),
            });

            const listing2 = await alice.invoke.getAppStoreListing(listing2Id);
            if (!listing2?.slug) throw new Error('Listing 2 slug not set');

            // 4. Setup signing authorities for both listings
            const app1Did = getAppDidFromSlug(listing1.slug);
            const sa1 = await setupSigningAuthority(alice, 'query-sa-1', app1Did);
            await alice.invoke.associateListingWithSigningAuthority(
                listing1Id,
                sa1.endpoint,
                sa1.name,
                sa1.did,
                true
            );

            const app2Did = getAppDidFromSlug(listing2.slug);
            const sa2 = await setupSigningAuthority(alice, 'query-sa-2', app2Did);
            await alice.invoke.associateListingWithSigningAuthority(
                listing2Id,
                sa2.endpoint,
                sa2.name,
                sa2.did,
                true
            );

            // 5. Create boosts for each listing
            const boost1Uri = await alice.invoke.createBoost({
                ...testUnsignedBoost,
                name: 'Boost from App 1',
            });
            await alice.invoke.associateBoostWithListing(listing1Id, boost1Uri, 'app1-template');

            const boost2Uri = await alice.invoke.createBoost({
                ...testUnsignedBoost,
                name: 'Boost from App 2',
            });
            await alice.invoke.associateBoostWithListing(listing2Id, boost2Uri, 'app2-template');

            // 6. List apps and install for bob
            await alice.invoke.adminUpdateListingStatus(listing1Id, 'LISTED');
            await alice.invoke.adminUpdateListingStatus(listing2Id, 'LISTED');
            await bob.invoke.installApp(listing1Id);
            await bob.invoke.installApp(listing2Id);

            // 7. Issue credentials from both apps
            const result1 = await bob.invoke.sendAppEvent(listing1Id, {
                type: 'sendCredential',
                templateAlias: 'app1-template',
            });

            const result2 = await bob.invoke.sendAppEvent(listing2Id, {
                type: 'sendCredential',
                templateAlias: 'app2-template',
            });

            // 8. Query credentials by listing issuer
            const credentialsFromListing1 = await bob.invoke.getCredentialsByIssuer(app1Did);
            const credentialsFromListing2 = await bob.invoke.getCredentialsByIssuer(app2Did);

            // 9. Verify results
            expect(credentialsFromListing1).toBeDefined();
            expect(
                credentialsFromListing1.some(
                    (c: { uri: string }) => c.uri === result1.credentialUri
                )
            ).toBe(true);
            expect(
                credentialsFromListing1.some(
                    (c: { uri: string }) => c.uri === result2.credentialUri
                )
            ).toBe(false);

            expect(credentialsFromListing2).toBeDefined();
            expect(
                credentialsFromListing2.some(
                    (c: { uri: string }) => c.uri === result2.credentialUri
                )
            ).toBe(true);
            expect(
                credentialsFromListing2.some(
                    (c: { uri: string }) => c.uri === result1.credentialUri
                )
            ).toBe(false);
        });
    });
});
