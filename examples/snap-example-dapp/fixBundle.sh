#!/bin/sh

sed -i 's/var root = freeGlobal || freeSelf || Function("return this")()/var root = {}/g' out/snap.js
sed -i 's/exports.onRpcRequest = onRpcRequest/module.exports = { onRpcRequest }/g' out/snap.js
sed -i 's/var isEdge = .*;/var isEdge = false;/g' out/snap.js
