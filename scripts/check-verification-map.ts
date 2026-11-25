import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { readVerificationCatalog, repositoryRoot, sameEntries } from './verification-catalog.mjs';

const recipes = resolve(repositoryRoot, '.agents/skills/verify-learncard/features');
const features = await readVerificationCatalog();
const allEntries = new Set([...features.values()].flat());
const files = (await readdir(recipes)).filter(file => file.endsWith('.md') && file !== 'README.md');
sameEntries(
    files.map(file => file.slice(0, -3)),
    [...features.keys()],
    'Recipe files'
);
const headings = [
    'Sub-features',
    'How to get to it (user POV)',
    'Driving it with lc verify',
    'Gotchas',
];
for (const [id, entries] of features) {
    const recipe = await readFile(resolve(recipes, `${id}.md`), 'utf8');
    assert(/^# .+\n\n\S/m.test(recipe), `${id}: missing H1/summary`);
    assert.deepEqual(
        [...recipe.matchAll(/^## (.+)$/gm)].map(match => match[1]),
        headings,
        `${id}: headings`
    );
    assert(recipe.includes('Preconditions:'), `${id}: missing preconditions`);
    const section = recipe.split('## Sub-features\n')[1]?.split('\n## ')[0] ?? '';
    sameEntries(
        [...section.matchAll(/^- `([^`]+)`:/gm)].map(match => match[1]!),
        entries,
        `${id}: recipe`
    );
}
const overview = await readFile(resolve(recipes, 'README.md'), 'utf8');
const rows = [...overview.matchAll(/^\| `([^`]+)`\s*\|[^\n]+$/gm)];
sameEntries(
    rows.map(row => row[1]!),
    [...features.keys()],
    'Overview features'
);
for (const row of rows) {
    const id = row[1]!;
    assert(row[0].includes(`](${id}.md)`), `${id}: missing overview recipe link`);
    const entriesCell = row[0].split('|')[4] ?? '';
    sameEntries(
        [...entriesCell.matchAll(/`([^`]+)`/g)].map(match => match[1]!),
        features.get(id)!,
        `${id}: overview`
    );
}
console.log(
    `Verification map: ${features.size} features / ${allEntries.size} entries match the catalog.`
);
