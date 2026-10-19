import { access, readFile, realpath, stat, statfs } from 'node:fs/promises';
import { constants } from 'node:fs';
import { totalmem } from 'node:os';
import { join } from 'node:path';
import { chromium } from '@playwright/test';
import { APP_ROOT, REPO_ROOT } from './constants';
import { runCommand } from './process';

/** Restrict commands to the explicitly trusted system daemon; unix:// alone proves nothing. */
export const verifyDockerTrust = async (signal?: AbortSignal): Promise<void> => {
    const overrides = [
        'DOCKER_HOST',
        'DOCKER_CONTEXT',
        'DOCKER_CONFIG',
        'DOCKER_TLS_VERIFY',
        'DOCKER_CERT_PATH',
        'HTTP_PROXY',
        'HTTPS_PROXY',
        'ALL_PROXY',
        'http_proxy',
        'https_proxy',
        'all_proxy',
    ];
    const configured = overrides.filter(key => Boolean(process.env[key]));
    if (configured.length)
        throw new Error(
            `Unset ${configured.join(', ')} for verification. Alternate Docker contexts, sockets and proxy configurations are not verified local.`
        );
    if (process.env.LC_VERIFY_TRUST_LOCAL_DOCKER !== '1')
        throw new Error(
            'Set LC_VERIFY_TRUST_LOCAL_DOCKER=1 only after confirming /var/run/docker.sock belongs to your trusted local system Docker daemon (not a socket proxy or tunnel). A Unix socket is not proof of locality. Alternate/rootless contexts are not supported.'
        );
    const socket = await realpath('/var/run/docker.sock').catch(() => {
        throw new Error(
            'Local Docker socket /var/run/docker.sock is missing. Start your trusted system Docker daemon; verification never starts or reconfigures it.'
        );
    });
    const metadata = await stat(socket);
    if (
        !['/run/docker.sock', '/var/run/docker.sock'].includes(socket) ||
        !metadata.isSocket() ||
        metadata.uid !== 0 ||
        metadata.mode & 0o002
    ) {
        throw new Error(
            'Expected a root-owned, non-world-writable system Docker socket at /run/docker.sock. Refusing unverified proxy/custom socket.'
        );
    }
    await access(socket, constants.R_OK | constants.W_OK).catch(() => {
        throw new Error(
            'Cannot access the trusted local Docker socket. Ask your administrator for Docker access; do not chmod the socket world-writable.'
        );
    });
    const context = await runCommand(['docker', 'context', 'show'], REPO_ROOT, { signal });
    if (context !== 'default')
        throw new Error(
            `Docker context ${context} is not verified local. Select the trusted system default context explicitly.`
        );
    const details = JSON.parse(
        await runCommand(['docker', 'context', 'inspect', 'default'], REPO_ROOT, { signal })
    );
    if (details[0]?.Endpoints?.docker?.Host !== 'unix:///var/run/docker.sock') {
        throw new Error(
            'Default Docker context does not reference unix:///var/run/docker.sock; refusing unverified endpoint.'
        );
    }
    const configPath = join(process.env.HOME ?? '', '.docker/config.json');
    let config: { proxies?: Record<string, unknown> } = {};
    try {
        config = JSON.parse(await readFile(configPath, 'utf8'));
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    }
    if (config.proxies && Object.keys(config.proxies).length)
        throw new Error(
            `Docker client proxy configuration in ${configPath} is unsupported for local-only verification; use a trusted proxy-free system Docker configuration.`
        );
};

export const preflightVerification = async (
    directory = APP_ROOT,
    options: { signal?: AbortSignal } = {}
): Promise<Record<string, unknown>> => {
    const { signal } = options;
    signal?.throwIfAborted();
    if (process.platform !== 'linux')
        throw new Error(
            'lc verify requires Linux /proc birth identity tracking. Use the documented Linux sandbox or hosted manual verification workflow.'
        );
    const pkg = JSON.parse(await readFile(join(REPO_ROOT, 'package.json'), 'utf8')) as {
        packageManager?: string;
        engines?: { node?: string };
    };
    const requiredBun = /^bun@([\d.]+)$/.exec(pkg.packageManager ?? '')?.[1];
    if (!requiredBun || typeof Bun === 'undefined' || Bun.version !== requiredBun) {
        throw new Error(
            `Use ${pkg.packageManager} from package.json (running ${typeof Bun === 'undefined' ? 'non-Bun runtime' : `bun@${Bun.version}`}); then run bun install --frozen-lockfile.`
        );
    }
    const nodeExecutable = process.env.LC_VERIFY_NODE || 'node';
    const node = await runCommand([nodeExecutable, '--version'], REPO_ROOT, { signal }).catch(
        error => {
            throw new Error(
                `Node is required for Astro/backend tooling (${pkg.engines?.node}). Install the repository Node version. ${String(error)}`
            );
        }
    );
    if (!Bun.semver.satisfies(node.replace(/^v/, ''), pkg.engines?.node ?? '>=24.12 <25')) {
        throw new Error(
            `Node ${node} (${nodeExecutable}) does not satisfy package.json engines.node ${pkg.engines?.node}. Put the repository-compatible Node first on PATH or set LC_VERIFY_NODE to its executable.`
        );
    }
    await runCommand(['flock', '--version'], REPO_ROOT, { signal }).catch(error => {
        throw new Error(
            `Linux util-linux flock is required for crash-safe per-directory cleanup ownership. Install your distribution's util-linux package: ${String(error)}`
        );
    });
    await verifyDockerTrust(signal);
    const docker = JSON.parse(
        await runCommand(['docker', 'info', '--format', '{{json .}}'], REPO_ROOT, { signal }).catch(
            error => {
                throw new Error(`Trusted local Docker daemon is unavailable: ${String(error)}`);
            }
        )
    );
    if (docker.HTTPProxy || docker.HTTPSProxy)
        throw new Error(
            'Docker daemon reports an HTTP(S) proxy. Proxy configurations are not verified for this local-only workflow; use a trusted proxy-free system daemon.'
        );
    const compose = await runCommand(['docker', 'compose', 'version', '--short'], REPO_ROOT, {
        signal,
    }).catch(error => {
        throw new Error(
            `Docker Compose v2 plugin is required. Install your distribution's docker-compose plugin: ${String(error)}`
        );
    });
    if (!/^(?:v)?[2-9]\d*\./.test(compose))
        throw new Error(`Docker Compose v2 or newer is required; found ${compose}.`);
    const browserPath = chromium.executablePath();
    await access(browserPath, constants.X_OK).catch(() => {
        throw new Error(
            `Playwright Chromium is missing at ${browserPath}. From ${APP_ROOT}, run bunx playwright install chromium. For missing Linux shared libraries see https://playwright.dev/docs/intro#system-requirements; verification never installs privileged system dependencies.`
        );
    });
    await runCommand([browserPath, '--version'], APP_ROOT, { signal, timeoutMs: 10_000 }).catch(
        error => {
            throw new Error(
                `Playwright Chromium cannot execute (often missing Linux shared libraries). Run bunx playwright install chromium for browser files and consult https://playwright.dev/docs/intro#system-requirements for administrator-installed system libraries; no privileged installation is performed. ${String(error)}`
            );
        }
    );
    const filesystem = await statfs(directory);
    const freeDiskBytes = filesystem.bavail * filesystem.bsize;
    const memoryBytes = totalmem();
    if (freeDiskBytes < 10 * 1024 ** 3)
        throw new Error(
            `Only ${(freeDiskBytes / 1024 ** 3).toFixed(1)} GiB free at ${directory}; free at least 10 GiB for builds/evidence. Docker's storage filesystem also needs image/volume space.`
        );
    const warnings: string[] = [];
    if (memoryBytes < 16 * 1024 ** 3)
        warnings.push(
            `Host has ${(memoryBytes / 1024 ** 3).toFixed(1)} GiB RAM; 16 GiB is recommended. Below roughly 12-16 GiB, app-store and other browser journeys may crash ("Page crashed") when the kernel kills Chromium; an 8 GiB host was reported to swap heavily. This is not a proved minimum.`
        );
    return {
        ok: true,
        platform: process.platform,
        bun: Bun.version,
        node,
        compose,
        browserPath,
        memoryBytes,
        freeDiskBytes,
        warnings,
        dockerTrust:
            'operator-acknowledged root-owned system socket; not cryptographic locality proof',
    };
};
