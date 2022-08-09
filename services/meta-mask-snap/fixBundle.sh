#!/bin/sh

sed -i 's/var root = freeGlobal || freeSelf || Function("return this")()/var root = { Uint8Array }/g' dist/snap.js
sed -i 's/exports.onRpcRequest = onRpcRequest/module.exports = { onRpcRequest }/g' dist/snap.js
sed -i 's/var isEdge = .*;/var isEdge = false;/g' dist/snap.js
sed -i 's/fetch2 = .*;/fetch2 = fetch;/g' dist/snap.js
sed -i 's/{ signal: abortSignal }/{}/g' dist/snap.js
sed -i 's/g\.AbortSignal/AbortSignal/g' dist/snap.js
sed -i 's/g\.AbortController/AbortController/g' dist/snap.js
sed -i 's/g\.AbortSignal/AbortSignal/g' dist/snap.js
