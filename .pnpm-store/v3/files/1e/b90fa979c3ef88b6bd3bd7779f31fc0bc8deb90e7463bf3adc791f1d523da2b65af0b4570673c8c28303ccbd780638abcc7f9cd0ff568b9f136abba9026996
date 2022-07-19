"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const index_1 = require("./index");
worker_threads_1.parentPort.once("message", async ({ method, path, data }) => {
    try {
        if (method === 0)
            worker_threads_1.parentPort.postMessage(await index_1.File.load(path));
        if (method === 1)
            await index_1.File.save(path, data);
        if (method === 2)
            worker_threads_1.parentPort.postMessage(await index_1.Json.load(path));
        if (method === 3)
            worker_threads_1.parentPort.postMessage(await index_1.Json.load(path, undefined, true));
        if (method === 4)
            await index_1.Json.save(path, data);
        if (method === 6)
            await index_1.Buf.save(path, Buffer.from(data));
        if (method === 5) {
            const data = await index_1.Buf.load(path);
            const sharedUint8Array = new Uint8Array(new SharedArrayBuffer(data.byteLength));
            sharedUint8Array.set(data);
            worker_threads_1.parentPort.postMessage(sharedUint8Array);
        }
        setTimeout(process.exit(0), 10);
    }
    catch (error) {
        process.exit(1);
    }
});
