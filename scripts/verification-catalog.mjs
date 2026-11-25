import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

export const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
export const sameEntries = (actual, expected, label) => {
    assert(Array.isArray(actual) && Array.isArray(expected), `${label}: expected arrays`);
    assert.equal(new Set(actual).size, actual.length, `${label}: duplicates`);
    assert.deepEqual([...actual].sort(), [...expected].sort(), `${label}: mismatch`);
};

/** Read executable catalog declarations without loading SDKs or generated workspace code. */
export const readVerificationCatalog = async (root = repositoryRoot) => {
    const catalogPath = resolve(root, 'apps/learn-card-app/scripts/verification/catalog.ts');
    const parse = async path =>
        ts.createSourceFile(path, await readFile(path, 'utf8'), ts.ScriptTarget.Latest, true);
    const initializer = (source, name) => {
        for (const statement of source.statements) {
            if (!ts.isVariableStatement(statement)) continue;
            for (const declaration of statement.declarationList.declarations) {
                if (ts.isIdentifier(declaration.name) && declaration.name.text === name) {
                    assert(declaration.initializer, 'Catalog declaration needs an initializer');
                    return declaration.initializer;
                }
            }
        }
        throw new Error('Missing catalog declaration');
    };
    const literal = node => {
        assert(ts.isStringLiteral(node), 'Catalog IDs/entries must be string literals');
        assert(/^[a-z][a-z0-9-]*$/.test(node.text), 'Invalid catalog ID');
        return node.text;
    };
    const source = await parse(catalogPath);
    const imports = new Map();
    for (const statement of source.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier))
            continue;
        if (statement.importClause?.isTypeOnly) continue;
        const bindings = statement.importClause?.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings)) continue;
        assert(/^\.\/journeys\/[a-z-]+$/.test(statement.moduleSpecifier.text));
        for (const binding of bindings.elements) {
            imports.set(binding.name.text, {
                path: resolve(dirname(catalogPath), `${statement.moduleSpecifier.text}.ts`),
                exported: binding.propertyName?.text ?? binding.name.text,
            });
        }
    }
    const catalog = initializer(source, 'verificationFeatures');
    assert(ts.isArrayLiteralExpression(catalog), 'Catalog must be an explicit array');
    const features = new Map();
    const allEntries = new Set();
    for (const item of catalog.elements) {
        assert(ts.isIdentifier(item), 'Catalog must reference named declarations');
        const imported = imports.get(item.text);
        assert(imported, 'Missing catalog import');
        const feature = initializer(await parse(imported.path), imported.exported);
        assert(ts.isObjectLiteralExpression(feature), 'Feature must be an object literal');
        const properties = new Map();
        for (const property of feature.properties) {
            if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name))
                properties.set(property.name.text, property.initializer);
        }
        const idNode = properties.get('id');
        const entriesNode = properties.get('entries');
        assert(idNode && entriesNode && ts.isArrayLiteralExpression(entriesNode));
        const id = literal(idNode);
        const entries = entriesNode.elements.map(literal);
        assert(!features.has(id) && entries.length, 'Duplicate or empty feature');
        for (const entry of entries) {
            assert(!allEntries.has(entry), 'Duplicate catalog entry');
            allEntries.add(entry);
        }
        features.set(id, entries);
    }
    assert(features.size, 'Catalog is empty');
    return features;
};
