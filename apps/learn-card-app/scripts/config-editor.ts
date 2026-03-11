#!/usr/bin/env npx tsx

/**
 * config-editor.ts
 *
 * Lightweight dev server for the tenant config editor UI.
 * Serves the SPA and provides REST endpoints for tenant CRUD + validation.
 *
 * Usage:
 *   npx tsx scripts/config-editor.ts
 *   pnpm config-editor
 *
 * Opens http://localhost:4400 in your default browser.
 */

import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { readFileSync, writeFileSync, readdirSync, existsSync, statSync, mkdirSync } from 'fs';
import { resolve, dirname, join, extname } from 'path';
import { fileURLToPath } from 'url';
import { exec, spawn } from 'child_process';

import { tenantConfigSchema } from 'learn-card-base/src/config/tenantConfigSchema';
import { DEFAULT_LEARNCARD_TENANT_CONFIG } from 'learn-card-base/src/config/tenantDefaults';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const APP_ROOT = resolve(__dirname, '..');
const ENVIRONMENTS_DIR = resolve(APP_ROOT, 'environments');
const SPA_PATH = resolve(APP_ROOT, 'tools/config-editor/index.html');

const PORT = 4400;

// ---------------------------------------------------------------------------
// Deep merge (same as prepare-native-config.ts)
// ---------------------------------------------------------------------------

const deepMerge = (
    base: Record<string, unknown>,
    overrides: Record<string, unknown>
): Record<string, unknown> => {
    const result = { ...base };

    for (const key of Object.keys(overrides)) {
        const baseVal = base[key];
        const overrideVal = overrides[key];

        if (
            baseVal && overrideVal &&
            typeof baseVal === 'object' && !Array.isArray(baseVal) &&
            typeof overrideVal === 'object' && !Array.isArray(overrideVal)
        ) {
            result[key] = deepMerge(
                baseVal as Record<string, unknown>,
                overrideVal as Record<string, unknown>,
            );
        } else {
            result[key] = overrideVal;
        }
    }

    return result;
};

// ---------------------------------------------------------------------------
// Compute overrides (diff against defaults)
// ---------------------------------------------------------------------------

const computeOverrides = (
    merged: Record<string, unknown>,
    defaults: Record<string, unknown>
): Record<string, unknown> => {
    const overrides: Record<string, unknown> = {};

    for (const key of Object.keys(merged)) {
        if (key.startsWith('_')) continue;

        const mergedVal = merged[key];
        const defaultVal = defaults[key];

        if (mergedVal === defaultVal) continue;

        if (
            mergedVal && defaultVal &&
            typeof mergedVal === 'object' && !Array.isArray(mergedVal) &&
            typeof defaultVal === 'object' && !Array.isArray(defaultVal)
        ) {
            const nested = computeOverrides(
                mergedVal as Record<string, unknown>,
                defaultVal as Record<string, unknown>,
            );

            if (Object.keys(nested).length > 0) {
                overrides[key] = nested;
            }
        } else if (JSON.stringify(mergedVal) !== JSON.stringify(defaultVal)) {
            overrides[key] = mergedVal;
        }
    }

    return overrides;
};

// ---------------------------------------------------------------------------
// API handlers
// ---------------------------------------------------------------------------

const listTenants = (): { name: string; hasConfig: boolean; hasAssets: boolean }[] => {
    if (!existsSync(ENVIRONMENTS_DIR)) return [];

    return readdirSync(ENVIRONMENTS_DIR)
        .filter(name => {
            const full = join(ENVIRONMENTS_DIR, name);

            return statSync(full).isDirectory();
        })
        .map(name => ({
            name,
            hasConfig: existsSync(join(ENVIRONMENTS_DIR, name, 'config.json')),
            hasAssets: existsSync(join(ENVIRONMENTS_DIR, name, 'assets')),
        }));
};

const readTenantConfig = (tenant: string): { overrides: Record<string, unknown>; merged: Record<string, unknown> } => {
    const configPath = join(ENVIRONMENTS_DIR, tenant, 'config.json');
    let overrides: Record<string, unknown> = {};

    if (existsSync(configPath)) {
        overrides = JSON.parse(readFileSync(configPath, 'utf-8'));
    }

    const merged = deepMerge(
        DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
        overrides,
    );

    return { overrides, merged };
};

const validateConfig = (config: Record<string, unknown>): { valid: boolean; errors: string[]; data?: Record<string, unknown> } => {
    const result = tenantConfigSchema.safeParse(config);

    if (result.success) {
        return { valid: true, errors: [], data: result.data as unknown as Record<string, unknown> };
    }

    return {
        valid: false,
        errors: result.error.issues.map(i => `${i.path.join('.')}: ${i.message}`),
    };
};

const saveTenantConfig = (tenant: string, overrides: Record<string, unknown>): void => {
    const tenantDir = join(ENVIRONMENTS_DIR, tenant);

    if (!existsSync(tenantDir)) {
        mkdirSync(tenantDir, { recursive: true });
    }

    writeFileSync(
        join(tenantDir, 'config.json'),
        JSON.stringify(overrides, null, 4) + '\n',
        'utf-8',
    );
};

const IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico']);

const MIME_TYPES: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
};

const listTenantAssets = (tenant: string): { path: string; name: string; size: number }[] => {
    const assetsDir = join(ENVIRONMENTS_DIR, tenant, 'assets');

    if (!existsSync(assetsDir)) return [];

    const results: { path: string; name: string; size: number }[] = [];

    const walk = (dir: string, prefix: string) => {
        for (const entry of readdirSync(dir)) {
            const full = join(dir, entry);
            const rel = prefix ? `${prefix}/${entry}` : entry;
            const stat = statSync(full);

            if (stat.isDirectory()) {
                walk(full, rel);
            } else if (IMAGE_EXTENSIONS.has(extname(entry).toLowerCase())) {
                results.push({ path: rel, name: entry, size: stat.size });
            }
        }
    };

    walk(assetsDir, '');

    return results;
};

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const readBody = (req: IncomingMessage): Promise<string> =>
    new Promise((resolve, reject) => {
        let body = '';

        req.on('data', (chunk: Buffer) => { body += chunk.toString(); });
        req.on('end', () => resolve(body));
        req.on('error', reject);
    });

const readRawBody = (req: IncomingMessage, maxBytes = 20 * 1024 * 1024): Promise<Buffer> =>
    new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        let size = 0;

        req.on('data', (chunk: Buffer) => {
            size += chunk.length;

            if (size > maxBytes) {
                req.destroy();
                reject(new Error('Body too large'));
                return;
            }

            chunks.push(chunk);
        });

        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });

const runScript = (cmd: string, args: string[]): Promise<{ exitCode: number; output: string }> =>
    new Promise((resolve) => {
        const child = spawn(cmd, args, { cwd: APP_ROOT, shell: true });
        let output = '';

        child.stdout.on('data', (d: Buffer) => { output += d.toString(); });
        child.stderr.on('data', (d: Buffer) => { output += d.toString(); });

        child.on('close', (code) => {
            resolve({ exitCode: code ?? 1, output });
        });

        child.on('error', (err) => {
            resolve({ exitCode: 1, output: output + '\n' + String(err) });
        });
    });

const json = (res: ServerResponse, status: number, data: unknown): void => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
};

// ---------------------------------------------------------------------------
// Theme editor helpers
// ---------------------------------------------------------------------------

const THEME_DIR = resolve(APP_ROOT, 'src/theme');
const THEME_HELPERS_PATH = resolve(THEME_DIR, 'helpers/theme-helpers.ts');
const THEME_COLORS_PATH = resolve(THEME_DIR, 'colors/index.ts');
const THEME_ICONS_PATH = resolve(THEME_DIR, 'icons/index.tsx');
const THEME_STYLES_PATH = resolve(THEME_DIR, 'styles/index.ts');
const THEME_SCHEMAS_DIR = resolve(THEME_DIR, 'schemas');
const THEME_IMAGES_DIR = resolve(THEME_DIR, 'images');
const THEME_LOAD_PATH = resolve(THEME_DIR, 'helpers/loadTheme.ts');

interface ThemeInfo {
    id: string;
    enumKey: string;
    displayName: string;
    schemaFile: string;
}

const parseThemeEnum = (): { id: string; enumKey: string }[] => {
    const src = readFileSync(THEME_HELPERS_PATH, 'utf-8');
    const entries: { id: string; enumKey: string }[] = [];
    const re = /(\w+)\s*=\s*'([^']+)'/g;
    let m: RegExpExecArray | null;

    while ((m = re.exec(src)) !== null) {
        entries.push({ enumKey: m[1]!, id: m[2]! });
    }

    return entries;
};

const listThemes = (): ThemeInfo[] => {
    const enumEntries = parseThemeEnum();

    return enumEntries.map(({ id, enumKey }) => {
        const schemaFile = join(THEME_SCHEMAS_DIR, `${id}.ts`);
        let displayName = enumKey;

        if (existsSync(schemaFile)) {
            const src = readFileSync(schemaFile, 'utf-8');
            const match = src.match(/displayName:\s*'([^']+)'/);

            if (match) displayName = match[1]!;
        }

        return { id, enumKey, displayName, schemaFile };
    });
};

const toPascalCase = (s: string): string =>
    s.replace(/(^|[-_])(\w)/g, (_, __, c: string) => c.toUpperCase());

const toCamelCase = (s: string): string => {
    const p = toPascalCase(s);

    return p.charAt(0).toLowerCase() + p.slice(1);
};

interface ScaffoldOptions {
    id: string;
    displayName: string;
    baseTheme: string; // 'colorful' or 'formal'
    baseCategoryColor: {
        primaryColor: string;
        secondaryColor: string;
        indicatorColor: string;
        borderColor: string;
        statusBarColor: string;
        headerBrandingTextColor: string;
        headerTextColor: string;
        backgroundPrimaryColor: string;
        backgroundSecondaryColor: string;
        tabActiveColor: string;
    };
    viewMode: 'grid' | 'list';
}

const scaffoldTheme = (opts: ScaffoldOptions): { success: boolean; files: string[]; error?: string } => {
    const { id, displayName, baseTheme, baseCategoryColor, viewMode } = opts;
    const enumKey = toPascalCase(id);
    const varName = toCamelCase(id) + 'Theme'; // e.g. 'formalTheme', 'vetpassTheme'
    const files: string[] = [];

    try {
        // 1. Add to ThemeEnum
        const helpersPath = THEME_HELPERS_PATH;
        let helpersSrc = readFileSync(helpersPath, 'utf-8');

        if (helpersSrc.includes(`'${id}'`)) {
            return { success: false, files: [], error: `Theme '${id}' already exists in ThemeEnum` };
        }

        helpersSrc = helpersSrc.replace(
            /^(\s*\w+\s*=\s*'[^']+',?\s*)\n(}\s*)$/m,
            `$1\n    ${enumKey} = '${id}',\n$2`,
        );
        writeFileSync(helpersPath, helpersSrc, 'utf-8');
        files.push(helpersPath);

        // 2. Create schema file
        const schemaPath = join(THEME_SCHEMAS_DIR, `${id}.ts`);
        const vmEnum = viewMode === 'grid' ? 'ViewMode.Grid' : 'ViewMode.List';
        const schemaCode = `import { ViewMode } from '../types/theme.types';
import { ThemeEnum } from '../helpers/theme-helpers';
import type { Theme } from '../validators/theme.validators';

import { createTheme } from '../shared';

import SwitcherIcon from '../../theme/images/${id}-switcher-icon.png';
import BlocksIcon from '../../theme/images/${id}-blocks-icon.png';

import { colors } from '../colors';
import { icons } from '../icons';
import { styles } from '../styles';

export const ${varName}: Theme = createTheme({
    id: ThemeEnum.${enumKey},
    name: '${id}',
    displayName: '${displayName}',
    colors: colors[ThemeEnum.${enumKey}],
    icons: icons[ThemeEnum.${enumKey}],
    styles: styles[ThemeEnum.${enumKey}],
    defaults: {
        viewMode: ${vmEnum},
        switcherIcon: SwitcherIcon,
        buildMyLCIcon: BlocksIcon,
    },
});
`;
        writeFileSync(schemaPath, schemaCode, 'utf-8');
        files.push(schemaPath);

        // 3. Add color entry to colors/index.ts
        let colorsSrc = readFileSync(THEME_COLORS_PATH, 'utf-8');

        // Read the base theme's non-category colors (launchPad, sideMenu, navbar, etc.)
        // by finding the base theme block and extracting from launchPad onwards
        const baseThemeKey = baseTheme === 'colorful' ? 'ThemeEnum.Colorful' : 'ThemeEnum.Formal';
        const baseBlockRegex = new RegExp(
            `\\[${baseThemeKey.replace('.', '\\.')}\\]:\\s*\\{([\\s\\S]*?)^    \\}`,
            'm',
        );
        const baseMatch = colorsSrc.match(baseBlockRegex);
        let nonCategoryBlock = '';

        if (baseMatch) {
            const inner = baseMatch[1]!;
            // Extract from launchPad: onwards
            const lpIdx = inner.indexOf('launchPad:');

            if (lpIdx !== -1) {
                nonCategoryBlock = inner.substring(lpIdx).trimEnd();
                // Remove trailing comma if present
                if (nonCategoryBlock.endsWith(',')) {
                    nonCategoryBlock = nonCategoryBlock.slice(0, -1);
                }
            }
        }

        const bc = baseCategoryColor;
        const colorsEntry = `
    [ThemeEnum.${enumKey}]: {
        ...createUniformCategoryColors(
            {
                primaryColor: '${bc.primaryColor}',
                secondaryColor: '${bc.secondaryColor}',
                indicatorColor: '${bc.indicatorColor}',
                borderColor: '${bc.borderColor}',
                statusBarColor: '${bc.statusBarColor}',
                headerBrandingTextColor: '${bc.headerBrandingTextColor}',
                headerTextColor: '${bc.headerTextColor}',
                backgroundPrimaryColor: '${bc.backgroundPrimaryColor}',
                backgroundSecondaryColor: '${bc.backgroundSecondaryColor}',
                tabActiveColor: '${bc.tabActiveColor}',
            },
        ),

        ${nonCategoryBlock}
    },`;

        // Insert before the closing `};` of the colors object
        // Find the last `};` which closes the colors export
        const lastClose = colorsSrc.lastIndexOf('};');

        if (lastClose === -1) {
            return { success: false, files, error: 'Could not find closing }; in colors/index.ts' };
        }

        colorsSrc = colorsSrc.slice(0, lastClose) + colorsEntry + '\n' + colorsSrc.slice(lastClose);
        writeFileSync(THEME_COLORS_PATH, colorsSrc, 'utf-8');
        files.push(THEME_COLORS_PATH);

        // 4. Add icon entry to icons/index.tsx
        let iconsSrc = readFileSync(THEME_ICONS_PATH, 'utf-8');
        // Find the base theme's icon block and clone it for the new theme
        const baseIconKey = baseTheme === 'colorful' ? 'ThemeEnum.Colorful' : 'ThemeEnum.Formal';

        // Find the full block: [ThemeEnum.Base]: { ... },
        // Use bracket counting to find the matching closing brace
        const iconBlockStart = iconsSrc.indexOf(`[${baseIconKey}]: {`);

        if (iconBlockStart === -1) {
            return { success: false, files, error: `Could not find ${baseIconKey} block in icons/index.tsx` };
        }

        let braceDepth = 0;
        let iconBlockEnd = iconBlockStart;
        let foundOpen = false;

        for (let i = iconBlockStart; i < iconsSrc.length; i++) {
            if (iconsSrc[i] === '{') {
                braceDepth++;
                foundOpen = true;
            } else if (iconsSrc[i] === '}') {
                braceDepth--;

                if (foundOpen && braceDepth === 0) {
                    iconBlockEnd = i + 1;
                    break;
                }
            }
        }

        const baseIconBlock = iconsSrc.substring(iconBlockStart, iconBlockEnd);
        const newIconBlock = baseIconBlock.replace(`[${baseIconKey}]`, `[ThemeEnum.${enumKey}]`);

        // Insert before `} as const satisfies`
        const satisfiesIdx = iconsSrc.indexOf('} as const satisfies ThemeIcons');

        if (satisfiesIdx === -1) {
            return { success: false, files, error: 'Could not find closing marker in icons/index.tsx' };
        }

        iconsSrc = iconsSrc.slice(0, satisfiesIdx) + `    ${newIconBlock},\n` + iconsSrc.slice(satisfiesIdx);
        writeFileSync(THEME_ICONS_PATH, iconsSrc, 'utf-8');
        files.push(THEME_ICONS_PATH);

        // 5. Add style entry to styles/index.ts
        let stylesSrc = readFileSync(THEME_STYLES_PATH, 'utf-8');
        const baseStyleKey = baseTheme === 'colorful' ? 'ThemeEnum.Colorful' : 'ThemeEnum.Formal';

        const styleBlockStart = stylesSrc.indexOf(`[${baseStyleKey}]: {`);

        if (styleBlockStart === -1) {
            return { success: false, files, error: `Could not find ${baseStyleKey} block in styles/index.ts` };
        }

        let sBraceDepth = 0;
        let styleBlockEnd = styleBlockStart;
        let sFoundOpen = false;

        for (let i = styleBlockStart; i < stylesSrc.length; i++) {
            if (stylesSrc[i] === '{') {
                sBraceDepth++;
                sFoundOpen = true;
            } else if (stylesSrc[i] === '}') {
                sBraceDepth--;

                if (sFoundOpen && sBraceDepth === 0) {
                    styleBlockEnd = i + 1;
                    break;
                }
            }
        }

        const baseStyleBlock = stylesSrc.substring(styleBlockStart, styleBlockEnd);
        const newStyleBlock = baseStyleBlock.replace(`[${baseStyleKey}]`, `[ThemeEnum.${enumKey}]`);

        const styleSatisfiesIdx = stylesSrc.indexOf('} as const satisfies');

        if (styleSatisfiesIdx === -1) {
            return { success: false, files, error: 'Could not find closing marker in styles/index.ts' };
        }

        stylesSrc = stylesSrc.slice(0, styleSatisfiesIdx) + `    ${newStyleBlock},\n` + stylesSrc.slice(styleSatisfiesIdx);
        writeFileSync(THEME_STYLES_PATH, stylesSrc, 'utf-8');
        files.push(THEME_STYLES_PATH);

        // 6. Register in loadTheme.ts
        let loadSrc = readFileSync(THEME_LOAD_PATH, 'utf-8');
        const importLine = `import { ${varName} } from '../schemas/${id}';\n`;
        const registerLine = `registerTheme(${varName});\n`;

        // Add import after last existing theme import
        const lastImportIdx = loadSrc.lastIndexOf("from '../schemas/");
        const lastImportEnd = loadSrc.indexOf('\n', lastImportIdx);

        loadSrc = loadSrc.slice(0, lastImportEnd + 1) + importLine + loadSrc.slice(lastImportEnd + 1);

        // Add registerTheme after last existing registerTheme call
        const lastRegisterIdx = loadSrc.lastIndexOf('registerTheme(');
        const lastRegisterEnd = loadSrc.indexOf('\n', lastRegisterIdx);

        loadSrc = loadSrc.slice(0, lastRegisterEnd + 1) + registerLine + loadSrc.slice(lastRegisterEnd + 1);

        writeFileSync(THEME_LOAD_PATH, loadSrc, 'utf-8');
        files.push(THEME_LOAD_PATH);

        // 7. Copy placeholder images from base theme
        const baseImages = [
            { src: `${baseTheme}-switcher-icon.png`, dest: `${id}-switcher-icon.png` },
            { src: `${baseTheme}-blocks-icon.png`, dest: `${id}-blocks-icon.png` },
        ];

        for (const img of baseImages) {
            const srcPath = join(THEME_IMAGES_DIR, img.src);
            const destPath = join(THEME_IMAGES_DIR, img.dest);

            if (existsSync(srcPath)) {
                writeFileSync(destPath, readFileSync(srcPath));
                files.push(destPath);
            }
        }

        return { success: true, files };
    } catch (err) {
        return { success: false, files, error: String(err) };
    }
};

// ---------------------------------------------------------------------------
// Managed dev server process
// ---------------------------------------------------------------------------

interface DevServerState {
    phase: 'preparing' | 'starting' | 'running' | 'stopped' | 'error';
    tenant: string;
    output: string[];
    pid: number | null;
    startedAt: number;
    url: string | null;
    exitCode: number | null;
    process: ReturnType<typeof spawn> | null;
}

const MAX_OUTPUT_LINES = 500;

let devServer: DevServerState | null = null;

const appendOutput = (line: string): void => {
    if (!devServer) return;

    devServer.output.push(line);

    if (devServer.output.length > MAX_OUTPUT_LINES) {
        devServer.output = devServer.output.slice(-MAX_OUTPUT_LINES);
    }
};

const killDevServer = (): void => {
    if (!devServer?.process) return;

    const proc = devServer.process;

    try {
        // Kill the process group (negative PID kills the group)
        if (proc.pid) process.kill(-proc.pid, 'SIGTERM');
    } catch {
        // Fallback: kill just the process
        try { proc.kill('SIGTERM'); } catch { /* already dead */ }
    }

    devServer.process = null;
    devServer.phase = 'stopped';
    devServer.pid = null;
    appendOutput('\n--- Server stopped ---');
};

const startDevServer = (tenant: string): void => {
    // Kill any existing server first
    if (devServer?.process) killDevServer();

    devServer = {
        phase: 'preparing',
        tenant,
        output: [],
        pid: null,
        startedAt: Date.now(),
        url: null,
        exitCode: null,
        process: null,
    };

    appendOutput(`▸ Applying config for "${tenant}"...`);

    // Phase 1: prepare-native-config
    const prepare = spawn(
        'npx',
        ['tsx', 'scripts/prepare-native-config.ts', tenant],
        { cwd: APP_ROOT, shell: true, detached: true },
    );

    devServer.process = prepare;
    devServer.pid = prepare.pid ?? null;

    prepare.stdout.on('data', (d: Buffer) => {
        for (const line of d.toString().split('\n')) {
            if (line.trim()) appendOutput(line);
        }
    });

    prepare.stderr.on('data', (d: Buffer) => {
        for (const line of d.toString().split('\n')) {
            if (line.trim()) appendOutput(line);
        }
    });

    prepare.on('close', (code) => {
        if (!devServer || devServer.phase === 'stopped') return;

        if (code !== 0) {
            devServer.phase = 'error';
            devServer.exitCode = code;
            devServer.process = null;
            appendOutput(`\n✗ prepare-native-config exited with code ${code}`);
            return;
        }

        appendOutput('\n▸ Starting Vite dev server...');
        devServer.phase = 'starting';

        // Phase 2: vite dev
        const vite = spawn('npx', ['vite', '--host'], {
            cwd: APP_ROOT,
            shell: true,
            detached: true,
        });

        devServer.process = vite;
        devServer.pid = vite.pid ?? null;

        vite.stdout.on('data', (d: Buffer) => {
            const text = d.toString();

            for (const line of text.split('\n')) {
                if (line.trim()) appendOutput(line);
            }

            // Detect when Vite is ready
            const urlMatch = text.match(/Local:\s+(https?:\/\/[^\s]+)/);

            if (urlMatch && devServer) {
                devServer.phase = 'running';
                devServer.url = urlMatch[1]!;
            }
        });

        vite.stderr.on('data', (d: Buffer) => {
            for (const line of d.toString().split('\n')) {
                if (line.trim()) appendOutput(line);
            }
        });

        vite.on('close', (viteCode) => {
            if (!devServer || devServer.phase === 'stopped') return;

            devServer.phase = viteCode === 0 ? 'stopped' : 'error';
            devServer.exitCode = viteCode;
            devServer.process = null;
            appendOutput(`\n--- Vite exited (code ${viteCode}) ---`);
        });

        vite.on('error', (err) => {
            if (!devServer) return;

            devServer.phase = 'error';
            devServer.process = null;
            appendOutput(`\n✗ Vite error: ${String(err)}`);
        });
    });

    prepare.on('error', (err) => {
        if (!devServer) return;

        devServer.phase = 'error';
        devServer.process = null;
        appendOutput(`\n✗ Prepare error: ${String(err)}`);
    });
};

const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
    const path = url.pathname;

    // CORS for local dev
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    try {
        // --- Theme API routes ---

        if (path === '/api/themes' && req.method === 'GET') {
            json(res, 200, listThemes());
            return;
        }

        if (path === '/api/themes/scaffold' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req)) as ScaffoldOptions;

            if (!body.id || !body.displayName || !body.baseTheme) {
                json(res, 400, { error: 'Missing required fields: id, displayName, baseTheme' });
                return;
            }

            // Sanitize the id
            const sanitizedId = body.id.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');

            if (!sanitizedId) {
                json(res, 400, { error: 'Invalid theme id' });
                return;
            }

            const result = scaffoldTheme({ ...body, id: sanitizedId });

            json(res, result.success ? 200 : 400, result);
            return;
        }

        const themeSourceMatch = path.match(/^\/api\/themes\/([a-zA-Z0-9_-]+)\/source$/);

        if (themeSourceMatch && req.method === 'GET') {
            const themeId = themeSourceMatch[1]!;
            const sources: Record<string, string> = {};

            const schemaPath = join(THEME_SCHEMAS_DIR, `${themeId}.ts`);

            if (existsSync(schemaPath)) sources.schema = readFileSync(schemaPath, 'utf-8');

            sources.colors = readFileSync(THEME_COLORS_PATH, 'utf-8');
            sources.icons = readFileSync(THEME_ICONS_PATH, 'utf-8');
            sources.styles = readFileSync(THEME_STYLES_PATH, 'utf-8');
            sources.themeEnum = readFileSync(THEME_HELPERS_PATH, 'utf-8');
            sources.loadTheme = readFileSync(THEME_LOAD_PATH, 'utf-8');

            json(res, 200, { themeId, sources });
            return;
        }

        // --- Tenant API routes ---

        if (path === '/api/defaults') {
            json(res, 200, DEFAULT_LEARNCARD_TENANT_CONFIG);
            return;
        }

        if (path === '/api/tenants' && req.method === 'GET') {
            json(res, 200, listTenants());
            return;
        }

        const tenantMatch = path.match(/^\/api\/tenant\/([a-zA-Z0-9_-]+)$/);

        if (tenantMatch) {
            const tenant = tenantMatch[1]!;

            if (req.method === 'GET') {
                json(res, 200, readTenantConfig(tenant));
                return;
            }

            if (req.method === 'PUT') {
                const body = JSON.parse(await readBody(req));
                const merged = deepMerge(
                    DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                    body.overrides,
                );
                const validation = validateConfig(merged);

                if (!validation.valid) {
                    json(res, 400, { error: 'Validation failed', errors: validation.errors });
                    return;
                }

                saveTenantConfig(tenant, body.overrides);
                json(res, 200, { saved: true, overrides: body.overrides, merged });
                return;
            }
        }

        if (path === '/api/validate' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const merged = deepMerge(
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
                body,
            );

            json(res, 200, validateConfig(merged));
            return;
        }

        // List asset files for a tenant
        const assetsListMatch = path.match(/^\/api\/tenant\/([a-zA-Z0-9_-]+)\/assets$/);

        if (assetsListMatch && req.method === 'GET') {
            json(res, 200, listTenantAssets(assetsListMatch[1]!));
            return;
        }

        // Serve an asset file from a tenant's assets directory
        const assetFileMatch = path.match(/^\/assets\/([a-zA-Z0-9_-]+)\/(.+)$/);

        if (assetFileMatch && req.method === 'GET') {
            const tenant = assetFileMatch[1]!;
            const filePath = assetFileMatch[2]!;

            // Prevent directory traversal
            if (filePath.includes('..')) {
                res.writeHead(400, { 'Content-Type': 'text/plain' });
                res.end('Bad request');
                return;
            }

            const fullPath = join(ENVIRONMENTS_DIR, tenant, 'assets', filePath);

            if (!existsSync(fullPath) || !statSync(fullPath).isFile()) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('Asset not found');
                return;
            }

            const ext = extname(fullPath).toLowerCase();
            const mime = MIME_TYPES[ext] ?? 'application/octet-stream';

            res.writeHead(200, {
                'Content-Type': mime,
                'Cache-Control': 'no-cache',
            });
            res.end(readFileSync(fullPath));
            return;
        }

        if (path === '/api/compute-overrides' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const overrides = computeOverrides(
                body,
                DEFAULT_LEARNCARD_TENANT_CONFIG as unknown as Record<string, unknown>,
            );

            json(res, 200, overrides);
            return;
        }

        // --- Action endpoints ---

        if (path === '/api/actions/upload-logo' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant, filename, data } = body;

            if (!tenant || !filename || !data) {
                json(res, 400, { error: 'Missing tenant, filename, or data' });
                return;
            }

            const tenantDir = join(ENVIRONMENTS_DIR, tenant);

            if (!existsSync(tenantDir)) {
                mkdirSync(tenantDir, { recursive: true });
            }

            const logoPath = join(tenantDir, filename);

            writeFileSync(logoPath, Buffer.from(data, 'base64'));
            json(res, 200, { saved: true, path: logoPath });
            return;
        }

        if (path === '/api/actions/generate-assets' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant, bgColor, name } = body;

            if (!tenant) {
                json(res, 400, { error: 'Missing tenant' });
                return;
            }

            const logoPath = join(ENVIRONMENTS_DIR, tenant, 'logo.png');

            if (!existsSync(logoPath)) {
                json(res, 400, { error: 'No logo.png found. Upload a logo first.' });
                return;
            }

            const args = ['scripts/generate-tenant-assets.ts', tenant, logoPath];

            if (bgColor) args.push('--bg', bgColor);
            if (name) args.push('--name', name);

            const result = await runScript('npx tsx', args);

            json(res, result.exitCode === 0 ? 200 : 500, result);
            return;
        }

        if (path === '/api/actions/apply-config' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant } = body;

            if (!tenant) {
                json(res, 400, { error: 'Missing tenant' });
                return;
            }

            const result = await runScript('npx tsx', ['scripts/prepare-native-config.ts', tenant]);

            json(res, result.exitCode === 0 ? 200 : 500, result);
            return;
        }

        if (path === '/api/actions/reset-config' && req.method === 'POST') {
            const result = await runScript('npx tsx', ['scripts/prepare-native-config.ts', '--reset']);

            json(res, result.exitCode === 0 ? 200 : 500, result);
            return;
        }

        if (path === '/api/actions/dev-server/start' && req.method === 'POST') {
            const body = JSON.parse(await readBody(req));
            const { tenant } = body;

            if (!tenant) {
                json(res, 400, { error: 'Missing tenant' });
                return;
            }

            startDevServer(tenant);
            json(res, 200, { started: true, tenant });
            return;
        }

        if (path === '/api/actions/dev-server/status' && req.method === 'GET') {
            if (!devServer) {
                json(res, 200, { active: false });
                return;
            }

            // Return last N lines requested (default 100)
            const since = parseInt(url.searchParams.get('since') ?? '0', 10);
            const lines = devServer.output.slice(since);

            json(res, 200, {
                active: true,
                phase: devServer.phase,
                tenant: devServer.tenant,
                pid: devServer.pid,
                url: devServer.url,
                exitCode: devServer.exitCode,
                startedAt: devServer.startedAt,
                uptime: Date.now() - devServer.startedAt,
                totalLines: devServer.output.length,
                lines,
                since,
            });
            return;
        }

        if (path === '/api/actions/dev-server/stop' && req.method === 'POST') {
            if (!devServer?.process) {
                json(res, 200, { stopped: true, wasRunning: false });
                return;
            }

            killDevServer();
            json(res, 200, { stopped: true, wasRunning: true });
            return;
        }

        // --- SPA ---

        if (path === '/' || path === '/index.html') {
            const html = readFileSync(SPA_PATH, 'utf-8');

            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(html);
            return;
        }

        // 404
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    } catch (err) {
        console.error('Server error:', err);
        json(res, 500, { error: String(err) });
    }
};

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

const server = createServer(handler);

server.listen(PORT, () => {
    const url = `http://localhost:${PORT}`;

    console.log(`\n🎨 Tenant Config Editor running at: ${url}\n`);

    // Open browser
    const cmd = process.platform === 'darwin' ? 'open'
        : process.platform === 'win32' ? 'start'
        : 'xdg-open';

    exec(`${cmd} ${url}`);
});
