/**
 * Benchmark: WASM vs Native DIDKit Plugin Performance
 *
 * Run with: npx tsx benchmark.ts
 */

import { performance } from 'perf_hooks';

// Benchmark configuration
const ITERATIONS = 50;
const WARMUP_ITERATIONS = 5;
const INIT_ITERATIONS = 10; // Fewer for init since it's slow

interface BenchmarkResult {
    operation: string;
    wasmAvg: number;
    nativeAvg: number;
    speedup: string;
}

async function benchmark<T>(
    name: string,
    fn: () => Promise<T> | T,
    iterations: number,
    warmupIterations = WARMUP_ITERATIONS
): Promise<number> {
    // Warmup
    for (let i = 0; i < warmupIterations; i++) {
        await fn();
    }

    // Actual benchmark
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
        const start = performance.now();
        await fn();
        const end = performance.now();
        times.push(end - start);
    }

    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    return avg;
}

async function runBenchmarks() {
    console.log('🔬 DIDKit Benchmark: WASM vs Native\n');
    console.log(`Iterations: ${ITERATIONS} (+ ${WARMUP_ITERATIONS} warmup)\n`);

    const results: BenchmarkResult[] = [];

    // ========================================
    // 0. Plugin Initialization Time
    // ========================================
    console.log('📊 Benchmarking Plugin Init Time...');

    const wasmInit = await benchmark(
        'WASM Init',
        async () => {
            const { getDidKitPlugin } = await import('@learncard/didkit-plugin');
            return await getDidKitPlugin();
        },
        INIT_ITERATIONS,
        2
    );

    const nativeInit = await benchmark(
        'Native Init',
        async () => {
            const { getDidKitPlugin } = await import('./src/plugin');
            return await getDidKitPlugin();
        },
        INIT_ITERATIONS,
        2
    );

    results.push({
        operation: 'Plugin Init',
        wasmAvg: wasmInit,
        nativeAvg: nativeInit,
        speedup: `${(wasmInit / nativeInit).toFixed(2)}x`,
    });

    // Load plugins once for remaining tests
    const { getDidKitPlugin: getWasmPlugin } = await import('@learncard/didkit-plugin');
    const wasmPlugin = await getWasmPlugin();

    const { getDidKitPlugin: getNativePlugin } = await import('./src/plugin');
    const nativePlugin = await getNativePlugin();

    // Test seed for deterministic keys
    const testSeed = new Uint8Array(32).fill(42);
    const keypair = nativePlugin.methods.generateEd25519KeyFromBytes({} as any, testSeed);
    const did = nativePlugin.methods.keyToDid({} as any, 'key', keypair);

    // ========================================
    // 1. Key Generation (Ed25519)
    // ========================================
    console.log('📊 Benchmarking Ed25519 Key Generation...');

    const wasmKeyGen = await benchmark(
        'WASM Ed25519 KeyGen',
        () => wasmPlugin.methods.generateEd25519KeyFromBytes({} as any, testSeed),
        ITERATIONS
    );

    const nativeKeyGen = await benchmark(
        'Native Ed25519 KeyGen',
        () => nativePlugin.methods.generateEd25519KeyFromBytes({} as any, testSeed),
        ITERATIONS
    );

    results.push({
        operation: 'Ed25519 Key Generation',
        wasmAvg: wasmKeyGen,
        nativeAvg: nativeKeyGen,
        speedup: `${(wasmKeyGen / nativeKeyGen).toFixed(2)}x`,
    });

    // ========================================
    // 2. Key to DID
    // ========================================
    console.log('📊 Benchmarking keyToDid...');

    const wasmKeyToDid = await benchmark(
        'WASM keyToDid',
        () => wasmPlugin.methods.keyToDid({} as any, 'key', keypair),
        ITERATIONS
    );

    const nativeKeyToDid = await benchmark(
        'Native keyToDid',
        () => nativePlugin.methods.keyToDid({} as any, 'key', keypair),
        ITERATIONS
    );

    results.push({
        operation: 'keyToDid',
        wasmAvg: wasmKeyToDid,
        nativeAvg: nativeKeyToDid,
        speedup: `${(wasmKeyToDid / nativeKeyToDid).toFixed(2)}x`,
    });

    // ========================================
    // 3. Context Loading
    // ========================================
    console.log('📊 Benchmarking contextLoader...');

    const testContextUrl = 'https://www.w3.org/2018/credentials/v1';

    const wasmContextLoad = await benchmark(
        'WASM contextLoader',
        () => wasmPlugin.context!.resolveStaticDocument!({} as any, testContextUrl),
        ITERATIONS
    );

    const nativeContextLoad = await benchmark(
        'Native contextLoader',
        () => nativePlugin.context!.resolveStaticDocument!({} as any, testContextUrl),
        ITERATIONS
    );

    results.push({
        operation: 'Context Loading',
        wasmAvg: wasmContextLoad,
        nativeAvg: nativeContextLoad,
        speedup: `${(wasmContextLoad / nativeContextLoad).toFixed(2)}x`,
    });

    // ========================================
    // 4. keyToVerificationMethod
    // ========================================
    console.log('📊 Benchmarking keyToVerificationMethod...');

    const wasmKeyToVm = await benchmark(
        'WASM keyToVerificationMethod',
        () => wasmPlugin.methods.keyToVerificationMethod({} as any, 'key', keypair),
        ITERATIONS
    );

    const nativeKeyToVm = await benchmark(
        'Native keyToVerificationMethod',
        () => nativePlugin.methods.keyToVerificationMethod({} as any, 'key', keypair),
        ITERATIONS
    );

    results.push({
        operation: 'keyToVerificationMethod',
        wasmAvg: wasmKeyToVm,
        nativeAvg: nativeKeyToVm,
        speedup: `${(wasmKeyToVm / nativeKeyToVm).toFixed(2)}x`,
    });

    // ========================================
    // 5. JWE Encryption (Native only - WASM impl differs)
    // ========================================
    console.log('📊 Benchmarking JWE Encryption (Native only)...');

    const cleartext = 'Hello, this is a secret message for benchmarking!';
    const recipientDid = did;

    const nativeEncrypt = await benchmark(
        'Native createJwe',
        () => nativePlugin.methods.createJwe({} as any, cleartext, [recipientDid]),
        ITERATIONS
    );

    console.log(`   Native JWE Encrypt: ${nativeEncrypt.toFixed(3)}ms avg`);

    // ========================================
    // 6. JWE Decryption (Native only)
    // ========================================
    console.log('📊 Benchmarking JWE Decryption (Native only)...');

    const jwe = await nativePlugin.methods.createJwe({} as any, cleartext, [recipientDid]);

    const nativeDecrypt = await benchmark(
        'Native decryptJwe',
        () => nativePlugin.methods.decryptJwe({} as any, jwe, [keypair]),
        ITERATIONS
    );

    console.log(`   Native JWE Decrypt: ${nativeDecrypt.toFixed(3)}ms avg`);

    // ========================================
    // 7. DAG-JWE Encryption (Native only)
    // ========================================
    console.log('📊 Benchmarking DAG-JWE Encryption (Native only)...');

    const dagCleartext = { message: 'Hello', nested: { data: [1, 2, 3] } };

    const nativeDagEncrypt = await benchmark(
        'Native createDagJwe',
        () => nativePlugin.methods.createDagJwe({} as any, dagCleartext, [recipientDid]),
        ITERATIONS
    );

    console.log(`   Native DAG-JWE Encrypt: ${nativeDagEncrypt.toFixed(3)}ms avg`);

    // ========================================
    // 8. DAG-JWE Decryption (Native only)
    // ========================================
    console.log('📊 Benchmarking DAG-JWE Decryption (Native only)...');

    const dagJwe = await nativePlugin.methods.createDagJwe({} as any, dagCleartext, [recipientDid]);

    const nativeDagDecrypt = await benchmark(
        'Native decryptDagJwe',
        () => nativePlugin.methods.decryptDagJwe({} as any, dagJwe, [keypair]),
        ITERATIONS
    );

    console.log(`   Native DAG-JWE Decrypt: ${nativeDagDecrypt.toFixed(3)}ms avg`);

    // Note: JWE operations use different implementations between WASM and Native
    // so direct comparison isn't meaningful. The native times above show absolute performance.

    // ========================================
    // Print Results
    // ========================================
    console.log('\n' + '='.repeat(80));
    console.log('📈 BENCHMARK RESULTS');
    console.log('='.repeat(80));
    console.log('\n| Operation                           | WASM (ms) | Native (ms) | Speedup |');
    console.log('|-------------------------------------|-----------|-------------|---------|');

    for (const result of results) {
        const speedupNum = parseFloat(result.speedup);
        const speedupStr = speedupNum >= 1 ? result.speedup : `${result.speedup} ❌`;

        console.log(
            `| ${result.operation.padEnd(35)} | ${result.wasmAvg
                .toFixed(3)
                .padStart(9)} | ${result.nativeAvg.toFixed(3).padStart(11)} | ${speedupStr.padStart(
                7
            )} |`
        );
    }

    console.log('\n' + '='.repeat(80));

    // Summary
    const speedups = results.map(r => parseFloat(r.speedup));
    const avgSpeedup = speedups.reduce((a, b) => a + b, 0) / speedups.length;
    const fasterCount = speedups.filter(s => s >= 1).length;
    const slowerCount = speedups.filter(s => s < 1).length;

    console.log(`\n📊 Summary:`);
    console.log(`   Average speedup: ${avgSpeedup.toFixed(2)}x`);
    console.log(`   Native faster: ${fasterCount}/${results.length} operations`);
    console.log(`   Native slower: ${slowerCount}/${results.length} operations`);
    console.log('\nNote: Results may vary based on system load and hardware.');
    console.log('Speedup > 1 = Native faster, < 1 = WASM faster');
}

runBenchmarks().catch(console.error);
