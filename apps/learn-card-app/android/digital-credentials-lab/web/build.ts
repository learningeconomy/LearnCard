import { build } from 'esbuild';
import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const directory = dirname(fileURLToPath(import.meta.url));
const css = `
*{box-sizing:border-box}body{margin:0;background:#eff0f5;color:#18224e;font-family:Poppins,system-ui,sans-serif;font-size:14px;line-height:1.6}
main{max-width:480px;margin:24px auto;padding:24px;background:white;border-radius:20px}h1{font-size:20px;font-weight:600;line-height:1.4}
p{color:#6f7590}.eyebrow{font-size:12px;font-weight:500}.origin{overflow-wrap:anywhere;color:#353e64;font-size:12px}
.credential{padding:16px;background:#eff0f5;border-radius:16px;color:#18224e}.status{padding:12px;border:1px solid #a7f3d0;background:#ecfdf5;border-radius:16px;color:#047857}
.error{background:#fef2f2;border-color:#fee2e2;color:#b91c1c}button{display:block;width:100%;border:0;margin:16px 0;padding:14px 16px;border-radius:20px;background:#18224e;color:white;font:500 14px Poppins,system-ui,sans-serif}
button.secondary{border:1px solid #c5c8d3;color:#52597a;background:white}button:disabled{opacity:.4}.claim{display:flex;gap:12px;margin:16px 0;color:#353e64}.claim input{width:20px;height:20px;accent-color:#059669}button:focus-visible,input:focus-visible{outline:2px solid #059669;outline-offset:3px}
`;
for (const role of ['holder', 'verifier']) {
    const assets = resolve(directory, `../lab/src/${role}/assets`);
    await mkdir(resolve(assets, 'public'), { recursive: true });
    await build({
        entryPoints: [resolve(directory, `${role}.ts`)],
        outfile: resolve(assets, 'public/app.js'),
        bundle: true,
        platform: 'browser',
        target: 'chrome131',
        format: 'iife',
        conditions: ['browser'],
        sourcemap: false,
    });
    await writeFile(
        resolve(assets, 'public/index.html'),
        `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'unsafe-inline'; connect-src 'self'"><title>LearnCard Credential Lab</title><style>${css}</style></head><body><main id="app" class="font-poppins"></main><script src="app.js"></script></body></html>`
    );
    await writeFile(
        resolve(assets, 'capacitor.config.json'),
        JSON.stringify({
            appId: `com.learncard.dclab.${role}`,
            appName: 'LearnCard Lab',
            webDir: 'public',
            server: { hostname: 'localhost', androidScheme: 'https' },
            android: { loggingBehavior: 'none' },
        })
    );
    await writeFile(resolve(assets, 'capacitor.plugins.json'), '[]');
}
