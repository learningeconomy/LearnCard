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
  StatusCheckError: () => StatusCheckError,
  checkCredentialStatus: () => checkCredentialStatus,
  getStatusListPlugin: () => getStatusListPlugin
});
module.exports = __toCommonJS(index_exports);

// ../../../node_modules/.pnpm/fflate@0.8.2/node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = /* @__PURE__ */ __name(function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
}, "freb");
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = /* @__PURE__ */ __name((function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
}), "hMap");
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = /* @__PURE__ */ __name(function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
}, "max");
var bits = /* @__PURE__ */ __name(function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
}, "bits");
var bits16 = /* @__PURE__ */ __name(function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
}, "bits16");
var shft = /* @__PURE__ */ __name(function(p) {
  return (p + 7) / 8 | 0;
}, "shft");
var slc = /* @__PURE__ */ __name(function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
}, "slc");
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = /* @__PURE__ */ __name(function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
}, "err");
var inflt = /* @__PURE__ */ __name(function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = /* @__PURE__ */ __name(function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  }, "cbuf");
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
}, "inflt");
var et = /* @__PURE__ */ new u8(0);
var gzs = /* @__PURE__ */ __name(function(d) {
  if (d[0] != 31 || d[1] != 139 || d[2] != 8)
    err(6, "invalid gzip data");
  var flg = d[3];
  var st = 10;
  if (flg & 4)
    st += (d[10] | d[11] << 8) + 2;
  for (var zs = (flg >> 3 & 1) + (flg >> 4 & 1); zs > 0; zs -= !d[st++])
    ;
  return st + (flg & 2);
}, "gzs");
var gzl = /* @__PURE__ */ __name(function(d) {
  var l = d.length;
  return (d[l - 4] | d[l - 3] << 8 | d[l - 2] << 16 | d[l - 1] << 24) >>> 0;
}, "gzl");
function gunzipSync(data, opts) {
  var st = gzs(data);
  if (st + 8 > data.length)
    err(6, "invalid gzip data");
  return inflt(data.subarray(st, -8), { i: 2 }, opts && opts.out || new u8(gzl(data)), opts && opts.dictionary);
}
__name(gunzipSync, "gunzipSync");
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}

// src/status.ts
var _StatusCheckError = class _StatusCheckError extends Error {
  constructor(code, message, extra = {}) {
    super(message);
    this.name = "StatusCheckError";
    this.code = code;
    if (extra.listUrl) this.listUrl = extra.listUrl;
    if (extra.cause !== void 0) {
      this.cause = extra.cause;
    }
  }
};
__name(_StatusCheckError, "StatusCheckError");
var StatusCheckError = _StatusCheckError;
var KNOWN_ENTRY_TYPES = [
  "BitstringStatusListEntry",
  "StatusList2021Entry"
];
var checkCredentialStatus = /* @__PURE__ */ __name(async (credential, options = {}) => {
  const entries = normalizeStatusEntries(credential.credentialStatus);
  if (entries.length === 0) {
    return { outcome: "no_status" };
  }
  let firstUnsupported;
  let lastActive;
  for (const entry of entries) {
    if (!KNOWN_ENTRY_TYPES.includes(entry.type)) {
      const unsupported = {
        outcome: "unsupported_status_type",
        detail: `Unknown credentialStatus type: ${entry.type}`
      };
      if (options.strictType !== false) {
        return unsupported;
      }
      firstUnsupported ?? (firstUnsupported = unsupported);
      continue;
    }
    const result = await evaluateBitstringEntry(entry, options);
    if (result.outcome === "revoked" || result.outcome === "suspended" || result.outcome === "unsupported_status_type") {
      return result;
    }
    if (result.outcome === "active") {
      lastActive = result;
    }
  }
  return lastActive ?? firstUnsupported ?? { outcome: "active" };
}, "checkCredentialStatus");
var normalizeStatusEntries = /* @__PURE__ */ __name((raw) => {
  if (raw === void 0 || raw === null) return [];
  if (Array.isArray(raw)) {
    return raw.filter(
      (e) => typeof e === "object" && e !== null && typeof e.type === "string"
    );
  }
  if (typeof raw === "object" && typeof raw.type === "string") {
    return [raw];
  }
  return [];
}, "normalizeStatusEntries");
var evaluateBitstringEntry = /* @__PURE__ */ __name(async (entry, options) => {
  const listUrl = entry.statusListCredential;
  if (typeof listUrl !== "string" || listUrl.length === 0) {
    throw new StatusCheckError(
      "invalid_status_entry",
      `credentialStatus.statusListCredential must be a non-empty string (entry id=${String(entry.id)})`
    );
  }
  const indexRaw = entry.statusListIndex;
  const index = typeof indexRaw === "number" ? indexRaw : typeof indexRaw === "string" && /^\d+$/.test(indexRaw) ? Number.parseInt(indexRaw, 10) : NaN;
  if (!Number.isFinite(index) || index < 0) {
    throw new StatusCheckError(
      "invalid_status_entry",
      `credentialStatus.statusListIndex must be a non-negative integer (received ${String(indexRaw)})`,
      { listUrl }
    );
  }
  if (typeof entry.statusSize === "number" && entry.statusSize !== 1) {
    return {
      outcome: "unsupported_status_type",
      listUrl,
      listIndex: index,
      purpose: entry.statusPurpose,
      detail: `statusSize=${entry.statusSize} (multi-bit) is not supported; only single-bit revocation/suspension purposes are decoded`
    };
  }
  const listCredential = await loadStatusList(listUrl, options);
  const subject = pickStatusSubject(listCredential);
  const encoded = subject?.encodedList;
  if (typeof encoded !== "string" || encoded.length === 0) {
    throw new StatusCheckError(
      "invalid_status_list",
      `Status list credential at ${listUrl} has no credentialSubject.encodedList`,
      { listUrl }
    );
  }
  const bits2 = decodeEncodedList(encoded, listUrl);
  const isSet = readBit(bits2, index, listUrl);
  if (!isSet) {
    return {
      outcome: "active",
      listUrl,
      listIndex: index,
      purpose: entry.statusPurpose
    };
  }
  const purpose = subject?.statusPurpose ?? entry.statusPurpose ?? "revocation";
  if (purpose === "suspension") {
    return {
      outcome: "suspended",
      listUrl,
      listIndex: index,
      purpose
    };
  }
  return {
    outcome: "revoked",
    listUrl,
    listIndex: index,
    purpose
  };
}, "evaluateBitstringEntry");
var pickStatusSubject = /* @__PURE__ */ __name((credential) => {
  const cs = credential.credentialSubject;
  if (Array.isArray(cs)) return cs[0];
  if (cs && typeof cs === "object") return cs;
  return void 0;
}, "pickStatusSubject");
var loadStatusList = /* @__PURE__ */ __name(async (url, options) => {
  if (options.fetchStatusList) {
    try {
      return await options.fetchStatusList(url);
    } catch (e) {
      throw new StatusCheckError(
        "list_fetch_failed",
        `fetchStatusList lookup failed for ${url}: ${describe(e)}`,
        { listUrl: url, cause: e }
      );
    }
  }
  const fx = options.fetchImpl ?? globalThis.fetch;
  if (typeof fx !== "function") {
    throw new StatusCheckError(
      "no_fetch",
      `No fetch implementation available; pass \`fetchImpl\` or \`fetchStatusList\` to check status against ${url}`,
      { listUrl: url }
    );
  }
  let response;
  try {
    response = await fx(url, {
      headers: { Accept: "application/json, application/ld+json, application/jwt" }
    });
  } catch (e) {
    throw new StatusCheckError(
      "list_fetch_failed",
      `Failed to fetch status list at ${url}: ${describe(e)}`,
      { listUrl: url, cause: e }
    );
  }
  if (!response.ok) {
    throw new StatusCheckError(
      "list_fetch_failed",
      `Status list fetch returned HTTP ${response.status} for ${url}`,
      { listUrl: url }
    );
  }
  let body;
  try {
    body = await response.json();
  } catch (e) {
    throw new StatusCheckError(
      "invalid_status_list",
      `Status list at ${url} is not JSON (JWT-encoded lists require a custom fetchStatusList): ${describe(e)}`,
      { listUrl: url, cause: e }
    );
  }
  if (!body || typeof body !== "object") {
    throw new StatusCheckError(
      "invalid_status_list",
      `Status list at ${url} did not parse to an object`,
      { listUrl: url }
    );
  }
  return body;
}, "loadStatusList");
var decodeEncodedList = /* @__PURE__ */ __name((encoded, listUrl) => {
  let raw;
  try {
    const stripped = encoded.startsWith("u") ? encoded.slice(1) : encoded;
    const std = stripped.replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - std.length % 4) % 4);
    raw = Uint8Array.from(Buffer.from(std + pad, "base64"));
  } catch (e) {
    throw new StatusCheckError(
      "invalid_status_list",
      `encodedList at ${listUrl} is not valid base64url: ${describe(e)}`,
      { listUrl, cause: e }
    );
  }
  try {
    return gunzipSync(raw);
  } catch (e) {
    throw new StatusCheckError(
      "invalid_status_list",
      `encodedList at ${listUrl} did not GZIP-decompress (per W3C VC Bitstring Status List \xA74.1): ${describe(e)}`,
      { listUrl, cause: e }
    );
  }
}, "decodeEncodedList");
var readBit = /* @__PURE__ */ __name((bytes, index, listUrl) => {
  const byteIndex = index >> 3;
  if (byteIndex >= bytes.length) {
    throw new StatusCheckError(
      "index_out_of_range",
      `statusListIndex=${index} exceeds bitstring length (${bytes.length * 8} bits) at ${listUrl}`,
      { listUrl }
    );
  }
  const bitInByte = 7 - (index & 7);
  const mask = 1 << bitInByte;
  return (bytes[byteIndex] & mask) !== 0;
}, "readBit");
var describe = /* @__PURE__ */ __name((e) => e instanceof Error ? e.message : String(e), "describe");

// src/plugin.ts
var getStatusListPlugin = /* @__PURE__ */ __name((_learnCard, config = {}) => {
  const fetchImpl = config.fetch ?? globalThis.fetch;
  return {
    name: "StatusList",
    displayName: "Bitstring Status List",
    description: "Verifier-side W3C VC Bitstring Status List checking \u2014 revocation and suspension lookups against the credential issuer's published Status List Credential.",
    methods: {
      checkCredentialStatus: /* @__PURE__ */ __name(async (_lc, credential, options = {}) => checkCredentialStatus(credential, {
        // The plugin's configured fetch is the default;
        // per-call options can still override it (or skip
        // fetch entirely via `fetchStatusList`).
        fetchImpl,
        ...options
      }), "checkCredentialStatus")
    }
  };
}, "getStatusListPlugin");
//# sourceMappingURL=status-list-plugin.cjs.development.js.map
