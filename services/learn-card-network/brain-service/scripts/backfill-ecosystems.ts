#!/usr/bin/env tsx
/**
 * Backfill shadow root Ecosystems for existing tenants (ADR-001 Phase 2).
 *
 * Idempotent: for each tenant, ensures exactly one `(:Tenant)-[:SERVES]->(:Ecosystem)`
 * root binding. Re-running is safe — tenants that already have a root are skipped.
 *
 * Uses raw Cypher via a standalone Neogma instance so it doesn't depend on the
 * brain-service model layer (whose circular deps break under tsx's CJS transform).
 *
 * Usage:
 *   bun run backfill:ecosystems --tenant learncard
 *   bun run backfill:ecosystems --tenant learncard --tenant vetpass --owner network-seed
 *   bun run backfill:ecosystems --tenant vetpass --name "VetPass" --slug vetpass
 */

import * as dotenv from 'dotenv';
import { Neogma } from 'neogma';
import { v4 as uuid } from 'uuid';

dotenv.config();

type CliOptions = {
    tenants: string[];
    owner: string;
    name?: string;
    slug?: string;
};

const parseArgs = (argv: string[]): CliOptions => {
    const tenants: string[] = [];
    let owner = 'network-seed';
    let name: string | undefined;
    let slug: string | undefined;

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        const next = argv[i + 1];

        if (arg === '--tenant' && next) {
            tenants.push(next);
            i++;
        } else if (arg === '--owner' && next) {
            owner = next;
            i++;
        } else if (arg === '--name' && next) {
            name = next;
            i++;
        } else if (arg === '--slug' && next) {
            slug = next;
            i++;
        }
    }

    return { tenants, owner, name, slug };
};

const slugifyTenantId = (tenantId: string): string => {
    const slug = tenantId
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 64);

    return slug || 'tenant';
};

const main = async (): Promise<void> => {
    const { tenants, owner, name, slug } = parseArgs(process.argv.slice(2));

    if (tenants.length === 0) {
        console.error('No tenants provided. Pass at least one --tenant <id>.');
        process.exit(1);
    }

    const neogma = new Neogma({
        url: process.env.NEO4J_URI || 'bolt://localhost:7687',
        username: process.env.NEO4J_USERNAME || 'neo4j',
        password: process.env.NEO4J_PASSWORD || 'this-is-the-password',
    });

    for (const tenantId of tenants) {
        const existing = await neogma.queryRunner.run(
            'MATCH (t:Tenant { tenantId: $tenantId })-[:SERVES]->(e:Ecosystem) RETURN e.id AS id LIMIT 1',
            { tenantId }
        );

        const existingId = existing.records[0]?.get('id');

        if (existingId) {
            console.log(`✓ ${tenantId}: already bound to root ${existingId} (skipped)`);
            continue;
        }

        const id = `eco_${uuid()}`;
        const now = new Date().toISOString();
        const rootSlug = slug ?? slugifyTenantId(tenantId);
        const rootName = name ?? tenantId;

        await neogma.queryRunner.run(
            `MERGE (t:Tenant { tenantId: $tenantId })
               ON CREATE SET t.createdAt = $now
             SET t.rootEcosystemId = $id, t.updatedAt = $now
             CREATE (e:Ecosystem {
               id: $id, name: $name, slug: $slug,
               pathIds: [$id], slugPath: [$slug],
               depth: 0, rootEcosystemId: $id,
               ownerProfileId: $owner, settings: '{}',
               status: 'ACTIVE', createdAt: $now, updatedAt: $now
             })
             MERGE (t)-[:SERVES]->(e)`,
            { tenantId, id, name: rootName, slug: rootSlug, owner, now }
        );

        console.log(`＋ ${tenantId}: created root ${id} (slug=${rootSlug}, owner=${owner})`);
    }

    await neogma.driver.close();
};

main()
    .then(() => process.exit(0))
    .catch(err => {
        console.error('\n❌ Backfill failed:', err);
        process.exit(1);
    });
