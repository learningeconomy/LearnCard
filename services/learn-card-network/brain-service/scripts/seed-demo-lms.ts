#!/usr/bin/env bun
/**
 * Dev-only fixtures for the EducationOS MVP demo (WORKPLAN §1a). Run AFTER
 * `seed:education-os` (eco_dev_root) and the Demo LMS listing:
 *
 *   bun run seed:dev-integration --app-name "Demo LMS" --slug demo-lms --category lms \
 *     --scopes completion:ingest --capabilities-provided record-provisioning \
 *     --consent-requirements credential-body
 *   bun run seed:demo-lms --learner <learncard-app-profile-id> [--synthetic-learner-consent]
 *
 * Seeds, idempotently:
 * - the state (eco_dev_root) enabling the Demo LMS for its descendants (inherited, ADR-010);
 * - a district ecosystem under the state, owned by the state's owner;
 * - an ADR-001 identity-bearing issuer Group in the district, with an LCA-managed signing
 *   authority (needs the local `api` service; the key never leaves LCA);
 * - the district's institutional data-sharing agreement, accepted by its owner;
 * - the learner's district membership.
 *
 * Learner consent is NOT seeded unless `--synthetic-learner-consent` is passed, and then it
 * is labelled SYNTHETIC. Operator steps (plan/approve/apply, Binding) belong to
 * `prove:demo-lms`, which drives the console BFF.
 */
import * as dotenv from 'dotenv';

dotenv.config();

const STATE_ID = 'eco_dev_root';
const DISTRICT_SLUG = 'demo-district';
const ISSUER_PROFILE_ID = 'demo-district-issuer';
const ISSUER_GROUP_SLUG = 'demo-district-issuer';
const CONTRACT_ID = 'synthetic-dev-demo-district-data-sharing';

const arg = (name: string): string | undefined => {
    const index = process.argv.indexOf(`--${name}`);
    return index >= 0 ? process.argv[index + 1] : undefined;
};

const main = async (): Promise<void> => {
    if (process.env.NODE_ENV === 'production') throw new Error('Demo fixtures are dev-only.');
    process.env.NEO4J_URI ??= 'bolt://localhost:7687';
    process.env.NEO4J_USERNAME ??= 'neo4j';
    process.env.NEO4J_PASSWORD ??= 'this-is-the-password';
    process.env.DOMAIN_NAME ??= 'localhost%3A4000';
    // SEED must equal brain's (compose-local `a`); the package script sets it explicitly.
    const domain = process.env.DOMAIN_NAME;
    const learnerId = arg('learner');
    if (!learnerId) throw new Error('Pass --learner <profileId> (a LearnCard app profile).');

    const { neogma } = await import('@instance');
    const { getEcosystemById, getChildEcosystems } = await import('@accesslayer/ecosystem/read');
    const { createEcosystem } = await import('@accesslayer/ecosystem/create');
    const { updateEcosystemSettings } = await import('@accesslayer/ecosystem/update');
    const { grantEcosystemMembership } = await import('@accesslayer/ecosystem/membership');
    const { readAppStoreListingBySlug } = await import('@accesslayer/app-store-listing/read');
    const { createProfile } = await import('@accesslayer/profile/create');
    const { getProfileByProfileId } = await import('@accesslayer/profile/read');
    const { createGroup } = await import('@accesslayer/group/write');
    const { ensureManagedSigningAuthorityForProfile } =
        await import('@helpers/inline-template.helpers');
    const { governConsentContract, acceptGovernanceConsentContract } =
        await import('@accesslayer/consentflowcontract/governance');

    const state = await getEcosystemById(STATE_ID);
    if (!state) throw new Error('Run seed:education-os first; eco_dev_root is missing.');
    const ownerProfileId = state.ownerProfileId;
    const listing = await readAppStoreListingBySlug('demo-lms');
    if (!listing) throw new Error('Seed the Demo LMS listing first (see header).');
    if (!(await getProfileByProfileId(learnerId))) throw new Error(`No profile ${learnerId}.`);

    // State enablement; the district inherits it through the ecosystem path.
    const allowed = state.settings.catalogPolicy?.allowedListings;
    if (allowed && !allowed.includes(listing.listing_id)) {
        await updateEcosystemSettings(STATE_ID, {
            ...state.settings,
            catalogPolicy: {
                ...state.settings.catalogPolicy,
                allowedListings: [...allowed, listing.listing_id].sort(),
                requireEndorsement: state.settings.catalogPolicy?.requireEndorsement ?? false,
            },
        });
    }
    console.log(`  State ${STATE_ID}: Demo LMS ${allowed ? 'enabled' : 'unrestricted catalog'}`);

    const existingDistrict = (await getChildEcosystems(STATE_ID)).find(
        child => child.slug === DISTRICT_SLUG
    );
    const DISTRICT_ID =
        existingDistrict?.id ??
        (
            await createEcosystem({
                name: 'Demo District',
                slug: DISTRICT_SLUG,
                ownerProfileId,
                parentEcosystemId: STATE_ID,
                description: 'EducationOS MVP demo district (dev fixture).',
                settings: {},
                status: 'ACTIVE',
            })
        ).id;
    // The district is administered by the state's owners (incl. the console operator).
    const stateOwners = await neogma.queryRunner.run(
        `MATCH (p:Profile)-[m:MEMBER_OF {role: 'OWNER'}]->(:Ecosystem {id: $stateId})
         RETURN collect(p.profileId) AS ids`,
        { stateId: STATE_ID }
    );
    const ownerIds: string[] = stateOwners.records[0]?.get('ids') ?? [];
    for (const id of new Set([ownerProfileId, ...ownerIds])) {
        await grantEcosystemMembership({ profileId: id, ecosystemId: DISTRICT_ID, role: 'OWNER' });
    }
    await grantEcosystemMembership({
        profileId: learnerId,
        ecosystemId: DISTRICT_ID,
        role: 'MEMBER',
    });
    console.log(`  District ${DISTRICT_ID}: owner ${ownerProfileId}, learner ${learnerId}`);

    // ADR-001 identity-bearing Group; managed Profiles use the :users: did:web form.
    if (!(await getProfileByProfileId(ISSUER_PROFILE_ID))) {
        await createProfile({
            profileId: ISSUER_PROFILE_ID,
            did: `did:web:${domain}:users:${ISSUER_PROFILE_ID}`,
            displayName: 'Demo District',
        } as Parameters<typeof createProfile>[0]);
    }
    const issuerProfile = await getProfileByProfileId(ISSUER_PROFILE_ID);
    if (!issuerProfile) throw new Error('Issuer profile could not be read back.');
    const existingGroup = await neogma.queryRunner.run(
        'MATCH (g:Group {slug: $slug, ownerEcosystemId: $ecosystemId}) RETURN g.id AS id',
        { slug: ISSUER_GROUP_SLUG, ecosystemId: DISTRICT_ID }
    );
    let issuerGroupId: string | undefined = existingGroup.records[0]?.get('id');
    if (!issuerGroupId) {
        const group = await createGroup(
            {
                name: 'Demo District',
                slug: ISSUER_GROUP_SLUG,
                type: 'administrative',
                ownerEcosystemId: DISTRICT_ID,
                parentGroupId: null,
                identityProfileId: ISSUER_PROFILE_ID,
                identityIssuanceEnabled: true,
                membershipMode: 'EXPLICIT',
                status: 'ACTIVE',
            } as Parameters<typeof createGroup>[0],
            { actorProfileId: ownerProfileId }
        );
        issuerGroupId = String(group.id);
    }
    // KNOWN GAP (ADR-001 identity Groups): requireManagedIdentityProfile demands a stored
    // `did:web …:users:` DID, but /users/:id/did.json resolves the stored DID, so that form
    // makes the document resolve itself and hang. Like createManagedProfile, the Profile must
    // store an underlying did:key. Created with the accepted form above, then rotated here.
    if (issuerProfile.did.includes(':users:')) {
        const { randomBytes } = await import('node:crypto');
        const { getLearnCard } = await import('@helpers/learnCard.helpers');
        const { deleteDidDocForProfile } = await import('@cache/did-docs');
        const keyDid = (await getLearnCard(randomBytes(32).toString('hex'))).id.did();
        await neogma.queryRunner.run('MATCH (p:Profile {profileId: $id}) SET p.did = $did', {
            id: ISSUER_PROFILE_ID,
            did: keyDid,
        });
        await deleteDidDocForProfile(ISSUER_PROFILE_ID);
        console.log(`  Issuer identity: stored DID rotated to a did:key (see KNOWN GAP)`);
    }
    const signingAuthority = await ensureManagedSigningAuthorityForProfile(
        (await getProfileByProfileId(ISSUER_PROFILE_ID)) ?? issuerProfile,
        domain
    );
    console.log(
        `  Issuer Group ${issuerGroupId} → ${ISSUER_PROFILE_ID} (SA ${signingAuthority.relationship.name})`
    );

    // District data-sharing agreement. Governance acceptance is NOT learner consent.
    const grant = {
        apiVersion: 'lc.consent-grant/v1' as const,
        grants: [
            {
                capability: 'record-provisioning' as const,
                operation: 'read' as const,
                scopes: [`completion:ingest:tree:${DISTRICT_ID}`],
                selectors: { ecosystemIds: [DISTRICT_ID] },
                tiers: ['credential-body' as const],
                purpose: 'SYNTHETIC DEVELOPMENT: course completions for credential issuance.',
            },
        ],
    };
    const now = new Date().toISOString();
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $ownerProfileId})
         MERGE (c:ConsentFlowContract {id: $contractId})
         ON CREATE SET c.name = 'SYNTHETIC — Demo District data sharing', c.createdAt = $now,
             c.updatedAt = $now, c.\`contract.read.anonymize\` = false,
             c.description = 'SYNTHETIC DEVELOPMENT ONLY. Governance acceptance is not learner consent.'
         MERGE (c)-[:CREATED_BY]->(p)`,
        { ownerProfileId, contractId: CONTRACT_ID, now }
    );
    await governConsentContract({
        ecosystemId: DISTRICT_ID,
        contractId: CONTRACT_ID,
        actorProfileId: ownerProfileId,
        agreement: 'institutional-data-sharing',
        grant,
    });
    const operatorTermsId = `${CONTRACT_ID}-operator-terms`;
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $ownerProfileId}), (c:ConsentFlowContract {id: $contractId})
         MERGE (t:ConsentFlowTerms {id: $termsId})
         ON CREATE SET t.status = 'live', t.createdAt = $now, t.updatedAt = $now, t.mutationVersion = 1
         MERGE (p)-[:CREATED_BY]->(t) MERGE (t)-[:CONSENTS_TO]->(c)`,
        { ownerProfileId, contractId: CONTRACT_ID, termsId: operatorTermsId, now }
    );
    const contract = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})
         RETURN c.educationOsGrantRevision AS revision, c.educationOsGrantHash AS hash`,
        { contractId: CONTRACT_ID }
    );
    await acceptGovernanceConsentContract(
        {
            ecosystemId: DISTRICT_ID,
            contractId: CONTRACT_ID,
            termsId: operatorTermsId,
            contractRevision: String(contract.records[0]?.get('revision')),
            grantHash: String(contract.records[0]?.get('hash')),
        },
        ownerProfileId
    );
    console.log(`  Agreement ${CONTRACT_ID}: governed and accepted by ${ownerProfileId}`);

    if (process.argv.includes('--synthetic-learner-consent')) {
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $learnerId}), (c:ConsentFlowContract {id: $contractId})
             MERGE (t:ConsentFlowTerms {id: $termsId})
             ON CREATE SET t.status = 'live', t.createdAt = $now, t.updatedAt = $now,
                 t.synthetic = true
             MERGE (p)-[:CREATED_BY]->(t) MERGE (t)-[:CONSENTS_TO]->(c)`,
            { learnerId, contractId: CONTRACT_ID, termsId: `${CONTRACT_ID}-${learnerId}`, now }
        );
        console.log(`  Learner consent: SYNTHETIC live Terms for ${learnerId}`);
    } else {
        console.log('  Learner consent: none (releases will be DENIED until the learner consents)');
    }

    console.log(`
Next: bun run prove:demo-lms -- --learner ${learnerId}
  district:        ${DISTRICT_ID}
  issuer group:    ${issuerGroupId}
  issuer identity: ${ISSUER_PROFILE_ID}
`);
    await neogma.driver.close();
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Demo seed failed:', error);
        process.exit(1);
    });
