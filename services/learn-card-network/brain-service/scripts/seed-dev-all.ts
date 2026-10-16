#!/usr/bin/env bun
/**
 * Rebuild the local console graph: bun run seed:dev-all
 * Prerequisites: `bun run dev-console` stack up; Neo4j, MongoDB and Redis reachable.
 * NEO4J_* override the dev-console defaults below. DEV_OPERATOR_PROFILE_ID in .env
 * should identify your console login (seed:education-os grants it OWNER).
 * Re-runnable fixtures, not a production migration. Does not enable or install anything.
 * Historical bundle/persona commands were not in git; these are explicit dev fixtures.
 */
import * as dotenv from 'dotenv';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { LCNProfile } from '@learncard/types';

dotenv.config();
process.env.NEO4J_URI ??= 'bolt://localhost:7687';
process.env.NEO4J_USERNAME ??= 'neo4j';
process.env.NEO4J_PASSWORD ??= 'password';
process.env.DOMAIN_NAME ??= 'localhost%3A4000';

const ROOT = 'eco_dev_root';
const steps: string[][] = [
    ['seed:education-os', '--ecosystem', ROOT, '--role', 'OWNER'],
    ['seed:dev-app'],
    ['seed:dev-integration'],
    [
        'seed:dev-integration',
        '--slug',
        'powerschool-sis',
        '--app-name',
        'PowerSchool SIS',
        '--category',
        'sis',
        '--capabilities-provided',
        'roster-source,record-provisioning',
    ],
    [
        'seed:dev-integration',
        '--slug',
        'onet',
        '--app-name',
        'O*NET',
        '--category',
        'automation',
        '--capabilities-provided',
        'insight-source',
        '--record-classes',
    ],
    [
        'seed:dev-integration',
        '--slug',
        'credential-registry',
        '--app-name',
        'Credential Registry',
        '--category',
        'registry-adapter',
        '--capabilities-provided',
        'registry-adapter',
        '--record-classes',
        '--consent-requirements',
        '--api-version',
        'lc.integration/v1.3',
        '--version',
        '1.3.0',
        '--subscribes',
        'credential-registry|credential-engine|Credential Registry|https://credentialengineregistry.org',
        '--console-surface',
        'org.credentialengine.finder|credential-finder|Credential Finder|search|DATA|MEMBER',
    ],
    [
        'seed:dev-integration',
        '--slug',
        'issuer-identity-registry',
        '--app-name',
        'Issuer Identity Registry',
        '--category',
        'registry-adapter',
        '--capabilities-provided',
        'registry-adapter',
        '--record-classes',
        '--consent-requirements',
        '--subscribes',
        'issuer-identity|issuer-identity-registry|Issuer Identity Registry|https://issuerregistry.org',
    ],
    [
        'seed:dev-integration',
        '--slug',
        'ebsi',
        '--app-name',
        'EBSI',
        '--category',
        'registry-adapter',
        '--capabilities-provided',
        'registry-adapter',
        '--record-classes',
        '--consent-requirements',
        '--subscribes',
        'ebsi|ebsi-tir|EBSI Trusted Issuers Registry|https://api-pilot.ebsi.eu/tir',
    ],
    ['seed:dev-wallets'],
    [
        'seed:dev-bundle',
        '--slug',
        'credential-engine',
        '--bundle-name',
        'Credential Engine',
        '--version',
        '1.2.0',
        '--tagline',
        'Discover credentials and connect registry data',
        '--members',
        'credential-registry,credential-finder=APP_AVAILABILITY',
        '--default-bindings',
        'registry-adapter|credential-registry|credential-finder|Discover registered credentials;roster-source|$ecosystem|credential-finder|Resolve ecosystem roster context',
    ],
    [
        'seed:dev-bundle',
        '--slug',
        'european-trust-stack',
        '--bundle-name',
        'European Trust Stack',
        '--tagline',
        'Explore European issuer trust registries',
        '--members',
        'ebsi,issuer-identity-registry',
    ],
];

const runStep = async (args: string[], index: number): Promise<void> => {
    console.log(
        `\nStep ${index + 1}: bun run ${args.map(value => JSON.stringify(value)).join(' ')}`
    );
    await new Promise<void>((resolve, reject) => {
        const child = spawn(process.execPath, ['run', ...args], {
            cwd: fileURLToPath(new URL('..', import.meta.url)),
            stdio: 'inherit',
            env: { ...process.env, SKIP_DIDKIT_NAPI: 'true' },
        });
        child.once('error', error =>
            reject(new Error(`Step ${index + 1} failed: ${error.message}`))
        );
        child.once('exit', (code, signal) => {
            if (code === 0) resolve();
            else reject(new Error(`Step ${index + 1} failed (${args[0]}): ${signal ?? code}`));
        });
    });
};

const seedCommunity = async (): Promise<void> => {
    const { neogma } = await import('@instance');
    try {
        const { createProfile } = await import('@accesslayer/profile/create');
        const { getProfileByProfileId } = await import('@accesslayer/profile/read');
        const { updateProfile } = await import('@accesslayer/profile/update');
        const { grantEcosystemMembership } = await import('@accesslayer/ecosystem/membership');
        const { createEcosystem } = await import('@accesslayer/ecosystem/create');
        const { createGroup, addGroupMember } = await import('@accesslayer/group/write');
        const { Ecosystem, Group } = await import('@models');
        const root = await Ecosystem.findOne({ where: { id: ROOT } });
        if (!root) throw new Error(`Missing ecosystem ${ROOT}`);
        const upsertProfile = async (profile: LCNProfile): Promise<void> => {
            const existing = await getProfileByProfileId(profile.profileId);
            if (existing) await updateProfile(existing, profile);
            else await createProfile(profile);
            await grantEcosystemMembership({
                profileId: profile.profileId,
                ecosystemId: ROOT,
                role: 'MEMBER',
            });
        };
        const personas = [
            ['carmen-reyes', 'Carmen Reyes', 'Teacher'],
            ['marcus-johnson', 'Marcus Johnson', 'Principal'],
            ['elena-patel', 'Elena Patel', 'School counselor'],
            ['james-wilson', 'James Wilson', 'District administrator'],
            ['sofia-nguyen', 'Sofia Nguyen', 'Student'],
            ['noah-thompson', 'Noah Thompson', 'Student'],
            ['aisha-robinson', 'Aisha Robinson', 'Parent'],
            ['daniel-brooks', 'Daniel Brooks', 'Workforce coordinator'],
        ] as const;
        for (const [slug, displayName, role] of personas) {
            const profileId = `rivervale-${slug}`;
            await upsertProfile({
                profileId,
                displayName,
                did: `did:seed:${profileId}`,
                type: 'person',
                shortBio: role,
                bio: `${role} in the Rivervale learning community.`,
                email: `${slug}@rivervale.example`,
            });
            // Role is descriptive persona metadata, distinct from MEMBER_OF authorization.
            await neogma.queryRunner.run(
                'MATCH (p:Profile {profileId: $profileId}) SET p.role = $role',
                { profileId, role }
            );
        }
        await upsertProfile({
            profileId: 'lincoln-high-school',
            displayName: 'Lincoln High School',
            did: 'did:seed:lincoln-high-school',
            type: 'institution',
            shortBio: 'Secondary school in Missoula',
            bio: 'Local development institution fixture.',
            organization: {
                institutionType: 'secondary_school',
                address: {
                    type: 'PostalAddress',
                    addressLocality: 'Missoula',
                    addressRegion: 'MT',
                    addressCountry: 'US',
                },
            },
        });
        await upsertProfile({
            profileId: 'learning-economy-foundation',
            displayName: 'Learning Economy Foundation',
            did: 'did:seed:learning-economy-foundation',
            type: 'employer',
            shortBio: 'Building an open learning economy',
            bio: 'Local development employer fixture.',
        });

        const group =
            (await Group.findOne({
                where: { slug: 'montana-chamber-of-commerce', ownerEcosystemId: ROOT },
            })) ??
            (await createGroup({
                name: 'Montana Chamber of Commerce',
                slug: 'montana-chamber-of-commerce',
                type: 'geographic',
                parentGroupId: null,
                ownerEcosystemId: ROOT,
                membershipMode: 'EXPLICIT',
                status: 'ACTIVE',
            }));
        await addGroupMember(group.id, 'lincoln-high-school', 'MANUAL', {});
        const child =
            (await Ecosystem.findOne({
                where: { slug: 'acme-district', parentEcosystemId: ROOT },
            })) ??
            (await createEcosystem({
                name: 'Acme District',
                slug: 'acme-district',
                parentEcosystemId: ROOT,
                ownerProfileId: root.ownerProfileId,
                settings: {},
                status: 'ACTIVE',
            }));
        await grantEcosystemMembership({
            profileId: root.ownerProfileId,
            ecosystemId: child.id,
            role: 'OWNER',
        });

        const summary = await neogma.queryRunner.run(
            `
            MATCH (l:AppStoreListing) RETURN 'Listing' AS entity, l.display_name AS name, l.kind AS kind
            UNION ALL MATCH (p:Profile)-[:MEMBER_OF]->(:Ecosystem {id: $root})
            RETURN 'Profile' AS entity, p.displayName AS name, p.type AS kind
            UNION ALL MATCH (e:Ecosystem) RETURN 'Ecosystem' AS entity, e.name AS name, e.status AS kind
            UNION ALL MATCH (g:Group) RETURN 'Group' AS entity, g.name AS name, g.type AS kind`,
            { root: ROOT }
        );
        console.table(summary.records.map(record => record.toObject()));
    } finally {
        await neogma.driver.close();
    }
};

const main = async (): Promise<void> => {
    if (process.env.NODE_ENV === 'production') throw new Error('Dev graph fixtures are dev-only.');
    for (const [index, args] of steps.entries()) await runStep(args, index);
    console.log(`\nStep ${steps.length + 1}: Rivervale personas and ecosystem fixtures`);
    try {
        await seedCommunity();
    } catch (error) {
        throw new Error(
            `Step ${steps.length + 1} failed: ${error instanceof Error ? error.message : String(error)}`,
            { cause: error }
        );
    }
    console.log(
        '\nNext steps (UI): Enable the desired wallets; review and install a bundle in eco_dev_root. Approve proposed bindings explicitly.'
    );
};

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error instanceof Error ? error.message : error);
        process.exit(1);
    });
