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
 * - the district's managed issuing identity (ADR-001 identity Group, LCA-managed key;
 *   needs the local `api` service);
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
const LEGACY_SYNTHETIC_CONTRACT_ID = 'synthetic-dev-demo-district-data-sharing';
const AGREEMENT_NAME = 'Demo District data sharing';

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
    const { getProfileByProfileId } = await import('@accesslayer/profile/read');
    const { ConsentFlowContractValidator } = await import('@learncard/types');
    const { createConsentFlowContract } = await import('@accesslayer/consentflowcontract/create');
    const { constructUri } = await import('@helpers/uri.helpers');
    const { provisionEcosystemIssuingIdentity } =
        await import('@accesslayer/ecosystem/issuing-identity');
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

    // The district's managed issuing identity, via the product path (RFC decision 4).
    const identity = await provisionEcosystemIssuingIdentity({
        ecosystemId: DISTRICT_ID,
        name: 'Demo District',
        actorProfileId: ownerProfileId,
        domain,
    });
    console.log(`  Issuing identity ${identity.did} (group ${identity.groupId}, signing ready)`);

    // District data-sharing agreement as a real ConsentFlow contract, so learners consent to it
    // through the normal ConsentFlow path (LearnCard app /consent-flow?uri=). Governance
    // acceptance by the operator is NOT learner consent.
    await neogma.queryRunner.run(
        `MATCH (:Ecosystem {id: $ecosystemId})-[g:GOVERNS_CONSENT_CONTRACT]->
             (:ConsentFlowContract {id: $legacyId}) DELETE g`,
        { ecosystemId: DISTRICT_ID, legacyId: LEGACY_SYNTHETIC_CONTRACT_ID }
    );
    const governed = await neogma.queryRunner.run(
        `MATCH (:Ecosystem {id: $ecosystemId})-[:GOVERNS_CONSENT_CONTRACT]->
             (c:ConsentFlowContract {name: $name}) RETURN c.id AS id LIMIT 1`,
        { ecosystemId: DISTRICT_ID, name: AGREEMENT_NAME }
    );
    let contractId: string | undefined = governed.records[0]?.get('id');
    if (!contractId) {
        const created = await createConsentFlowContract({
            // Non-empty on purpose: empty objects are dropped when the contract is stored. The
            // district writes achievements to the learner; it reads nothing from them.
            contract: ConsentFlowContractValidator.parse({
                read: { anonymize: false },
                write: { credentials: { categories: { Achievement: { required: true } } } },
            }),
            ownerProfileId,
            name: AGREEMENT_NAME,
            subtitle: 'Course completions from Demo LMS',
            description:
                'Demo LMS shares your course completions (course, title, completion date) with Demo District, which issues them to you as credentials. Records are kept 30 days.',
            reasonForAccessing: 'To issue your course completions as credentials you own.',
        });
        contractId = created.id;
    }
    await governConsentContract({
        ecosystemId: DISTRICT_ID,
        contractId,
        actorProfileId: ownerProfileId,
        agreement: 'institutional-data-sharing',
        grant: {
            apiVersion: 'lc.consent-grant/v1',
            grants: [
                {
                    capability: 'record-provisioning',
                    operation: 'read',
                    scopes: [`completion:ingest:tree:${DISTRICT_ID}`],
                    selectors: { ecosystemIds: [DISTRICT_ID] },
                    tiers: ['credential-body'],
                    purpose: 'DEMO: course completions for credential issuance.',
                },
            ],
        },
    });
    const now = new Date().toISOString();
    const operatorTermsId = `${contractId}-operator-terms`;
    await neogma.queryRunner.run(
        `MATCH (p:Profile {profileId: $ownerProfileId}), (c:ConsentFlowContract {id: $contractId})
         MERGE (t:ConsentFlowTerms {id: $termsId})
         ON CREATE SET t.status = 'live', t.createdAt = $now, t.updatedAt = $now, t.mutationVersion = 1
         MERGE (p)-[:CREATED_BY]->(t) MERGE (t)-[:CONSENTS_TO]->(c)`,
        { ownerProfileId, contractId, termsId: operatorTermsId, now }
    );
    const revision = await neogma.queryRunner.run(
        `MATCH (c:ConsentFlowContract {id: $contractId})
         RETURN c.educationOsGrantRevision AS revision, c.educationOsGrantHash AS hash`,
        { contractId }
    );
    await acceptGovernanceConsentContract(
        {
            ecosystemId: DISTRICT_ID,
            contractId,
            termsId: operatorTermsId,
            contractRevision: String(revision.records[0]?.get('revision')),
            grantHash: String(revision.records[0]?.get('hash')),
        },
        ownerProfileId
    );
    const contractUri = constructUri('contract', contractId, domain);
    console.log(`  Agreement "${AGREEMENT_NAME}": ${contractUri} (governed, accepted)`);

    if (process.argv.includes('--synthetic-learner-consent')) {
        await neogma.queryRunner.run(
            `MATCH (p:Profile {profileId: $learnerId}), (c:ConsentFlowContract {id: $contractId})
             MERGE (t:ConsentFlowTerms {id: $termsId})
             ON CREATE SET t.status = 'live', t.createdAt = $now, t.updatedAt = $now,
                 t.synthetic = true
             MERGE (p)-[:CREATED_BY]->(t) MERGE (t)-[:CONSENTS_TO]->(c)`,
            { learnerId, contractId, termsId: `${contractId}-${learnerId}-synthetic`, now }
        );
        console.log(`  Learner consent: SYNTHETIC live Terms for ${learnerId}`);
    } else {
        console.log(
            '  Learner consent: none. The learner consents in LearnCard (/consent-flow?uri=…) or via prove:demo-learner -- --consent'
        );
    }

    console.log(`
Next: bun run prove:demo-lms -- --learner ${learnerId}
  district:        ${DISTRICT_ID}
  issuer:          ${identity.did}
  agreement:       ${contractUri}
`);
    await neogma.driver.close();
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error('\n❌ Demo seed failed:', error);
        process.exit(1);
    });
