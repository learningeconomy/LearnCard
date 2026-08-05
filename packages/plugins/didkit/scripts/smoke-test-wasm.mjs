#!/usr/bin/env node

import { readFile } from 'node:fs/promises';

import init, { generateEd25519Key, getVersion, keyToDID } from '../src/didkit/pkg/didkit_wasm.js';

const wasmPath = new URL('../src/didkit/pkg/didkit_wasm_bg.wasm', import.meta.url);
const wasm = new Uint8Array(await readFile(wasmPath));

await init({ module_or_path: wasm });

const key = generateEd25519Key();
const did = keyToDID('key', key);

if (!did.startsWith('did:key:')) throw new Error(`DIDKit generated an invalid DID: ${did}`);

console.log(`DIDKit WASM ${getVersion()} generated ${did}`);
