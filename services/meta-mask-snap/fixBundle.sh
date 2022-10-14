#!/bin/sh

sed -i.bak 's/var root = freeGlobal || freeSelf || Function("return this")()/var root = { Uint8Array }/g' dist/snap.js
sed -i.bak 's/exports.onRpcRequest = onRpcRequest/module.exports = { onRpcRequest }/g' dist/snap.js
sed -i.bak 's/var isEdge = .*;/var isEdge = false;/g' dist/snap.js
sed -i.bak 's/fetch2 = .*;/fetch2 = fetch;/g' dist/snap.js
sed -i.bak 's/{ signal: abortSignal }/{}/g' dist/snap.js
sed -i.bak 's/g\.AbortSignal/AbortSignal/g' dist/snap.js
sed -i.bak 's/g\.AbortController/AbortController/g' dist/snap.js
sed -i.bak 's/g\.AbortSignal/AbortSignal/g' dist/snap.js
rm dist/snap.js.bak
