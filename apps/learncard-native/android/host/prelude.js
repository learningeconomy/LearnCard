globalThis.window = globalThis;
globalThis.self = globalThis;
if (typeof Object.hasOwn !== "function") {
    Object.hasOwn = function (object, property) {
        return Object.prototype.hasOwnProperty.call(object, property);
    };
}
globalThis.navigator = { userAgent: "LearnCard Android account host" };
globalThis.location = { href: "file:///native-fixture/account-index.html" };
globalThis.console = {
    debug: function () {},
    log: function () {},
    info: function () {},
    warn: function () {},
    error: function () {},
};
if (typeof performance === "undefined") globalThis.performance = { now: function () { return 0; } };
if (typeof queueMicrotask === "undefined") {
    globalThis.queueMicrotask = function (fn) { Promise.resolve().then(fn); };
}
function lcPost(input) {
    var raw = globalThis.__lcNative(JSON.stringify(input));
    var parsed = JSON.parse(raw);
    if (parsed.error) return Promise.reject(new Error(parsed.error));
    return Promise.resolve(parsed.value === undefined ? null : parsed.value);
}
globalThis.webkit = {
    messageHandlers: {
        accountNative: { postMessage: lcPost },
        accountTransport: {
            postMessage: function (input) {
                return lcPost({ op: "transport", value: JSON.stringify(input) });
            },
        },
    },
};
if (typeof TextEncoder === "undefined") {
    globalThis.TextEncoder = function TextEncoder() {};
    globalThis.TextEncoder.prototype.encode = function (value) {
        var bytes = [];
        var text = String(value);
        for (var index = 0; index < text.length; index++) {
            var code = text.charCodeAt(index);
            if (code < 128) bytes.push(code);
            else if (code < 2048) {
                bytes.push(192 | (code >> 6));
                bytes.push(128 | (code & 63));
            } else {
                bytes.push(224 | (code >> 12));
                bytes.push(128 | ((code >> 6) & 63));
                bytes.push(128 | (code & 63));
            }
        }
        return new Uint8Array(bytes);
    };
}
if (typeof TextDecoder === "undefined") {
    globalThis.TextDecoder = function TextDecoder() {};
    globalThis.TextDecoder.prototype.decode = function (bytes) {
        if (!bytes) return "";
        var text = "";
        var length = bytes.length || 0;
        for (var index = 0; index < length; index++) text += String.fromCharCode(bytes[index]);
        return text;
    };
}
if (typeof atob === "undefined") {
    globalThis.atob = function (value) { return value; };
    globalThis.btoa = function (value) { return value; };
}
if (typeof crypto === "undefined") {
    globalThis.crypto = {
        getRandomValues: function (buffer) {
            for (var index = 0; index < buffer.length; index++) buffer[index] = Math.floor(Math.random() * 256);
            return buffer;
        },
        subtle: {},
    };
}
if (typeof URL === "undefined") {
    globalThis.URL = function URL(value) {
        this.href = String(value);
        var match = String(value).match(/^(https?:)\/\/([^/]+)/);
        this.protocol = match ? match[1] + ":" : "";
        this.host = match ? match[2] : "";
        this.origin = match ? match[1] + "://" + match[2] : "";
        this.username = "";
        this.password = "";
    };
}
if (typeof Request === "undefined") {
    globalThis.Request = function Request(input, options) {
        options = options || {};
        this.url = typeof input === "string" ? input : input.url;
        this.method = options.method || "GET";
        this.headers = { entries: function () { return []; } };
        this.text = function () { return Promise.resolve(options.body || ""); };
    };
}
if (typeof Response === "undefined") {
    globalThis.Response = function Response(body, init) {
        this.status = (init && init.status) || 200;
        this.headers = (init && init.headers) || {};
        this.text = function () { return Promise.resolve(String(body)); };
    };
}
if (typeof Headers === "undefined") globalThis.Headers = function Headers() {};
if (typeof URLSearchParams === "undefined") globalThis.URLSearchParams = function URLSearchParams() {};
if (typeof setTimeout === "undefined") {
    globalThis.setTimeout = function () { return 0; };
    globalThis.clearTimeout = function () {};
}
