import { plugin } from 'bun';
import { readFileSync, realpathSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';

const directory = process.env.LCV_BENCH_SOURCE_DIR!;
const output = process.env.LCV_BENCH_HOOK_REPORT!;
if (!directory || !output) throw new Error('Benchmark source selection is required');
const manifest = JSON.parse(readFileSync(resolve(directory, 'manifest.json'), 'utf8'));
const targets = new Map(['shared', 'sharing'].map(name => [
    realpathSync(resolve('apps/learn-card-app/scripts/verification/journeys', name + '.ts')), name,
]));
const counts: Record<string, number> = { shared: 0, sharing: 0 };
plugin({
    name: 'immutable-verification-driver-comparison',
    setup(build) {
        build.onLoad({ filter: /\/journeys\/(?:shared|sharing)\.ts$/ }, args => {
            const name = targets.get(realpathSync(args.path));
            if (!name) return;
            const contents = readFileSync(resolve(directory, name + '.ts'));
            const hash = createHash('sha256').update(contents).digest('hex');
            if (hash !== manifest[name]) throw new Error('Benchmark source hash mismatch');
            counts[name]++;
            writeFileSync(output, JSON.stringify({counts, hashes: manifest}), {mode: 0o600});
            return {contents, loader: 'ts'};
        });
    },
});
