function fromUint8Array(uint8Array) {
    var view = new DataView(uint8Array.buffer);
    var bl = view.byteLength, largeLength = bl - bl % 4;
    var hex = '', d = 0;
    for (; d < largeLength; d += 4) {
        hex += ('00000000' + view.getUint32(d).toString(16)).slice(-8);
    }
    for (; d < bl; d++) {
        var c = view.getUint8(d).toString(16);
        hex += c.length < 2 ? '0' + c : c;
    }
    return hex;
}

function toUint8Array(str) {
    if (str.length % 2) 
        { throw new Error('invalid hex:' + str); }
    var sl = str.length, largeLength = sl - sl % 8;
    var uint8Array = new Uint8Array(sl / 2);
    var view = new DataView(uint8Array.buffer);
    var s = 0;
    for (; s < largeLength; s += 8) {
        view.setUint32(s / 8, parseInt(str.substr(s, 8), 16));
    }
    for (; s < sl; s += 2) {
        view.setUint8(s / 2, parseInt(str.substr(s, 2), 16));
    }
    return uint8Array;
}

function fromBuffer(buffer) {
    return fromUint8Array(new Uint8Array(buffer));
}

function toBuffer(str) {
    return toUint8Array(str).buffer;
}

var browserFast = {
    fromUint8Array: fromUint8Array,
    toUint8Array: toUint8Array,
    fromBuffer: fromBuffer,
    toBuffer: toBuffer
}

export { fromUint8Array, toUint8Array, fromBuffer, toBuffer };
export default browserFast;
//# sourceMappingURL=hex-lite.mjs.map
