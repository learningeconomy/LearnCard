function fromUint8Array(uint8Array) {
    return uint8Array.reduce(function (ag, v) { return ag += ('00' + v.toString(16)).slice(-2); }, '');
}

function toUint8Array(str) {
    var s = 0, sl = str.length, bytes = [];
    if (sl % 2) 
        { throw new Error('invalid hex:' + str); }
    for (; s < sl; s += 2) {
        bytes.push(parseInt(str.substr(s, 2), 16));
    }
    return new Uint8Array(bytes);
}

function fromBuffer(buffer) {
    return fromUint8Array(new Uint8Array(buffer));
}

function toBuffer(str) {
    return toUint8Array(str).buffer;
}

export { fromUint8Array, toUint8Array, fromBuffer, toBuffer };
//# sourceMappingURL=hex-lite.mjs.map
