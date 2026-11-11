// Prints the signing-authority seed rollout flags a deployment loads from its checked-in
// config.<tenant>.<stage>.json. Usage: CONFIG_TENANT=scouts bun run sa-seed:flags production
import { resolveStageDefaults } from '@learncard/service-config';

import { base, stages } from '../src/config/stageConfig';

const stage = process.argv[2];
if (!stage)
    throw new Error(
        'Usage: bun run sa-seed:flags <dev|production> (CONFIG_TENANT selects the tenant)'
    );

const resolved = resolveStageDefaults({ base, stages, stage, env: process.env });
console.log(
    JSON.stringify({
        tenant: process.env.CONFIG_TENANT || 'learncard',
        stage,
        SA_SEED_ENCRYPT_WRITES: resolved.SA_SEED_ENCRYPT_WRITES ?? '(schema default)',
        SA_SEED_ALLOW_LEGACY_READ: resolved.SA_SEED_ALLOW_LEGACY_READ ?? '(schema default)',
    })
);
