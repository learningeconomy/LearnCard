#!/usr/bin/env node
/** Local development WebView timing probe. Never collects SQL, call arguments, keys or results. */
import { writeFile, access } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const { values } = parseArgs({
    options: {
        output: { type: 'string' },
        'cdp-port': { type: 'string', default: '19258' },
        help: { type: 'boolean', default: false },
    },
});
if (values.help) {
    console.log(
        'node startup-probe.mjs --output <new-private-file.json> [--cdp-port 19258]. Forward the dedicated dctest WebView debugger port with adb first. Reads startup/native-call timings only; does not restart the app or simulate process death.'
    );
    process.exit(0);
}
if (!values.output) throw Error('Provide a new private --output path');
const port = Number(values['cdp-port']);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw Error('Invalid local CDP port');
try {
    await access(values.output);
    throw Error('Output already exists; choose a new file');
} catch (error) {
    if (error.code !== 'ENOENT') throw error;
}
const root = fileURLToPath(new URL('../../../../', import.meta.url));
const testedHead = execFileSync('git', ['-C', root, 'rev-parse', 'HEAD'], {
    encoding: 'utf8',
}).trim();
const workingTreeDirty =
    execFileSync('git', ['-C', root, 'status', '--porcelain', '-uno'], { encoding: 'utf8' }).trim()
        .length > 0;
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const target =
    targets.find(x => JSON.parse(x.description).visible && !JSON.parse(x.description).empty) ??
    targets[0];
if (!target) throw Error('No WebView target');
const origin = new URL(target.url);
if (!['localhost', '127.0.0.1'].includes(origin.hostname))
    throw Error('Only a local development WebView is supported');
const ws = new WebSocket(target.webSocketDebuggerUrl.replace('localhost', '127.0.0.1'));
await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
});
let sequence = 0;
const waiting = new Map();
ws.onmessage = event => {
    const m = JSON.parse(event.data);
    if (m.id) {
        waiting.get(m.id)?.(m);
        waiting.delete(m.id);
    }
};
const command = (method, params = {}) =>
    new Promise(resolve => {
        const id = ++sequence;
        const timer = setTimeout(() => {
            waiting.delete(id);
            resolve(null);
        }, 8000);
        waiting.set(id, result => {
            clearTimeout(timer);
            resolve(result);
        });
        ws.send(JSON.stringify({ id, method, params }));
    });
const evaluate = async expression => {
    const result = await command('Runtime.evaluate', {
        expression,
        awaitPromise: true,
        returnByValue: true,
    });
    return result?.result?.result?.value;
};
const install = `(async () => {
 performance.setResourceTimingBufferSize(10000);
 if (window.__lcBootProbe) return 'busy';
 const c = window.Capacitor;
 if (typeof c?.nativePromise !== 'function') return false;
 const info = await c.nativePromise('App', 'getInfo');
 if (info.id !== 'com.learncard.app.dctest') return 'unsupported';
 const p = window.__lcBootProbe = { calls: [], pending: {}, errors: 0, start: performance.now() };
 const original = c.nativePromise;
 let sequence = 0;
 p.original = original;
 c.nativePromise = function(plugin, method, ...args) {
   const id = ++sequence, start = performance.now(), name = plugin + '.' + method;
   p.pending[id] = { name, start };
   const finish = ok => { if(p.calls.length<5000)p.calls.push({ name, start, end: performance.now(), ok });else p.dropped=(p.dropped??0)+1; delete p.pending[id]; };
   try { return original.call(this, plugin, method, ...args).then(value => { finish(true); return value; }, error => { finish(false); throw error; }); }
   catch (error) { finish(false); throw error; }
 };
 p.wrapped = c.nativePromise;
 const originalError = console.error;
 p.originalError = originalError;
 console.error = function(...args) { if (args.some(x => typeof x === 'string' && x.includes('[cache]'))) p.errors++; return originalError.apply(this, args); };
 return true;
})()`;
let ownsProbe = false;
try {
    const attachDeadline = Date.now() + 30000;
    for (let i = 0; Date.now() < attachDeadline; i++) {
        const installed = await evaluate(install);
        if (installed === 'busy')
            throw Error(
                'Another timing probe is already attached; restart the development app first'
            );
        if (installed === 'unsupported') throw Error('Only com.learncard.app.dctest is supported');
        if (installed) {
            ownsProbe = true;
            break;
        }
        await new Promise(resolve => setTimeout(resolve, 500));
        if (Date.now() >= attachDeadline) throw Error('Could not attach sanitized probe');
    }
    const snapshots = [];
    let consecutiveReady = 0;
    const deadline = Date.now() + 600000;
    while (Date.now() < deadline) {
        const snapshot = await evaluate(`(() => {
  const p = window.__lcBootProbe;
  if (!p) return { reset: true };
  const grouped = {};
  for (const item of Object.values(p.pending)) { const g = grouped[item.name] ??= { count: 0, oldest: 0 }; g.count++; g.oldest = Math.max(g.oldest, Math.round((performance.now() - item.start) / 1000)); }
  return { elapsed: Math.round(performance.now()/1000), route: ['/dashboard','/wallet','/native-digital-credentials','/'].includes(location.pathname) ? location.pathname : 'other', visibility: document.visibilityState, dom: document.getElementById('root')?.childElementCount ?? 0, walletReady: performance.getEntriesByName('learncard:auth:wallet_ready').length > 0, consent: performance.getEntriesByName('learncard:startup:consent').length > 0, unavailable: performance.getEntriesByName('learncard:startup:unavailable').length > 0, calls: p.calls.length, pending: grouped, cacheErrors: p.errors };
 })()`);
        if (snapshot?.reset) {
            process.exitCode = 1;
            break;
        }
        if (!snapshot) {
            console.log('Runtime busy');
            continue;
        }
        snapshots.push(snapshot);
        console.log(JSON.stringify(snapshot));
        if (
            (['/dashboard', '/wallet'].includes(snapshot.route) ||
                snapshot.consent ||
                snapshot.unavailable) &&
            snapshot.dom > 0
        ) {
            if (++consecutiveReady === 2) break;
        } else consecutiveReady = 0;
        await new Promise(resolve => setTimeout(resolve, 10000));
    }
    if (consecutiveReady < 2 || snapshots.at(-1)?.unavailable) process.exitCode = 1;
    const detail = await evaluate(`(() => { const p = window.__lcBootProbe; return ({
 probe: { calls: p.calls, pending: p.pending, errors: p.errors, start: p.start, dropped: p.dropped ?? 0 },
 nav: performance.getEntriesByType('navigation').map(x => ({ domContentLoaded: x.domContentLoadedEventEnd, load: x.loadEventEnd })),
 wasm: performance.getEntriesByType('resource').filter(x => x.name.includes('.wasm')).map(x => ({ file: new URL(x.name).pathname.split('/').at(-1), start: x.startTime, duration: x.duration, bytes: x.transferSize })),
 externalSqliteScripts: [...document.scripts].filter(x => x.src.includes('cdn.jsdelivr.net/npm/jeep-sqlite')).length,
 marks: performance.getEntriesByType('mark').filter(x => /^(learncard:startup:|learncard:auth:)/.test(x.name)).map(x => ({name:x.name,time:x.startTime}))
}); })()`);
    await evaluate(
        `(() => { const p = window.__lcBootProbe; if (p) { if (p.wrapped && window.Capacitor.nativePromise === p.wrapped) window.Capacitor.nativePromise = p.original; if (p.originalError) console.error = p.originalError; delete window.__lcBootProbe; } })()`
    );
    const path = values.output;
    await writeFile(
        path,
        JSON.stringify(
            {
                testedHead,
                workingTreeDirty,
                reachedStableScreen: consecutiveReady >= 2,
                snapshots,
                detail,
            },
            null,
            2
        ),
        { mode: 0o600, flag: 'wx' }
    );
    console.log('Saved sanitized timings', path);
} finally {
    if (ownsProbe)
        await evaluate(
            `(() => { const p = window.__lcBootProbe; if(p?.wrapped && window.Capacitor.nativePromise === p.wrapped) { window.Capacitor.nativePromise=p.original; console.error=p.originalError; delete window.__lcBootProbe; } })()`
        ).catch(() => undefined);
    ws.close();
}
