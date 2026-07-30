const { Blob, File } = require('buffer');
const { ReadableStream, TransformStream, WritableStream } = require('stream/web');

class DOMExceptionPolyfill extends Error {
    constructor(message = '', name = 'Error') {
        super(message);
        this.name = name;
    }
}

globalThis.Blob ??= Blob;
globalThis.File ??= File;
globalThis.ReadableStream ??= ReadableStream;
globalThis.TransformStream ??= TransformStream;
globalThis.WritableStream ??= WritableStream;
globalThis.DOMException ??= DOMExceptionPolyfill;

import('../../node_modules/@docusaurus/core/bin/docusaurus.mjs').catch(error => {
    console.error(error);
    process.exitCode = 1;
});
