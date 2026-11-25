/**
 * Licence notices and a licence gate for the third-party code bundled into the CLI.
 *
 * The bundle redistributes dependencies without their package folders (and esbuild strips
 * legal comments), so their notices are collected into one file shipped beside it. Every
 * bundled package must also carry an allowed licence, so a copyleft or unlicensed dependency
 * fails the build instead of being discovered by someone reading the notices file.
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join, sep } from 'node:path';

export type ThirdPartyPackage = { name: string; version: string; license: string; text?: string };

/** Permissive licences that may be redistributed inside the MIT-licensed CLI. */
export const ALLOWED_LICENSES = new Set([
    '0BSD',
    'Apache-2.0',
    'BlueOak-1.0.0',
    'BSD-2-Clause',
    'BSD-3-Clause',
    'CC0-1.0',
    'ISC',
    'MIT',
    'Unlicense',
    'Zlib',
]);

/**
 * Packages allowed despite a licence outside ALLOWED_LICENSES. Each entry needs a reason and
 * should be removed once resolved.
 */
export const LICENSE_EXCEPTIONS: Record<string, string> = {
    // GPL-3.0-or-later token data pulled in by @learncard/ethereum-plugin, whose published
    // build already embeds it. Open decision on LC-2337: drop it from the CLI bundle or keep it.
    '@uniswap/default-token-list': 'pending team decision (LC-2337)',
};

export const UNKNOWN_LICENSE = 'UNKNOWN';

const LICENSE_FILE = /^(licen[sc]e|copying|notice)(\..*)?$/i;

/** Reads `license`, or the legacy `{ type }` and `licenses: [{ type }]` manifest forms. */
export const manifestLicense = (manifest: { license?: unknown; licenses?: unknown }): string => {
    const typeOf = (value: unknown): string | undefined => {
        if (typeof value === 'string') return value;
        if (value && typeof value === 'object' && 'type' in value) {
            const { type } = value as { type?: unknown };

            return typeof type === 'string' ? type : undefined;
        }

        return undefined;
    };

    const single = typeOf(manifest.license);

    if (single) return single;

    if (Array.isArray(manifest.licenses)) {
        const types = manifest.licenses.map(typeOf).filter((type): type is string => !!type);

        // Legacy multi-licence lists mean "any of these".
        if (types.length > 0) return types.length === 1 ? types[0]! : `(${types.join(' OR ')})`;
    }

    return UNKNOWN_LICENSE;
};

/**
 * Whether an SPDX expression can be satisfied with allowed licences only: every `AND` operand
 * must be allowed, and at least one `OR` alternative.
 */
export const isLicenseAllowed = (expression: string): boolean => {
    const tokens = expression.match(/\(|\)|[^\s()]+/g) ?? [];
    let position = 0;

    const parseOperand = (): boolean => {
        const token = tokens[position++];

        if (token === '(') {
            const inner = parseOr();
            position++; // closing parenthesis

            return inner;
        }

        // `MIT WITH some-exception`: judge the licence itself.
        if (tokens[position]?.toUpperCase() === 'WITH') position += 2;

        return token !== undefined && ALLOWED_LICENSES.has(token);
    };

    const parseAnd = (): boolean => {
        let allowed = parseOperand();

        while (tokens[position]?.toUpperCase() === 'AND') {
            position++;
            allowed = parseOperand() && allowed;
        }

        return allowed;
    };

    function parseOr(): boolean {
        let allowed = parseAnd();

        while (tokens[position]?.toUpperCase() === 'OR') {
            position++;
            allowed = parseAnd() || allowed;
        }

        return allowed;
    }

    const allowed = parseOr();

    return allowed && position >= tokens.length;
};

/** The installed package that owns a bundled file, or undefined for workspace source. */
export const owningPackageDirectory = (file: string): string | undefined => {
    const marker = `node_modules${sep}`;
    const index = file.lastIndexOf(marker);

    if (index === -1) return undefined;

    const [scopeOrName, maybeName] = file.slice(index + marker.length).split(/[\\/]/);

    if (!scopeOrName) return undefined;

    const name = scopeOrName.startsWith('@') ? join(scopeOrName, maybeName ?? '') : scopeOrName;

    return join(file.slice(0, index + marker.length), name);
};

const describePackage = (directory: string): ThirdPartyPackage | undefined => {
    const manifestPath = join(directory, 'package.json');

    if (!existsSync(manifestPath)) return undefined;

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    const licenseFile = readdirSync(directory)
        .filter(entry => LICENSE_FILE.test(entry))
        .sort()[0];

    return {
        name: manifest.name,
        version: manifest.version,
        license: manifestLicense(manifest),
        ...(licenseFile && { text: readFileSync(join(directory, licenseFile), 'utf8').trim() }),
    };
};

/** Third-party packages owning any of `bundledFiles`, plus `extraDirectories`, sorted by id. */
export const bundledThirdPartyPackages = (
    bundledFiles: string[],
    extraDirectories: string[]
): ThirdPartyPackage[] => {
    const directories = new Set(extraDirectories);

    for (const file of bundledFiles) {
        const directory = owningPackageDirectory(file);

        if (directory) directories.add(directory);
    }

    const described = new Map<string, ThirdPartyPackage>();

    for (const directory of directories) {
        const thirdParty = describePackage(directory);

        if (thirdParty) described.set(`${thirdParty.name}@${thirdParty.version}`, thirdParty);
    }

    return [...described.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, value]) => value);
};

/** Packages whose licence is neither allowed nor listed in LICENSE_EXCEPTIONS. */
export const disallowedPackages = (thirdParty: ThirdPartyPackage[]): ThirdPartyPackage[] =>
    thirdParty.filter(
        ({ name, license }) => !isLicenseAllowed(license) && !(name in LICENSE_EXCEPTIONS)
    );

export const renderLicenseNotices = (thirdParty: ThirdPartyPackage[]): string =>
    [
        '@learncard/cli bundles the following third-party packages.',
        'Each is redistributed under its own licence, reproduced below.',
        '',
        ...thirdParty.map(({ name, version, license, text }) =>
            [
                '-'.repeat(80),
                `${name}@${version}`,
                `License: ${license}`,
                '',
                text ?? '(This package does not ship a licence file; see its repository.)',
            ].join('\n')
        ),
        '',
    ].join('\n');
