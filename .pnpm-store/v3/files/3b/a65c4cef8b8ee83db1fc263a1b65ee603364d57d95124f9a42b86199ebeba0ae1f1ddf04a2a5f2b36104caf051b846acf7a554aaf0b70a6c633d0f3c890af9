"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enableNormalLog = exports.enableVerbose = exports.errorLog = exports.warnLog = exports.normalLog = exports.verboseLog = void 0;
function verboseLog(message) {
    logMessage(message, 0 /* LogLevel.Verbose */);
}
exports.verboseLog = verboseLog;
function normalLog(message) {
    logMessage(message, 1 /* LogLevel.Normal */);
}
exports.normalLog = normalLog;
function warnLog(message) {
    logMessage(message, 2 /* LogLevel.Warning */);
}
exports.warnLog = warnLog;
function errorLog(message) {
    logMessage(message, 3 /* LogLevel.Error */);
}
exports.errorLog = errorLog;
var currentLogLevel = 3 /* LogLevel.Error */;
function enableVerbose() {
    currentLogLevel = 0 /* LogLevel.Verbose */;
    normalLog('Verbose log enabled');
}
exports.enableVerbose = enableVerbose;
function enableNormalLog() {
    currentLogLevel = 1 /* LogLevel.Normal */;
}
exports.enableNormalLog = enableNormalLog;
function logMessage(message, level) {
    if (level === void 0) { level = 0 /* LogLevel.Verbose */; }
    if (level < currentLogLevel) {
        return;
    }
    switch (level) {
        case 3 /* LogLevel.Error */:
            // print red
            // eslint-disable-next-line no-console
            console.error("\u001B[0;31m".concat(message, "\u001B[0m"));
            break;
        case 2 /* LogLevel.Warning */:
            // eslint-disable-next-line no-console
            console.warn("\u001B[1;33m".concat(message, "\u001B[0m"));
            break;
        case 1 /* LogLevel.Normal */:
        case 0 /* LogLevel.Verbose */:
            // eslint-disable-next-line no-console
            console.log(message);
    }
}
