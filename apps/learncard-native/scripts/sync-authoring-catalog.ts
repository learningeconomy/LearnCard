import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

// Deliberate, read-only upstream audit. Builds consume the committed snapshot and
// never fetch Git or execute web components. Only literal metadata is evaluated.
const ref = process.argv[process.argv.indexOf('--ref') + 1];
if (!process.argv.includes('--ref') || !ref) throw new Error('Pass --ref <audited Git revision>');
const revision = execFileSync('git', ['rev-parse', `${ref}^{commit}`], { encoding: 'utf8' }).trim();
const paths = {
    constants: 'packages/learn-card-base/src/components/IssueVC/constants.ts',
    categories: 'apps/learn-card-app/src/components/boost/boost-options/boostOptions.ts',
    enums: 'packages/learn-card-base/src/types/boostAndCredentialMetadata.ts',
    formats:
        'apps/learn-card-app/src/components/boost/boostCMS/boostCMSForms/boostCMSAppearance/BoostCMSDisplayTypeSelectorModal.tsx',
    appearance: 'apps/learn-card-app/src/components/boost/boost.ts',
};
const source = (path: string) =>
    ts.createSourceFile(
        path,
        execFileSync('git', ['show', `${revision}:${path}`], { encoding: 'utf8' }),
        ts.ScriptTarget.Latest,
        true,
        path.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );
type Metadata = string | number | Metadata[] | MetadataObject;
interface MetadataObject {
    [key: string]: Metadata;
}
type TypeOption = { title: string; type: string };
const values: Record<string, Metadata> = {};
const propertyValue = (base: Metadata, key: Metadata): Metadata => {
    if (typeof base !== 'object' || Array.isArray(base) || typeof key === 'object')
        throw new Error('Unexpected metadata lookup');
    const value = base[String(key)];
    if (value === undefined) throw new Error(`Missing metadata property: ${key}`);
    return value;
};
const literal = (node: ts.Node): Metadata => {
    if (ts.isStringLiteral(node) || ts.isNumericLiteral(node))
        return ts.isNumericLiteral(node) ? Number(node.text) : node.text;
    if (ts.isPropertyAccessExpression(node))
        return propertyValue(literal(node.expression), node.name.text);
    if (ts.isElementAccessExpression(node))
        return propertyValue(literal(node.expression), literal(node.argumentExpression));
    if (ts.isIdentifier(node) && node.text in values) return values[node.text];
    if (ts.isArrayLiteralExpression(node)) return node.elements.map(literal);
    if (ts.isObjectLiteralExpression(node))
        return Object.fromEntries(
            node.properties.map(property => {
                if (!ts.isPropertyAssignment(property))
                    throw new Error('Unexpected metadata property');
                const key = ts.isComputedPropertyName(property.name)
                    ? literal(property.name.expression)
                    : property.name.getText().replace(/^['"]|['"]$/g, '');
                return [key, literal(property.initializer)];
            })
        );
    throw new Error(`Unsupported metadata expression: ${node.getText().slice(0, 80)}`);
};
const declaration = (file: ts.SourceFile, name: string): ts.VariableDeclaration => {
    let found: ts.VariableDeclaration | undefined;
    const visit = (node: ts.Node) => {
        if (ts.isVariableDeclaration(node) && node.name.getText(file) === name) found = node;
        else ts.forEachChild(node, visit);
    };
    visit(file);
    if (!found?.initializer) throw new Error(`Missing ${name}`);
    return found;
};
const readEnum = (file: ts.SourceFile, name: string) => {
    const node = file.statements.find(
        node => ts.isEnumDeclaration(node) && node.name.text === name
    ) as ts.EnumDeclaration | undefined;
    if (!node) throw new Error(`Missing enum ${name}`);
    values[name] = Object.fromEntries(
        node.members.map(member => [member.name.getText(), literal(member.initializer!)])
    );
};
const constants = source(paths.constants),
    categories = source(paths.categories);
for (const name of ['AchievementTypes', 'ACHIEVEMENT_CATEGORIES', 'CATEGORY_TO_TEMPLATE_LIST'])
    values[name] = literal(declaration(constants, name).initializer!);
readEnum(source(paths.enums), 'BoostCategoryOptionsEnum');
readEnum(source(paths.appearance), 'BoostCMSAppearanceDisplayTypeEnum');
const subtypes = literal(
    declaration(categories, 'CATEGORY_TO_SUBCATEGORY_LIST').initializer!
) as Record<string, TypeOption[]>;
const available = (
    literal(declaration(categories, 'availableBoostCategories').initializer!) as string[]
).filter((value: string) => value !== 'All');
const ids: Record<string, string> = {
    'Social Badge': 'badge',
    Achievement: 'achievement',
    Qualifications: 'qualification',
    'Learning History': 'studies',
    Accomplishment: 'portfolio',
    Accommodation: 'assistance',
    'Work History': 'experience',
    ID: 'id',
};
if (available.some((value: string) => !ids[value]) || available.length !== 8)
    throw new Error('Review changed web category scope before syncing');
const formatNodes = declaration(source(paths.formats), 'displayTypeOptions')
    .initializer as ts.ArrayLiteralExpression;
const formats = formatNodes.elements.map(element => {
    const property = (element as ts.ObjectLiteralExpression).properties.find(
        property => ts.isPropertyAssignment(property) && property.name.getText() === 'type'
    ) as ts.PropertyAssignment;
    return literal(property.initializer);
});
const catalog = {
    sourceRevision: revision,
    sources: paths,
    formats,
    categories: available.map((category: string) => ({
        id: ids[category],
        category,
        types: [
            ...new Map<string, TypeOption>(
                subtypes[category].map(value => [value.type, value])
            ).values(),
        ],
    })),
};
writeFileSync(
    resolve(
        import.meta.dir,
        '../ios/NativeCore/Sources/LearnCardNativeCore/Resources/credential-authoring.json'
    ),
    JSON.stringify(catalog, null, 4) + '\n'
);
console.log(
    `Audited ${revision}: ${formats.join(', ')}; ${catalog.categories.map(value => `${value.category} (${value.types.length})`).join(', ')}`
);
