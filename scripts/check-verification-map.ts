import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

// Read the executable declarations without importing the journeys (or generated workspace code).
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const catalogPath = resolve(root, 'apps/learn-card-app/scripts/verification/catalog.ts');
const recipes = resolve(root, '.agents/skills/verify-learncard/features');
const parse = async (path: string) =>
    ts.createSourceFile(path, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true);
const initializer = (source: ts.SourceFile, name: string): ts.Expression => {
    for (const statement of source.statements) {
        if (!ts.isVariableStatement(statement)) continue;
        for (const declaration of statement.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
                assert(declaration.initializer, `${source.fileName}: ${name} needs an initializer`);
                return declaration.initializer;
            }
        }
    }
    throw new Error(`${source.fileName}: missing declaration ${name}`);
};
const literal = (node: ts.Node): string => {
    assert(ts.isStringLiteral(node), 'Catalog IDs/entries must be string literals');
    assert(/^[a-z][a-z0-9-]*$/.test(node.text), `Invalid catalog ID: ${node.text}`);
    return node.text;
};
const sameEntries = (actual: string[], expected: string[], label: string) => {
    assert.equal(new Set(actual).size, actual.length, `${label}: duplicate entries`);
    assert.deepEqual([...actual].sort(), [...expected].sort(), `${label}: entry mismatch`);
};
const source = await parse(catalogPath);
const imports = new Map<string, { path: string; exported: string }>();
for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
        continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const binding of bindings.elements) {
        imports.set(binding.name.text, {
            path: resolve(dirname(catalogPath), `${statement.moduleSpecifier.text}.ts`),
            exported: binding.propertyName?.text ?? binding.name.text,
        });
    }
}
const catalog = initializer(source, 'verificationFeatures');
assert(ts.isArrayLiteralExpression(catalog), 'verificationFeatures must be an explicit array');
const features = new Map<string, string[]>();
const allEntries = new Set<string>();
for (const item of catalog.elements) {
    assert(ts.isIdentifier(item), 'Catalog items must reference named feature declarations');
    const imported = imports.get(item.text);
    assert(imported, `Missing import for ${item.text}`);
    const feature = initializer(await parse(imported.path), imported.exported);
    assert(ts.isObjectLiteralExpression(feature), `${item.text} must be an object literal`);
    const properties = new Map<string, ts.Expression>();
    for (const property of feature.properties) {
        if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
            properties.set(property.name.text, property.initializer);
        }
    }
    const idNode = properties.get('id');
    const entriesNode = properties.get('entries');
    assert(
        idNode && entriesNode && ts.isArrayLiteralExpression(entriesNode),
        `${item.text}: missing id/entries`
    );
    const id = literal(idNode);
    const entries = entriesNode.elements.map(literal);
    assert(!features.has(id), `Duplicate feature ${id}`);
    assert(entries.length, `${id}: empty entries`);
    for (const entry of entries) {
        assert(!allEntries.has(entry), `Duplicate catalog entry ${entry}`);
        allEntries.add(entry);
    }
    features.set(id, entries);
}
assert(features.size, 'Catalog is empty');
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
