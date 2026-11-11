#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const ts = createRequire(import.meta.url)('typescript');

const PACKAGE_DEPENDENCY_FIELDS = [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
];

const IGNORED_DIRECTORIES = new Set([
    '.git',
    '.nx',
    '.turbo',
    'build',
    'coverage',
    'dist',
    'node_modules',
]);

const args = new Set(process.argv.slice(2));
const dryRun = args.has('--dry-run');
// Discover all workspace versions, but validate and rewrite only the packages
// this publish job built. Omit --package to prepare the full registry release.
const selectedPackages = new Set(
    [...args]
        .filter(arg => arg.startsWith('--package='))
        .map(arg => arg.slice('--package='.length))
);
const rootArg = process.argv.find(arg => arg.startsWith('--root='));
const root = path.resolve(
    rootArg?.slice('--root='.length) ??
        path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
);

const packageJsonPaths = [];

const walk = dir => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory()) {
            if (IGNORED_DIRECTORIES.has(entry.name)) continue;

            walk(path.join(dir, entry.name));
            continue;
        }

        if (entry.isFile() && entry.name === 'package.json') {
            packageJsonPaths.push(path.join(dir, entry.name));
        }
    }
};

const readJson = file => JSON.parse(fs.readFileSync(file, 'utf8'));

const workspacePackages = new Map();
const packageJsonByPath = new Map();

walk(root);

for (const packageJsonPath of packageJsonPaths) {
    const packageJson = readJson(packageJsonPath);

    packageJsonByPath.set(packageJsonPath, packageJson);

    if (typeof packageJson.name === 'string' && typeof packageJson.version === 'string') {
        workspacePackages.set(packageJson.name, {
            version: packageJson.version,
            private: Boolean(packageJson.private),
            packageJsonPath,
        });
    }
}

for (const name of selectedPackages) {
    const pkg = workspacePackages.get(name);
    if (!name.startsWith('@learncard/') || !pkg || pkg.private) {
        throw new Error(
            'Publish scope must name a public workspace package: ' + JSON.stringify(name)
        );
    }
}

const resolveWorkspaceSpec = (dependencyName, spec, packageJsonPath) => {
    if (!spec.startsWith('workspace:')) return spec;

    const dependency = workspacePackages.get(dependencyName);

    if (!dependency) {
        const relativePath = path.relative(root, packageJsonPath);
        throw new Error(
            `${relativePath} references unknown workspace dependency ${dependencyName}`
        );
    }

    const range = spec.slice('workspace:'.length);

    if (range === '*') return dependency.version;
    if (range === '^') return `^${dependency.version}`;
    if (range === '~') return `~${dependency.version}`;

    if (
        range.startsWith('^') ||
        range.startsWith('~') ||
        range.startsWith('>') ||
        range.startsWith('<') ||
        range.startsWith('=')
    ) {
        return range;
    }

    const relativePath = path.relative(root, packageJsonPath);
    throw new Error(
        `${relativePath} uses unsupported workspace range ${spec} for ${dependencyName}`
    );
};

const changes = [];

// These services retain this runtime dependency for source-based Docker hosts.
// Their npm entry points bundle it or do not use it; require build evidence before omitting it
// from the public install graph. Other private dependencies must fail closed.
const bundledPrivateDependencies = new Map(
    [
        '@learncard/network-brain-service',
        '@learncard/lca-api-service',
        '@learncard/learn-cloud-service',
    ].map(name => [name, new Set(['@learncard/service-config'])])
);

const declarationReferencesDependency = (file, dependencyName, dependencyDir, options) => {
    const source = ts.createSourceFile(
        file,
        fs.readFileSync(file, 'utf8'),
        ts.ScriptTarget.Latest,
        true
    );
    if (source.parseDiagnostics.length > 0) {
        throw new Error('Cannot verify malformed public declaration: ' + file);
    }
    const isInsideDependency = resolvedFile => {
        const relative = path.relative(
            dependencyDir,
            ts.sys.realpath?.(resolvedFile) ?? resolvedFile
        );
        return (
            relative === '' ||
            (relative !== '..' &&
                !relative.startsWith('..' + path.sep) &&
                !path.isAbsolute(relative))
        );
    };
    const isPrivateSpecifier = specifier =>
        specifier === dependencyName || specifier.startsWith(dependencyName + '/');
    for (const { fileName: specifier } of source.typeReferenceDirectives) {
        if (isPrivateSpecifier(specifier)) return true;
        const resolved = ts.resolveTypeReferenceDirective(
            specifier,
            file,
            options,
            ts.sys
        ).resolvedTypeReferenceDirective;
        if (resolved && isInsideDependency(resolved.resolvedFileName)) return true;
    }
    const references = [];
    for (const reference of source.referencedFiles) {
        if (isInsideDependency(path.resolve(path.dirname(file), reference.fileName))) return true;
    }
    const visit = node => {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
            node.moduleSpecifier &&
            ts.isStringLiteral(node.moduleSpecifier)
        ) {
            references.push(node.moduleSpecifier.text);
        } else if (
            ts.isImportEqualsDeclaration(node) &&
            ts.isExternalModuleReference(node.moduleReference) &&
            node.moduleReference.expression &&
            ts.isStringLiteral(node.moduleReference.expression)
        ) {
            references.push(node.moduleReference.expression.text);
        } else if (
            ts.isImportTypeNode(node) &&
            ts.isLiteralTypeNode(node.argument) &&
            ts.isStringLiteral(node.argument.literal)
        ) {
            references.push(node.argument.literal.text);
        }
        ts.forEachChild(node, visit);
    };
    visit(source);
    return references.some(specifier => {
        if (isPrivateSpecifier(specifier)) return true;
        const resolvedModule = ts.resolveModuleName(
            specifier,
            file,
            options,
            ts.sys
        ).resolvedModule;
        return resolvedModule && isInsideDependency(resolvedModule.resolvedFileName);
    });
};

const verifyBundledDependency = (packageJsonPath, dependencyName) => {
    const dir = path.dirname(packageJsonPath);
    const dist = path.join(dir, 'dist');
    const metadataPath = path.join(dist, 'publish-metafile.json');
    if (!fs.existsSync(metadataPath)) {
        throw new Error(
            'Build evidence missing for bundled dependency ' + dependencyName + ' in ' + dir
        );
    }
    const metadata = readJson(metadataPath);
    const outputs = Object.entries(metadata.outputs).filter(([output]) => output.endsWith('.js'));
    if (outputs.length === 0) throw new Error('No JavaScript bundle evidence in ' + dir);
    for (const [output, details] of outputs) {
        const file = path.resolve(dir, output);
        if (
            !fs.existsSync(file) ||
            fs.statSync(file).size !== details.bytes ||
            details.imports.some(
                item =>
                    item.path === dependencyName ||
                    item.path.startsWith(dependencyName + '/') ||
                    item.path.includes('packages/service-config/')
            )
        ) {
            throw new Error(
                'Bundle still requires ' +
                    dependencyName +
                    ' or does not match build evidence in ' +
                    dir
            );
        }
    }
    const configPath = ['tsconfig.build.json', 'tsconfig.json']
        .map(name => path.join(dir, name))
        .find(file => fs.existsSync(file));
    let options = {
        moduleResolution: ts.ModuleResolutionKind.Bundler,
        module: ts.ModuleKind.ESNext,
    };
    if (configPath) {
        const config = ts.readConfigFile(configPath, ts.sys.readFile);
        if (config.error)
            throw new Error('Cannot read declaration resolution config: ' + configPath);
        options = ts.parseJsonConfigFileContent(config.config, ts.sys, dir).options;
    }
    const dependencyDir = fs.realpathSync(
        path.dirname(workspacePackages.get(dependencyName).packageJsonPath)
    );
    let declarations = 0;
    const checkTypes = directory => {
        for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) checkTypes(file);
            else if (/\.d\.[cm]?ts$/.test(entry.name)) {
                declarations += 1;
                if (declarationReferencesDependency(file, dependencyName, dependencyDir, options)) {
                    throw new Error(
                        'Public declarations still reference ' + dependencyName + ': ' + file
                    );
                }
            }
        }
    };
    checkTypes(dist);
    if (declarations === 0) throw new Error('Public declarations missing in ' + dir);
};

for (const [packageJsonPath, packageJson] of packageJsonByPath.entries()) {
    if (selectedPackages.size > 0 && !selectedPackages.has(packageJson.name)) continue;
    if (packageJson.private) continue;
    if (typeof packageJson.name !== 'string' || !packageJson.name.startsWith('@learncard/'))
        continue;

    for (const field of PACKAGE_DEPENDENCY_FIELDS) {
        const dependencies = packageJson[field];

        if (!dependencies || typeof dependencies !== 'object' || Array.isArray(dependencies))
            continue;

        for (const [dependencyName, spec] of Object.entries(dependencies)) {
            if (field !== 'devDependencies' && workspacePackages.get(dependencyName)?.private) {
                if (
                    field === 'dependencies' &&
                    bundledPrivateDependencies.get(packageJson.name)?.has(dependencyName)
                ) {
                    verifyBundledDependency(packageJsonPath, dependencyName);
                    delete dependencies[dependencyName];
                    changes.push({
                        packageJsonPath,
                        packageName: packageJson.name,
                        field,
                        dependencyName,
                        from: spec,
                        to: '(omitted from published dependencies)',
                    });
                    continue;
                }
                throw new Error(
                    `${path.relative(root, packageJsonPath)} ${field}.${dependencyName} ` +
                        'references a private workspace package. Bundle it as a build dependency ' +
                        'or provide a public package before publishing.'
                );
            }
            if (typeof spec !== 'string' || !spec.startsWith('workspace:')) continue;

            const resolvedSpec = resolveWorkspaceSpec(dependencyName, spec, packageJsonPath);

            dependencies[dependencyName] = resolvedSpec;
            changes.push({
                packageJsonPath,
                packageName: packageJson.name ?? path.relative(root, path.dirname(packageJsonPath)),
                field,
                dependencyName,
                from: spec,
                to: resolvedSpec,
            });
        }
    }
}

if (changes.length === 0) {
    console.log('No workspace dependency versions found in package manifests.');
    process.exit(0);
}

const changedPackages = new Set(changes.map(change => change.packageJsonPath));

// Validate every manifest before writing any changes: a private dependency must
// fail the publish pass without leaving partially rewritten manifests behind.
if (!dryRun) {
    for (const packageJsonPath of changedPackages) {
        fs.writeFileSync(
            packageJsonPath,
            `${JSON.stringify(packageJsonByPath.get(packageJsonPath), null, 4)}\n`
        );
    }
}

console.log(
    `${dryRun ? 'Would rewrite' : 'Rewrote'} ${changes.length} workspace dependency version${
        changes.length === 1 ? '' : 's'
    } across ${changedPackages.size} package${changedPackages.size === 1 ? '' : 's'}.`
);

for (const change of changes) {
    const relativePath = path.relative(root, change.packageJsonPath);
    console.log(
        `${relativePath} ${change.field}.${change.dependencyName}: ${change.from} -> ${change.to}`
    );
}
