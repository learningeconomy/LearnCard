#!/bin/sh

sed -i 's/var root = freeGlobal || freeSelf || Function("return this")()/var root = {}/g' dist/snap.js
sed -i 's/exports.onRpcRequest = onRpcRequest/module.exports = { onRpcRequest }/g' dist/snap.js
sed -i 's/var isEdge = .*;/var isEdge = false;/g' dist/snap.js
