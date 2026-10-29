import { execFile, execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';
import { createCdnProxy } from './connect-proxy.mjs';

const { values } = parseArgs({
    options: {
        adb: { type: 'string' },
        serial: { type: 'string' },
        'owned-avd': { type: 'string' },
        apks: { type: 'string' },
        output: { type: 'string' },
        samples: { type: 'string', default: '1' },
        mode: { type: 'string', default: 'cold' },
        'settle-ms': { type: 'string', default: '0' },
        visual: { type: 'boolean', default: false },
        'delay-ms': { type: 'string', default: '10000' },
    },
});
for (const key of ['adb', 'serial', 'owned-avd', 'apks', 'output'])
    if (!values[key]) throw Error(`Missing --${key}`);
if (!/^emulator-\d+$/.test(values.serial))
    throw Error('Only a separately owned emulator is accepted');
const adb = (...args) =>
    execFileSync(values.adb, ['-s', values.serial, ...args], { encoding: 'utf8', timeout: 90000 });
const adbAsync = (...args) =>
    new Promise((resolve, reject) =>
        execFile(
            values.adb,
            ['-s', values.serial, ...args],
            { encoding: 'utf8', timeout: 90000 },
            (error, stdout) => (error ? reject(error) : resolve(stdout))
        )
    );
const name = adb('emu', 'avd', 'name').split(/\r?\n/)[0];
if (name !== values['owned-avd'] || !name.startsWith('codex_cdn_'))
    throw Error('Owned AVD identity mismatch');
const audit = JSON.parse(readFileSync(join(values.apks, 'apk-audit.json'), 'utf8'));
const app = 'com.learncard.app.dctest';
if (audit.package !== app || audit.changedEntries.join() !== 'assets/public/index.html')
    throw Error('APK audit mismatch');
const samples = Number(values.samples);
if (!Number.isInteger(samples) || samples < 1 || samples > 30) throw Error('Invalid sample count');
if (!['cold', 'warm', 'held'].includes(values.mode)) throw Error('Invalid mode');
for (const key of ['delay-ms', 'settle-ms']) {
    const ms = Number(values[key]);
    if (!Number.isInteger(ms) || ms < 0 || ms > 30000) throw Error(`Invalid --${key}`);
}
const output = resolve(values.output);
mkdirSync(output, { mode: 0o700 });
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const proxyOriginal = adb('shell', 'settings', 'get', 'global', 'http_proxy').trim();
let proxy;
if (values.mode === 'held') {
    if (!['null', ':0', ''].includes(proxyOriginal))
        throw Error('Unexpected existing proxy on owned emulator');
    proxy = await createCdnProxy();
    adb('shell', 'settings', 'put', 'global', 'http_proxy', `10.0.2.2:${proxy.port}`);
}

const network = async online => {
    adb('shell', 'svc', 'data', 'disable');
    adb('shell', 'svc', 'wifi', online ? 'enable' : 'disable');
    for (let i = 0; i < 60; i++) {
        const state = adb('shell', 'dumpsys', 'connectivity');
        const active = state.match(/Active default network: (\S+)/)?.[1];
        if (active && (active !== 'none') === online) return;
        await pause(250);
    }
    throw Error('Guest network did not reach requested state');
};

const attach = async () => {
    let port;
    for (let i = 0; i < 100; i++) {
        const pid = adb('shell', 'pidof', app).trim();
        if (pid) {
            try {
                port = adb(
                    'forward',
                    'tcp:0',
                    `localabstract:webview_devtools_remote_${pid}`
                ).trim();
                const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
                const target = targets.find(x => new URL(x.url).hostname === 'localhost');
                if (target) {
                    const ws = new WebSocket(
                        target.webSocketDebuggerUrl.replace('localhost', '127.0.0.1')
                    );
                    await new Promise((resolve, reject) => {
                        ws.onopen = resolve;
                        ws.onerror = reject;
                    });
                    let id = 0;
                    const pending = new Map();
                    const handlers = new Map();
                    ws.onmessage = event => {
                        const result = JSON.parse(event.data);
                        if (result.id) {
                            pending.get(result.id)?.(result);
                            pending.delete(result.id);
                        } else handlers.get(result.method)?.(result.params);
                    };
                    const command = (method, params = {}) =>
                        new Promise((resolve, reject) => {
                            const n = ++id;
                            const timer = setTimeout(() => {
                                pending.delete(n);
                                reject(Error(`CDP timeout: ${method}`));
                            }, 10000);
                            pending.set(n, result => {
                                clearTimeout(timer);
                                if (result.error) reject(Error(result.error.message));
                                else resolve(result.result);
                            });
                            ws.send(JSON.stringify({ id: n, method, params }));
                        });
                    const evaluate = async expression =>
                        (
                            await command('Runtime.evaluate', {
                                expression,
                                returnByValue: true,
                                awaitPromise: true,
                            })
                        ).result?.value;
                    return {
                        command,
                        evaluate,
                        on: (event, handler) => handlers.set(event, handler),
                        close: () => {
                            ws.close();
                            adb('forward', '--remove', `tcp:${port}`);
                        },
                    };
                }
            } catch {
                /* The just-created WebView may not be listening yet. */
            }
            if (port) adb('forward', '--remove', `tcp:${port}`);
        }
        await pause(100);
    }
    throw Error('Owned app WebView did not appear');
};

const expression = `(() => {
 const p=window.__nativeCdnAB;
 if(!p)return null;
 const sql=p.sql.map(x=>({method:x.method,start:x.start,end:x.end,ok:x.ok}));
 const marks=performance.getEntriesByType('mark').filter(x=>/^(learncard:startup:|learncard:auth:)/.test(x.name)).map(x=>({name:x.name,time:x.startTime}));
 return { ...p, sql, marks, now:performance.now(), origin:location.origin,
  native:window.Capacitor?.getPlatform?.(), rootChildren:document.getElementById('root')?.childElementCount??0,
  readyState:document.readyState, timeOrigin:performance.timeOrigin,
  publicEmailInput:!!document.querySelector('input[type=email]'),
  cdnResources:performance.getEntriesByType('resource').filter(x=>x.name.includes('cdn.jsdelivr.net/npm/jeep-sqlite')).map(x=>({start:x.startTime,duration:x.duration,transferSize:x.transferSize})) };
})()`;

const results = [];
const launch = async (variant, online, clear, block) => {
    await network(online);
    adb('shell', 'am', 'force-stop', app);
    adb('install', '-r', join(values.apks, `${variant}-signed.apk`));
    if (clear) adb('shell', 'pm', 'clear', app);
    try {
        adb('shell', 'pm', 'grant', app, 'android.permission.POST_NOTIFICATIONS');
    } catch {
        /* Not all builds request this permission. */
    }
    proxy?.reset(Number(values['delay-ms']));
    let visual;
    const launchOutput = values.visual
        ? await adbAsync(
              'shell',
              'am',
              'instrument',
              '-w',
              '-e',
              'expected',
              online ? 'online' : 'offline',
              'com.learncard.cdn.measure.test/androidx.test.runner.AndroidJUnitRunner'
          )
        : await adbAsync(
              'shell',
              `date +%s%3N; am start -W -n ${app}/com.learncard.app.MainActivity`
          );
    if (values.visual) {
        const captured = launchOutput.match(/visualMetrics=(\{[^\n]+\})/);
        if (!captured) throw Error('Native visual measurement did not return metrics');
        visual = JSON.parse(captured[1]);
    }
    const launchedAt = visual?.launchEpoch ?? Number(launchOutput.split(/\r?\n/)[0]);
    const nativeTotalMs =
        visual?.nativeTotalMs ?? Number(launchOutput.match(/TotalTime:\s*(\d+)/)?.[1]);
    const cdp = await attach();
    try {
        let detail;
        const deadline = Date.now() + 60000;
        while (Date.now() < deadline) {
            detail = await cdp.evaluate(expression);
            const sqlReady = detail?.sql?.some(x => x.method === 'execute' && x.ok);
            if (
                detail?.reactFrame &&
                detail?.interactive &&
                (sqlReady || values.mode === 'held') &&
                (variant === 'without' || detail.cdn)
            )
                break;
            await pause(100);
        }
        const row = {
            block,
            variant,
            online,
            cache: clear ? 'cold' : 'warm',
            mode: values.mode,
            proxy: proxy?.stats(),
            visual,
            launchEpoch: launchedAt,
            nativeTotalMs,
            detail,
        };
        if (detail) {
            row.navigationToReactMs = detail.reactFrame ?? null;
            row.launchToReactMs = detail.reactFrame
                ? detail.timeOrigin + detail.reactFrame - launchedAt
                : null;
            row.sqliteOpenMs = detail.sql.find(x => x.method === 'open' && x.ok)?.end ?? null;
            row.sqliteExecuteMs = detail.sql.find(x => x.method === 'execute' && x.ok)?.end ?? null;
            row.success = Boolean(
                detail.reactFrame &&
                detail.interactive &&
                row.sqliteExecuteMs &&
                (!visual || visual.found)
            );
            if (detail.online !== online)
                throw Error(
                    'Measured navigator network state disagrees with requested guest network'
                );
            if (detail.native !== 'android')
                throw Error('Probe is not executing the native Capacitor path');
        }
        results.push(row);
        writeFileSync(
            join(output, 'samples-private.json'),
            JSON.stringify({ audit, results }, null, 2)
        );
        if (block === 0) {
            if (Number(values['settle-ms']) > 0) await pause(Number(values['settle-ms']));
            const png = execFileSync(values.adb, [
                '-s',
                values.serial,
                'exec-out',
                'screencap',
                '-p',
            ]);
            writeFileSync(join(output, `${variant}-${online ? 'online' : 'offline'}.png`), png);
        }
        console.log(
            JSON.stringify({
                block,
                variant,
                online,
                success: row.success,
                navReactMs: row.navigationToReactMs,
                launchReactMs: row.launchToReactMs,
                sqliteOpenMs: row.sqliteOpenMs,
                cdn: detail?.cdn,
                nativeTotalMs,
                visual,
                proxy: row.proxy,
            })
        );
        if (!row.success) process.exitCode = 1;
        return row;
    } finally {
        cdp.close();
    }
};

try {
    for (let block = 0; block < samples; block++) {
        const cases =
            values.mode === 'held'
                ? [
                      ['without', true],
                      ['with', true],
                  ]
                : [
                      ['without', true],
                      ['with', true],
                      ['with', false],
                      ['without', false],
                  ];
        if (block % 2) cases.reverse();
        for (const [variant, online] of cases) {
            if (values.mode === 'warm') {
                // Warm only the same synthetic app on this owned emulator, then preserve its cache.
                await launch(variant, true, true, -1);
            }
            await launch(variant, online, values.mode !== 'warm', block);
        }
    }
} finally {
    adb('shell', 'am', 'force-stop', app);
    if (proxy) {
        if (proxyOriginal === 'null' || !proxyOriginal)
            adb('shell', 'settings', 'delete', 'global', 'http_proxy');
        else adb('shell', 'settings', 'put', 'global', 'http_proxy', proxyOriginal);
        await proxy.close();
    }
    await network(true);
}
