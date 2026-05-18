"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  SD_JWT_SALT_LENGTH_BYTES: () => SD_JWT_SALT_LENGTH_BYTES,
  SD_JWT_VC_FORMAT: () => SD_JWT_VC_FORMAT,
  SD_JWT_VC_FORMAT_LEGACY: () => SD_JWT_VC_FORMAT_LEGACY,
  SdJwtVcError: () => SdJwtVcError,
  createJoseVerifier: () => createJoseVerifier,
  createSdJwtVcInstance: () => createSdJwtVcInstance,
  decodeJoseHeader: () => decodeJoseHeader,
  getSdJwtVcPlugin: () => getSdJwtVcPlugin,
  isSdJwtCompact: () => isSdJwtCompact,
  isSdJwtVcFormat: () => isSdJwtVcFormat,
  isSupportedHashAlg: () => isSupportedHashAlg,
  parseSdJwtVc: () => parseSdJwtVc,
  randomSalt: () => randomSalt,
  sha256Hasher: () => sha256Hasher,
  verifySdJwtVc: () => verifySdJwtVc
});
module.exports = __toCommonJS(index_exports);

// ../../../node_modules/.pnpm/@sd-jwt+types@0.19.0/node_modules/@sd-jwt/types/dist/index.mjs
var SD_SEPARATOR = "~";
var SD_LIST_KEY = "...";
var SD_DIGEST = "_sd";

// ../../../node_modules/.pnpm/js-base64@3.7.8/node_modules/js-base64/base64.mjs
var version = "3.7.8";
var VERSION = version;
var _hasBuffer = typeof Buffer === "function";
var _TD = typeof TextDecoder === "function" ? new TextDecoder() : void 0;
var _TE = typeof TextEncoder === "function" ? new TextEncoder() : void 0;
var b64ch = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
var b64chs = Array.prototype.slice.call(b64ch);
var b64tab = ((a) => {
  let tab = {};
  a.forEach((c, i) => tab[c] = i);
  return tab;
})(b64chs);
var b64re = /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/;
var _fromCC = String.fromCharCode.bind(String);
var _U8Afrom = typeof Uint8Array.from === "function" ? Uint8Array.from.bind(Uint8Array) : (it) => new Uint8Array(Array.prototype.slice.call(it, 0));
var _mkUriSafe = /* @__PURE__ */ __name((src) => src.replace(/=/g, "").replace(/[+\/]/g, (m0) => m0 == "+" ? "-" : "_"), "_mkUriSafe");
var _tidyB64 = /* @__PURE__ */ __name((s) => s.replace(/[^A-Za-z0-9\+\/]/g, ""), "_tidyB64");
var btoaPolyfill = /* @__PURE__ */ __name((bin) => {
  let u32, c0, c1, c2, asc = "";
  const pad = bin.length % 3;
  for (let i = 0; i < bin.length; ) {
    if ((c0 = bin.charCodeAt(i++)) > 255 || (c1 = bin.charCodeAt(i++)) > 255 || (c2 = bin.charCodeAt(i++)) > 255)
      throw new TypeError("invalid character found");
    u32 = c0 << 16 | c1 << 8 | c2;
    asc += b64chs[u32 >> 18 & 63] + b64chs[u32 >> 12 & 63] + b64chs[u32 >> 6 & 63] + b64chs[u32 & 63];
  }
  return pad ? asc.slice(0, pad - 3) + "===".substring(pad) : asc;
}, "btoaPolyfill");
var _btoa = typeof btoa === "function" ? (bin) => btoa(bin) : _hasBuffer ? (bin) => Buffer.from(bin, "binary").toString("base64") : btoaPolyfill;
var _fromUint8Array = _hasBuffer ? (u8a) => Buffer.from(u8a).toString("base64") : (u8a) => {
  const maxargs = 4096;
  let strs = [];
  for (let i = 0, l = u8a.length; i < l; i += maxargs) {
    strs.push(_fromCC.apply(null, u8a.subarray(i, i + maxargs)));
  }
  return _btoa(strs.join(""));
};
var fromUint8Array = /* @__PURE__ */ __name((u8a, urlsafe = false) => urlsafe ? _mkUriSafe(_fromUint8Array(u8a)) : _fromUint8Array(u8a), "fromUint8Array");
var cb_utob = /* @__PURE__ */ __name((c) => {
  if (c.length < 2) {
    var cc = c.charCodeAt(0);
    return cc < 128 ? c : cc < 2048 ? _fromCC(192 | cc >>> 6) + _fromCC(128 | cc & 63) : _fromCC(224 | cc >>> 12 & 15) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
  } else {
    var cc = 65536 + (c.charCodeAt(0) - 55296) * 1024 + (c.charCodeAt(1) - 56320);
    return _fromCC(240 | cc >>> 18 & 7) + _fromCC(128 | cc >>> 12 & 63) + _fromCC(128 | cc >>> 6 & 63) + _fromCC(128 | cc & 63);
  }
}, "cb_utob");
var re_utob = /[\uD800-\uDBFF][\uDC00-\uDFFFF]|[^\x00-\x7F]/g;
var utob = /* @__PURE__ */ __name((u) => u.replace(re_utob, cb_utob), "utob");
var _encode = _hasBuffer ? (s) => Buffer.from(s, "utf8").toString("base64") : _TE ? (s) => _fromUint8Array(_TE.encode(s)) : (s) => _btoa(utob(s));
var encode = /* @__PURE__ */ __name((src, urlsafe = false) => urlsafe ? _mkUriSafe(_encode(src)) : _encode(src), "encode");
var encodeURI = /* @__PURE__ */ __name((src) => encode(src, true), "encodeURI");
var re_btou = /[\xC0-\xDF][\x80-\xBF]|[\xE0-\xEF][\x80-\xBF]{2}|[\xF0-\xF7][\x80-\xBF]{3}/g;
var cb_btou = /* @__PURE__ */ __name((cccc) => {
  switch (cccc.length) {
    case 4:
      var cp = (7 & cccc.charCodeAt(0)) << 18 | (63 & cccc.charCodeAt(1)) << 12 | (63 & cccc.charCodeAt(2)) << 6 | 63 & cccc.charCodeAt(3), offset = cp - 65536;
      return _fromCC((offset >>> 10) + 55296) + _fromCC((offset & 1023) + 56320);
    case 3:
      return _fromCC((15 & cccc.charCodeAt(0)) << 12 | (63 & cccc.charCodeAt(1)) << 6 | 63 & cccc.charCodeAt(2));
    default:
      return _fromCC((31 & cccc.charCodeAt(0)) << 6 | 63 & cccc.charCodeAt(1));
  }
}, "cb_btou");
var btou = /* @__PURE__ */ __name((b) => b.replace(re_btou, cb_btou), "btou");
var atobPolyfill = /* @__PURE__ */ __name((asc) => {
  asc = asc.replace(/\s+/g, "");
  if (!b64re.test(asc))
    throw new TypeError("malformed base64.");
  asc += "==".slice(2 - (asc.length & 3));
  let u24, r1, r2;
  let binArray = [];
  for (let i = 0; i < asc.length; ) {
    u24 = b64tab[asc.charAt(i++)] << 18 | b64tab[asc.charAt(i++)] << 12 | (r1 = b64tab[asc.charAt(i++)]) << 6 | (r2 = b64tab[asc.charAt(i++)]);
    if (r1 === 64) {
      binArray.push(_fromCC(u24 >> 16 & 255));
    } else if (r2 === 64) {
      binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255));
    } else {
      binArray.push(_fromCC(u24 >> 16 & 255, u24 >> 8 & 255, u24 & 255));
    }
  }
  return binArray.join("");
}, "atobPolyfill");
var _atob = typeof atob === "function" ? (asc) => atob(_tidyB64(asc)) : _hasBuffer ? (asc) => Buffer.from(asc, "base64").toString("binary") : atobPolyfill;
var _toUint8Array = _hasBuffer ? (a) => _U8Afrom(Buffer.from(a, "base64")) : (a) => _U8Afrom(_atob(a).split("").map((c) => c.charCodeAt(0)));
var toUint8Array = /* @__PURE__ */ __name((a) => _toUint8Array(_unURI(a)), "toUint8Array");
var _decode = _hasBuffer ? (a) => Buffer.from(a, "base64").toString("utf8") : _TD ? (a) => _TD.decode(_toUint8Array(a)) : (a) => btou(_atob(a));
var _unURI = /* @__PURE__ */ __name((a) => _tidyB64(a.replace(/[-_]/g, (m0) => m0 == "-" ? "+" : "/")), "_unURI");
var decode = /* @__PURE__ */ __name((src) => _decode(_unURI(src)), "decode");
var isValid = /* @__PURE__ */ __name((src) => {
  if (typeof src !== "string")
    return false;
  const s = src.replace(/\s+/g, "").replace(/={0,2}$/, "");
  return !/[^\s0-9a-zA-Z\+/]/.test(s) || !/[^\s0-9a-zA-Z\-_]/.test(s);
}, "isValid");
var _noEnum = /* @__PURE__ */ __name((v) => {
  return {
    value: v,
    enumerable: false,
    writable: true,
    configurable: true
  };
}, "_noEnum");
var extendString = /* @__PURE__ */ __name(function() {
  const _add = /* @__PURE__ */ __name((name, body) => Object.defineProperty(String.prototype, name, _noEnum(body)), "_add");
  _add("fromBase64", function() {
    return decode(this);
  });
  _add("toBase64", function(urlsafe) {
    return encode(this, urlsafe);
  });
  _add("toBase64URI", function() {
    return encode(this, true);
  });
  _add("toBase64URL", function() {
    return encode(this, true);
  });
  _add("toUint8Array", function() {
    return toUint8Array(this);
  });
}, "extendString");
var extendUint8Array = /* @__PURE__ */ __name(function() {
  const _add = /* @__PURE__ */ __name((name, body) => Object.defineProperty(Uint8Array.prototype, name, _noEnum(body)), "_add");
  _add("toBase64", function(urlsafe) {
    return fromUint8Array(this, urlsafe);
  });
  _add("toBase64URI", function() {
    return fromUint8Array(this, true);
  });
  _add("toBase64URL", function() {
    return fromUint8Array(this, true);
  });
}, "extendUint8Array");
var extendBuiltins = /* @__PURE__ */ __name(() => {
  extendString();
  extendUint8Array();
}, "extendBuiltins");
var gBase64 = {
  version,
  VERSION,
  atob: _atob,
  atobPolyfill,
  btoa: _btoa,
  btoaPolyfill,
  fromBase64: decode,
  toBase64: encode,
  encode,
  encodeURI,
  encodeURL: encodeURI,
  utob,
  btou,
  decode,
  isValid,
  fromUint8Array,
  toUint8Array,
  extendString,
  extendUint8Array,
  extendBuiltins
};

// ../../../node_modules/.pnpm/@sd-jwt+utils@0.19.0/node_modules/@sd-jwt/utils/dist/index.mjs
var __async = /* @__PURE__ */ __name((__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = /* @__PURE__ */ __name((value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }, "fulfilled");
    var rejected = /* @__PURE__ */ __name((value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    }, "rejected");
    var step = /* @__PURE__ */ __name((x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected), "step");
    step((generator = generator.apply(__this, __arguments)).next());
  });
}, "__async");
var base64urlEncode = gBase64.encodeURI;
var base64urlDecode = gBase64.decode;
var uint8ArrayToBase64Url = /* @__PURE__ */ __name((input) => gBase64.fromUint8Array(input, true), "uint8ArrayToBase64Url");
var _a;
var SDJWTException = (_a = class extends Error {
  constructor(message, details) {
    super(message);
    Object.setPrototypeOf(this, _a.prototype);
    this.name = "SDJWTException";
    this.details = details;
  }
  getFullMessage() {
    return `${this.name}: ${this.message} ${this.details ? `- ${JSON.stringify(this.details)}` : ""}`;
  }
}, __name(_a, "_SDJWTException"), _a);
var _a2;
var Disclosure = (_a2 = class {
  constructor(data, _meta) {
    this._digest = _meta == null ? void 0 : _meta.digest;
    this._encoded = _meta == null ? void 0 : _meta.encoded;
    if (data.length === 2) {
      this.salt = data[0];
      this.value = data[1];
      return;
    }
    if (data.length === 3) {
      this.salt = data[0];
      this.key = data[1];
      this.value = data[2];
      return;
    }
    throw new SDJWTException("Invalid disclosure data");
  }
  // We need to digest of the original encoded data.
  // After decode process, we use JSON.stringify to encode the data.
  // This can be different from the original encoded data.
  static fromEncode(s, hash) {
    return __async(this, null, function* () {
      const { hasher, alg } = hash;
      const digest = yield hasher(s, alg);
      const digestStr = uint8ArrayToBase64Url(digest);
      const item = JSON.parse(base64urlDecode(s));
      return _a2.fromArray(item, { digest: digestStr, encoded: s });
    });
  }
  static fromEncodeSync(s, hash) {
    const { hasher, alg } = hash;
    const digest = hasher(s, alg);
    const digestStr = uint8ArrayToBase64Url(digest);
    const item = JSON.parse(base64urlDecode(s));
    return _a2.fromArray(item, { digest: digestStr, encoded: s });
  }
  static fromArray(item, _meta) {
    return new _a2(item, _meta);
  }
  encode() {
    if (!this._encoded) {
      this._encoded = base64urlEncode(JSON.stringify(this.decode()));
    }
    return this._encoded;
  }
  decode() {
    return this.key ? [this.salt, this.key, this.value] : [this.salt, this.value];
  }
  digest(hash) {
    return __async(this, null, function* () {
      const { hasher, alg } = hash;
      if (!this._digest) {
        const hash2 = yield hasher(this.encode(), alg);
        this._digest = uint8ArrayToBase64Url(hash2);
      }
      return this._digest;
    });
  }
  digestSync(hash) {
    const { hasher, alg } = hash;
    if (!this._digest) {
      const hash2 = hasher(this.encode(), alg);
      this._digest = uint8ArrayToBase64Url(hash2);
    }
    return this._digest;
  }
}, __name(_a2, "_Disclosure"), _a2);

// ../../../node_modules/.pnpm/@sd-jwt+decode@0.19.0/node_modules/@sd-jwt/decode/dist/index.mjs
var __getOwnPropSymbols = Object.getOwnPropertySymbols;
var __hasOwnProp2 = Object.prototype.hasOwnProperty;
var __propIsEnum = Object.prototype.propertyIsEnumerable;
var __objRest = /* @__PURE__ */ __name((source, exclude) => {
  var target = {};
  for (var prop in source)
    if (__hasOwnProp2.call(source, prop) && exclude.indexOf(prop) < 0)
      target[prop] = source[prop];
  if (source != null && __getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(source)) {
      if (exclude.indexOf(prop) < 0 && __propIsEnum.call(source, prop))
        target[prop] = source[prop];
    }
  return target;
}, "__objRest");
var __async2 = /* @__PURE__ */ __name((__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = /* @__PURE__ */ __name((value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    }, "fulfilled");
    var rejected = /* @__PURE__ */ __name((value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    }, "rejected");
    var step = /* @__PURE__ */ __name((x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected), "step");
    step((generator = generator.apply(__this, __arguments)).next());
  });
}, "__async");
var decodeJwt = /* @__PURE__ */ __name((jwt) => {
  const { 0: header, 1: payload, 2: signature, length } = jwt.split(".");
  if (length !== 3) {
    throw new SDJWTException("Invalid JWT as input");
  }
  return {
    header: JSON.parse(base64urlDecode(header)),
    payload: JSON.parse(base64urlDecode(payload)),
    signature
  };
}, "decodeJwt");
var decodeSdJwt = /* @__PURE__ */ __name((sdjwt, hasher) => __async2(null, null, function* () {
  const [encodedJwt, ...encodedDisclosures] = sdjwt.split(SD_SEPARATOR);
  const jwt = decodeJwt(encodedJwt);
  if (encodedDisclosures.length === 0) {
    return {
      jwt,
      disclosures: []
    };
  }
  const encodedKeyBindingJwt = encodedDisclosures.pop();
  const kbJwt = encodedKeyBindingJwt ? decodeJwt(encodedKeyBindingJwt) : void 0;
  const { _sd_alg } = getSDAlgAndPayload(jwt.payload);
  const disclosures = yield Promise.all(
    encodedDisclosures.map(
      (ed) => Disclosure.fromEncode(ed, { alg: _sd_alg, hasher })
    )
  );
  return {
    jwt,
    disclosures,
    kbJwt
  };
}), "decodeSdJwt");
var getClaims = /* @__PURE__ */ __name((rawPayload, disclosures, hasher) => __async2(null, null, function* () {
  const { unpackedObj } = yield unpack(rawPayload, disclosures, hasher);
  return unpackedObj;
}), "getClaims");
var unpackArray = /* @__PURE__ */ __name((arr, map, prefix = "") => {
  const keys = {};
  const unpackedArray = [];
  arr.forEach((item, idx) => {
    if (typeof item === "object" && item !== null) {
      const hash = item[SD_LIST_KEY];
      if (hash) {
        const disclosed = map[hash];
        if (disclosed) {
          const presentKey = prefix ? `${prefix}.${idx}` : `${idx}`;
          keys[presentKey] = hash;
          const { unpackedObj, disclosureKeymap: disclosureKeys } = unpackObjInternal(disclosed.value, map, presentKey);
          unpackedArray.push(unpackedObj);
          Object.assign(keys, disclosureKeys);
        }
      } else {
        const newKey = prefix ? `${prefix}.${idx}` : `${idx}`;
        const { unpackedObj, disclosureKeymap: disclosureKeys } = unpackObjInternal(item, map, newKey);
        unpackedArray.push(unpackedObj);
        Object.assign(keys, disclosureKeys);
      }
    } else {
      unpackedArray.push(item);
    }
  });
  return { unpackedObj: unpackedArray, disclosureKeymap: keys };
}, "unpackArray");
var unpackObj = /* @__PURE__ */ __name((obj, map) => {
  const copiedObj = JSON.parse(JSON.stringify(obj));
  return unpackObjInternal(copiedObj, map);
}, "unpackObj");
var unpackObjInternal = /* @__PURE__ */ __name((obj, map, prefix = "") => {
  const keys = {};
  if (typeof obj === "object" && obj !== null) {
    if (Array.isArray(obj)) {
      return unpackArray(obj, map, prefix);
    }
    for (const key in obj) {
      if (key !== SD_DIGEST && key !== SD_LIST_KEY && typeof obj[key] === "object") {
        const newKey = prefix ? `${prefix}.${key}` : key;
        const { unpackedObj: unpackedObj2, disclosureKeymap: disclosureKeys } = unpackObjInternal(obj[key], map, newKey);
        obj[key] = unpackedObj2;
        Object.assign(keys, disclosureKeys);
      }
    }
    const _a3 = obj, { _sd } = _a3, payload = __objRest(_a3, ["_sd"]);
    const claims = {};
    if (_sd) {
      for (const hash of _sd) {
        const disclosed = map[hash];
        if (disclosed == null ? void 0 : disclosed.key) {
          const presentKey = prefix ? `${prefix}.${disclosed.key}` : disclosed.key;
          keys[presentKey] = hash;
          const { unpackedObj: unpackedObj2, disclosureKeymap: disclosureKeys } = unpackObjInternal(disclosed.value, map, presentKey);
          claims[disclosed.key] = unpackedObj2;
          Object.assign(keys, disclosureKeys);
        }
      }
    }
    const unpackedObj = Object.assign(payload, claims);
    return { unpackedObj, disclosureKeymap: keys };
  }
  return { unpackedObj: obj, disclosureKeymap: keys };
}, "unpackObjInternal");
var createHashMapping = /* @__PURE__ */ __name((disclosures, hash) => __async2(null, null, function* () {
  const map = {};
  for (let i = 0; i < disclosures.length; i++) {
    const disclosure = disclosures[i];
    const digest = yield disclosure.digest(hash);
    map[digest] = disclosure;
  }
  return map;
}), "createHashMapping");
var getSDAlgAndPayload = /* @__PURE__ */ __name((SdJwtPayload) => {
  const _a3 = SdJwtPayload, { _sd_alg } = _a3, payload = __objRest(_a3, ["_sd_alg"]);
  if (typeof _sd_alg !== "string") {
    return { _sd_alg: "sha-256", payload };
  }
  return { _sd_alg, payload };
}, "getSDAlgAndPayload");
var unpack = /* @__PURE__ */ __name((SdJwtPayload, disclosures, hasher) => __async2(null, null, function* () {
  const { _sd_alg, payload } = getSDAlgAndPayload(SdJwtPayload);
  const hash = { hasher, alg: _sd_alg };
  const map = yield createHashMapping(disclosures, hash);
  return unpackObj(payload, map);
}), "unpack");

// src/types.ts
var SD_JWT_VC_FORMAT = "dc+sd-jwt";
var SD_JWT_VC_FORMAT_LEGACY = "vc+sd-jwt";
var isSdJwtVcFormat = /* @__PURE__ */ __name((value) => value === SD_JWT_VC_FORMAT || value === SD_JWT_VC_FORMAT_LEGACY, "isSdJwtVcFormat");
var isSdJwtCompact = /* @__PURE__ */ __name((value) => typeof value === "string" && value.includes("~") && value.split(".").length >= 3, "isSdJwtCompact");
var _SdJwtVcError = class _SdJwtVcError extends Error {
  constructor(code, message, options = {}) {
    super(message);
    this.name = "SdJwtVcError";
    this.code = code;
    this.cause = options.cause;
  }
};
__name(_SdJwtVcError, "SdJwtVcError");
var SdJwtVcError = _SdJwtVcError;

// src/hasher.ts
var SUPPORTED_ALGS = /* @__PURE__ */ new Set(["sha-256", "SHA-256", "sha256"]);
var sha256Hasher = /* @__PURE__ */ __name(async (data, alg) => {
  if (!SUPPORTED_ALGS.has(alg)) {
    throw new SdJwtVcError(
      "unsupported_alg",
      `Unsupported hash algorithm: "${alg}". Only sha-256 is supported.`
    );
  }
  const bytes = typeof data === "string" ? new TextEncoder().encode(data) : new Uint8Array(data);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(digest);
}, "sha256Hasher");
var isSupportedHashAlg = /* @__PURE__ */ __name((alg) => SUPPORTED_ALGS.has(alg), "isSupportedHashAlg");

// src/parse.ts
var epochToDate = /* @__PURE__ */ __name((seconds) => {
  if (typeof seconds !== "number" || !Number.isFinite(seconds)) return void 0;
  return new Date(seconds * 1e3);
}, "epochToDate");
var parseSdJwtVc = /* @__PURE__ */ __name(async (compact, format = SD_JWT_VC_FORMAT) => {
  if (!isSdJwtCompact(compact)) {
    throw new SdJwtVcError(
      "invalid_compact_form",
      "Input is not a valid SD-JWT compact serialization (expected `<JWT>~<Disclosure>~...`)"
    );
  }
  let decoded;
  try {
    decoded = await decodeSdJwt(compact, sha256Hasher);
  } catch (e) {
    throw new SdJwtVcError(
      "invalid_compact_form",
      `Failed to decode SD-JWT: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  }
  const header = decoded.jwt?.header ?? {};
  const payload = decoded.jwt?.payload ?? {};
  if (typeof header.alg !== "string" || header.alg.length === 0) {
    throw new SdJwtVcError("missing_alg", "SD-JWT header missing `alg`");
  }
  if (typeof payload.iss !== "string" || payload.iss.length === 0) {
    throw new SdJwtVcError("missing_iss", "SD-JWT payload missing `iss`");
  }
  if (typeof payload.vct !== "string" || payload.vct.length === 0) {
    throw new SdJwtVcError("missing_vct", "SD-JWT payload missing `vct`");
  }
  let claims;
  try {
    claims = await getClaims(
      payload,
      decoded.disclosures,
      sha256Hasher
    );
  } catch (e) {
    throw new SdJwtVcError(
      "disclosure_hash_mismatch",
      `Failed to reconstruct claims from disclosures: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  }
  const disclosureKeys = [];
  for (const d of decoded.disclosures ?? []) {
    const key = d.key;
    if (typeof key === "string") disclosureKeys.push(key);
  }
  const cnf = payload.cnf;
  const holderPublicKey = cnf && typeof cnf === "object" && "jwk" in cnf && cnf.jwk && typeof cnf.jwk === "object" ? cnf.jwk : void 0;
  return {
    vct: payload.vct,
    issuer: payload.iss,
    issuedAt: epochToDate(payload.iat),
    expiresAt: epochToDate(payload.exp),
    notBefore: epochToDate(payload.nbf),
    holderPublicKey,
    claims,
    disclosureKeys,
    header,
    rawPayload: payload,
    rawSdJwt: compact,
    format: format === SD_JWT_VC_FORMAT_LEGACY ? SD_JWT_VC_FORMAT_LEGACY : SD_JWT_VC_FORMAT,
    hasKeyBinding: Boolean(decoded.kbJwt)
  };
}, "parseSdJwtVc");

// src/verify.ts
var import_sd_jwt_vc = require("@sd-jwt/sd-jwt-vc");

// src/salt.ts
var SD_JWT_SALT_LENGTH_BYTES = 16;
var bytesToBase64Url = /* @__PURE__ */ __name((bytes) => {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}, "bytesToBase64Url");
var randomSalt = /* @__PURE__ */ __name((length = SD_JWT_SALT_LENGTH_BYTES) => {
  if (!Number.isInteger(length) || length < SD_JWT_SALT_LENGTH_BYTES) {
    length = SD_JWT_SALT_LENGTH_BYTES;
  }
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytesToBase64Url(bytes);
}, "randomSalt");

// src/signer.ts
var import_jose = require("jose");
var createJoseVerifier = /* @__PURE__ */ __name(async (publicJwk, alg) => {
  let key;
  try {
    key = await (0, import_jose.importJWK)(publicJwk, alg);
  } catch (e) {
    throw new SdJwtVcError(
      "verification_method_not_found",
      `Failed to import issuer JWK for alg ${alg}: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  }
  return async (data, sig) => {
    const compact = `${data}.${sig}`;
    try {
      await (0, import_jose.compactVerify)(compact, key);
      return true;
    } catch {
      return false;
    }
  };
}, "createJoseVerifier");
var decodeJoseHeader = /* @__PURE__ */ __name((jwt) => {
  const parts = jwt.split(".");
  if (parts.length < 2) {
    throw new SdJwtVcError("invalid_jwt", "JWT must have at least 2 segments");
  }
  const headerSegment = parts[0];
  try {
    const padded = headerSegment + "=".repeat((4 - headerSegment.length % 4) % 4);
    const normalized = padded.replace(/-/g, "+").replace(/_/g, "/");
    const json = atob(normalized);
    return JSON.parse(json);
  } catch (e) {
    throw new SdJwtVcError(
      "invalid_jwt",
      `Failed to decode JWT header: ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  }
}, "decodeJoseHeader");

// src/verify.ts
var extractFragment = /* @__PURE__ */ __name((kid) => {
  const idx = kid.lastIndexOf("#");
  if (idx === -1) return kid.length > 0 ? kid : void 0;
  const frag = kid.slice(idx + 1);
  return frag.length > 0 ? frag : void 0;
}, "extractFragment");
var findVerificationMethod = /* @__PURE__ */ __name((doc, kid, issuerDid) => {
  const methods = doc?.verificationMethod ?? [];
  if (methods.length === 0) {
    throw new SdJwtVcError(
      "verification_method_not_found",
      `Issuer DID "${issuerDid}" resolved but document has no verificationMethod entries`
    );
  }
  if (!kid) {
    const first = methods[0];
    if (!first.publicKeyJwk) {
      throw new SdJwtVcError(
        "verification_method_not_found",
        `First verificationMethod for issuer "${issuerDid}" has no publicKeyJwk`
      );
    }
    return first;
  }
  const matchFragment = extractFragment(kid);
  for (const method of methods) {
    if (!method.id) continue;
    if (method.id === kid) return method;
    if (method.id === `${issuerDid}${kid}`) return method;
    const methodFragment = extractFragment(method.id);
    if (matchFragment && methodFragment && methodFragment === matchFragment) return method;
  }
  throw new SdJwtVcError(
    "verification_method_not_found",
    `Issuer DID "${issuerDid}" document has no verificationMethod matching kid "${kid}"`
  );
}, "findVerificationMethod");
var resolveIssuerJwk = /* @__PURE__ */ __name(async (learnCard, issuerDid, kid) => {
  if (!issuerDid.startsWith("did:")) {
    throw new SdJwtVcError(
      "issuer_resolution_failed",
      `Only DID-based issuers are supported in this build (got "${issuerDid}"). HTTPS-URL issuer identifiers are tracked as a follow-up.`
    );
  }
  let doc;
  try {
    doc = await learnCard.invoke.resolveDid(issuerDid);
  } catch (e) {
    throw new SdJwtVcError(
      "issuer_resolution_failed",
      `Failed to resolve issuer DID "${issuerDid}": ${e instanceof Error ? e.message : String(e)}`,
      { cause: e }
    );
  }
  const method = findVerificationMethod(doc, kid, issuerDid);
  if (!method.publicKeyJwk) {
    throw new SdJwtVcError(
      "verification_method_not_found",
      `Verification method for "${issuerDid}" / kid "${kid ?? "(none)"}" has no publicKeyJwk`
    );
  }
  const jwk = method.publicKeyJwk;
  const alg = jwk.alg ?? "EdDSA";
  return { jwk, alg };
}, "resolveIssuerJwk");
var ensureNotExpired = /* @__PURE__ */ __name((expiresAt, now, errors) => {
  if (expiresAt && expiresAt.getTime() <= now.getTime()) {
    errors.push(`Credential expired at ${expiresAt.toISOString()}`);
  }
}, "ensureNotExpired");
var ensureNotBefore = /* @__PURE__ */ __name((notBefore, now, warnings, errors) => {
  if (notBefore && notBefore.getTime() > now.getTime()) {
    const skewMs = notBefore.getTime() - now.getTime();
    if (skewMs > 6e4) {
      errors.push(`Credential not valid until ${notBefore.toISOString()}`);
    } else {
      warnings.push(
        `Credential nbf is in the future by ${skewMs}ms (within clock-skew tolerance)`
      );
    }
  }
}, "ensureNotBefore");
var verifySdJwtVc = /* @__PURE__ */ __name(async (learnCard, compact, options = {}, format = "dc+sd-jwt") => {
  const checks = [];
  const warnings = [];
  const errors = [];
  let parsed;
  try {
    parsed = await parseSdJwtVc(compact, format);
    checks.push("parse");
    checks.push("disclosure_hash_integrity");
  } catch (e) {
    const message = e instanceof SdJwtVcError ? `${e.code}: ${e.message}` : e.message;
    return { checks, warnings, errors: [...errors, message] };
  }
  let issuerJwk;
  let issuerAlg;
  try {
    const decodedHeader = decodeJoseHeader(compact.split("~")[0]);
    const kid = typeof decodedHeader.kid === "string" ? decodedHeader.kid : void 0;
    const resolved = await resolveIssuerJwk(learnCard, parsed.issuer, kid);
    issuerJwk = resolved.jwk;
    issuerAlg = resolved.alg;
    checks.push("issuer_resolved");
  } catch (e) {
    const message = e instanceof SdJwtVcError ? `${e.code}: ${e.message}` : e.message;
    return { checks, warnings, errors: [...errors, message] };
  }
  const verifier = await createJoseVerifier(issuerJwk, issuerAlg);
  const instance = new import_sd_jwt_vc.SDJwtVcInstance({
    hasher: sha256Hasher,
    hashAlg: "sha-256",
    saltGenerator: randomSalt,
    verifier
  });
  try {
    await instance.verify(compact);
    checks.push("issuer_signature");
  } catch (e) {
    errors.push(
      `signature_invalid: ${e instanceof Error ? e.message : String(e)}`
    );
    return { checks, warnings, errors };
  }
  const now = options.now ? options.now() : /* @__PURE__ */ new Date();
  ensureNotExpired(parsed.expiresAt, now, errors);
  if (errors.length === 0) checks.push("expiration");
  ensureNotBefore(parsed.notBefore, now, warnings, errors);
  if (options.expectedVct && parsed.vct !== options.expectedVct) {
    errors.push(`vct_mismatch: expected "${options.expectedVct}", got "${parsed.vct}"`);
  }
  if (options.audience || options.nonce) {
    warnings.push("audience/nonce checks require a KB-JWT (Slice 3); skipped in read path");
  }
  if (!options.skipStatusCheck && parsed.rawPayload.status !== void 0) {
    warnings.push("status_check_deferred: Token Status List checking lands in Slice 4");
  }
  return { checks, warnings, errors };
}, "verifySdJwtVc");

// src/plugin.ts
var getSdJwtVcPlugin = /* @__PURE__ */ __name((learnCard) => ({
  name: "SDJwtVc",
  displayName: "SD-JWT-VC",
  description: "SD-JWT-VC holder + verifier support (RFC 9901 + draft-ietf-oauth-sd-jwt-vc). Selective-disclosure JWT credentials with DID-resolvable issuer verification.",
  methods: {
    parseSdJwtVc: /* @__PURE__ */ __name(async (_lc, compact) => parseSdJwtVc(compact, SD_JWT_VC_FORMAT), "parseSdJwtVc"),
    verifySdJwtVc: /* @__PURE__ */ __name(async (_lc, compact, options = {}) => verifySdJwtVc(learnCard, compact, options, SD_JWT_VC_FORMAT), "verifySdJwtVc"),
    decodeSdJwtClaims: /* @__PURE__ */ __name(async (_lc, compact) => {
      const parsed = await parseSdJwtVc(compact, SD_JWT_VC_FORMAT);
      return parsed.claims;
    }, "decodeSdJwtClaims")
  }
}), "getSdJwtVcPlugin");

// src/instance.ts
var import_sd_jwt_vc2 = require("@sd-jwt/sd-jwt-vc");
var createSdJwtVcInstance = /* @__PURE__ */ __name((options = {}) => {
  return new import_sd_jwt_vc2.SDJwtVcInstance({
    hasher: sha256Hasher,
    hashAlg: "sha-256",
    saltGenerator: randomSalt,
    verifier: options.verifier
  });
}, "createSdJwtVcInstance");
//# sourceMappingURL=sd-jwt-vc-plugin.cjs.development.js.map
