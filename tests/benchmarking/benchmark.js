/**
 * LearnCard SDK Benchmarks: WASM vs Native
 *
 * - Cold start: Spawns fresh Node processes (true cold start for init)
 * - Warm operations: Runs in-process after init
 */

const { execSync } = require('child_process');
const { performance } = require('perf_hooks');

const COLD_ITERATIONS = 10;
const WARM_ITERATIONS = 20;
const WARMUP = 3;
const SEED = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

function runColdInit(useNative) {
    const didkit = useNative ? ", didkit: 'node'" : '';
    const script = `
        const { initLearnCard } = require('@learncard/init');
        const start = Date.now();
        initLearnCard({ seed: '${SEED}'${didkit} })
            .then(() => { console.log(Date.now() - start); process.exit(0); })
            .catch(() => { console.log(Date.now() - start); process.exit(0); });
    `;

    try {
        const result = execSync(`node -e "${script.replace(/\n/g, ' ')}"`, {
            cwd: __dirname,
            encoding: 'utf8',
            timeout: 60000,
            stdio: ['pipe', 'pipe', 'pipe'],
        });
        return parseInt(result.trim().split('\n')[0], 10);
    } catch (e) {
        if (e.stdout) {
            const time = parseInt(e.stdout.trim().split('\n')[0], 10);
            if (!isNaN(time)) return time;
        }
        throw e;
    }
}

async function benchmarkWarm(fn, iterations) {
    for (let i = 0; i < WARMUP; i++) await fn();

    const times = [];
    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        times.push(performance.now() - start);
    }

    return times.reduce((a, b) => a + b, 0) / times.length;
}

function printResult(op, wasmMs, nativeMs) {
    const speedup = wasmMs / nativeMs;
    const indicator = speedup >= 1 ? '🟢' : '🔴';
    console.log(
        `   ${indicator} ${op.padEnd(20)} WASM: ${wasmMs
            .toFixed(2)
            .padStart(8)}ms | Native: ${nativeMs.toFixed(2).padStart(8)}ms | ${speedup.toFixed(2)}x`
    );
}

async function main() {
    console.log('🔬 LearnCard SDK Benchmarks: WASM vs Native');
    console.log('━'.repeat(70));

    // Cold start benchmark
    console.log('\n📊 COLD START (spawns fresh Node process each iteration)');
    console.log(`   Iterations: ${COLD_ITERATIONS}\n`);

    const wasmTimes = [];
    const nativeTimes = [];

    for (let i = 0; i < COLD_ITERATIONS; i++) {
        wasmTimes.push(runColdInit(false));
        nativeTimes.push(runColdInit(true));
        process.stdout.write(
            `   [${i + 1}/${COLD_ITERATIONS}] WASM: ${wasmTimes[i]}ms | Native: ${
                nativeTimes[i]
            }ms\n`
        );
    }

    const wasmAvg = wasmTimes.reduce((a, b) => a + b, 0) / wasmTimes.length;
    const nativeAvg = nativeTimes.reduce((a, b) => a + b, 0) / nativeTimes.length;
    const initSpeedup = wasmAvg / nativeAvg;

    console.log(
        `\n   🚀 initLearnCard() cold start: WASM ${wasmAvg.toFixed(
            0
        )}ms → Native ${nativeAvg.toFixed(0)}ms (${initSpeedup.toFixed(1)}x faster)`
    );

    // Warm operations
    console.log('\n' + '━'.repeat(70));
    console.log('\n📊 WARM OPERATIONS (pre-initialized LearnCards)');
    console.log(`   Iterations: ${WARM_ITERATIONS} + ${WARMUP} warmup\n`);

    const { initLearnCard } = require('@learncard/init');

    const wasmLC = await initLearnCard({
        seed: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    });
    const nativeLC = await initLearnCard({
        seed: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        didkit: 'node',
    });

    // Credentials
    const testVC = {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        issuer: nativeLC.id.did(),
        issuanceDate: new Date().toISOString(),
        credentialSubject: { id: 'did:example:subject' },
    };

    const wasmIssue = await benchmarkWarm(
        () => wasmLC.invoke.issueCredential({ ...testVC, issuer: wasmLC.id.did() }),
        WARM_ITERATIONS
    );
    const nativeIssue = await benchmarkWarm(
        () => nativeLC.invoke.issueCredential({ ...testVC, issuer: nativeLC.id.did() }),
        WARM_ITERATIONS
    );
    printResult('issueCredential()', wasmIssue, nativeIssue);

    const signedVC = await nativeLC.invoke.issueCredential({
        ...testVC,
        issuer: nativeLC.id.did(),
    });
    const wasmVerify = await benchmarkWarm(
        () => wasmLC.invoke.verifyCredential(signedVC),
        WARM_ITERATIONS
    );
    const nativeVerify = await benchmarkWarm(
        () => nativeLC.invoke.verifyCredential(signedVC),
        WARM_ITERATIONS
    );
    printResult('verifyCredential()', wasmVerify, nativeVerify);

    // JWE
    const wasmDid = wasmLC.id.did();
    const nativeDid = nativeLC.id.did();

    const wasmCreateJwe = await benchmarkWarm(
        () => wasmLC.invoke.createJwe('secret', [wasmDid]),
        WARM_ITERATIONS
    );
    const nativeCreateJwe = await benchmarkWarm(
        () => nativeLC.invoke.createJwe('secret', [nativeDid]),
        WARM_ITERATIONS
    );
    printResult('createJwe()', wasmCreateJwe, nativeCreateJwe);

    const wasmJwe = await wasmLC.invoke.createJwe('secret', [wasmDid]);
    const nativeJwe = await nativeLC.invoke.createJwe('secret', [nativeDid]);
    const wasmDecryptJwe = await benchmarkWarm(
        () => wasmLC.invoke.decryptJwe(wasmJwe),
        WARM_ITERATIONS
    );
    const nativeDecryptJwe = await benchmarkWarm(
        () => nativeLC.invoke.decryptJwe(nativeJwe),
        WARM_ITERATIONS
    );
    printResult('decryptJwe()', wasmDecryptJwe, nativeDecryptJwe);

    const dagData = { x: 1 };
    const wasmCreateDag = await benchmarkWarm(
        () => wasmLC.invoke.createDagJwe(dagData, [wasmDid]),
        WARM_ITERATIONS
    );
    const nativeCreateDag = await benchmarkWarm(
        () => nativeLC.invoke.createDagJwe(dagData, [nativeDid]),
        WARM_ITERATIONS
    );
    printResult('createDagJwe()', wasmCreateDag, nativeCreateDag);

    const wasmDagJwe = await wasmLC.invoke.createDagJwe(dagData, [wasmDid]);
    const nativeDagJwe = await nativeLC.invoke.createDagJwe(dagData, [nativeDid]);
    const wasmDecryptDag = await benchmarkWarm(
        () => wasmLC.invoke.decryptDagJwe(wasmDagJwe),
        WARM_ITERATIONS
    );
    const nativeDecryptDag = await benchmarkWarm(
        () => nativeLC.invoke.decryptDagJwe(nativeDagJwe),
        WARM_ITERATIONS
    );
    printResult('decryptDagJwe()', wasmDecryptDag, nativeDecryptDag);

    // Summary
    console.log('\n' + '━'.repeat(70));
    console.log('📈 SUMMARY\n');
    console.log(
        `   Cold start speedup: ${initSpeedup.toFixed(1)}x (${(wasmAvg - nativeAvg).toFixed(
            0
        )}ms saved per init)`
    );
    console.log('\n   🚀 Use { didkit: "node" } for serverless, CLI tools, worker threads!\n');
}

main().catch(console.error);
