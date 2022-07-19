"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JetLogger = exports.Formats = exports.LoggerModes = void 0;
var util_1 = __importDefault(require("util"));
var colors_1 = __importDefault(require("colors"));
var fs_1 = __importDefault(require("fs"));
var LoggerModes;
(function (LoggerModes) {
    LoggerModes["Console"] = "CONSOLE";
    LoggerModes["File"] = "FILE";
    LoggerModes["Custom"] = "CUSTOM";
    LoggerModes["Off"] = "OFF";
})(LoggerModes = exports.LoggerModes || (exports.LoggerModes = {}));
var Formats;
(function (Formats) {
    Formats["Line"] = "LINE";
    Formats["Json"] = "JSON";
})(Formats = exports.Formats || (exports.Formats = {}));
var levels = {
    info: {
        color: 'green',
        prefix: 'INFO',
    },
    imp: {
        color: 'magenta',
        prefix: 'IMPORTANT',
    },
    warn: {
        color: 'yellow',
        prefix: 'WARNING',
    },
    err: {
        color: 'red',
        prefix: 'ERROR',
    }
};
var errors = {
    customLoggerErr: 'Custom logger mode set to true, but no custom logger was provided.',
    modeErr: 'The correct logger mode was not specified: Must be "CUSTOM", "FILE", ' +
        '"OFF", or "CONSOLE".'
};
var defaults = {
    fileName: 'jet-logger.log',
    mode: LoggerModes.Console,
    timestamp: true,
    format: Formats.Line,
};
function JetLogger(mode, filePath, timestamp, format, customLogger) {
    return {
        settings: getSettings(mode, filePath, timestamp, format, customLogger),
        info: info,
        imp: imp,
        warn: warn,
        err: err,
    };
}
exports.JetLogger = JetLogger;
function getSettings(mode, filePath, timestamp, format, customLogger) {
    if (!mode) {
        if (!!process.env.JET_LOGGER_MODE) {
            mode = process.env.JET_LOGGER_MODE.toUpperCase();
        }
        else {
            mode = defaults.mode;
        }
    }
    if (!filePath) {
        if (!!process.env.JET_LOGGER_FILEPATH) {
            filePath = process.env.JET_LOGGER_FILEPATH;
        }
        else {
            filePath = defaults.fileName;
        }
    }
    if (!timestamp) {
        if (!!process.env.JET_LOGGER_TIMESTAMP) {
            timestamp = (process.env.JET_LOGGER_TIMESTAMP.toUpperCase() === 'TRUE');
        }
        else {
            timestamp = defaults.timestamp;
        }
    }
    if (!format) {
        if (!!process.env.JET_LOGGER_FORMAT) {
            format = process.env.JET_LOGGER_FORMAT.toUpperCase();
        }
        else {
            format = defaults.format;
        }
    }
    return {
        mode: mode,
        filePath: filePath,
        timestamp: timestamp,
        format: format,
        customLogger: customLogger,
    };
}
function info(content, printFull) {
    return printLog(content, printFull !== null && printFull !== void 0 ? printFull : false, levels.info, this.settings);
}
function imp(content, printFull) {
    return printLog(content, printFull !== null && printFull !== void 0 ? printFull : false, levels.imp, this.settings);
}
function warn(content, printFull) {
    return printLog(content, printFull !== null && printFull !== void 0 ? printFull : false, levels.warn, this.settings);
}
function err(content, printFull) {
    return printLog(content, printFull !== null && printFull !== void 0 ? printFull : false, levels.err, this.settings);
}
function printLog(content, printFull, level, settings) {
    var mode = settings.mode, format = settings.format, timestamp = settings.timestamp, filePath = settings.filePath, customLogger = settings.customLogger;
    if (mode === LoggerModes.Off) {
        return;
    }
    var jsonContent = {};
    if (printFull) {
        content = util_1.default.inspect(content);
    }
    if (format === Formats.Json) {
        jsonContent.message = content;
    }
    if (mode !== LoggerModes.Custom) {
        if (format === Formats.Line) {
            content = level.prefix + ': ' + content;
        }
        else if (format === Formats.Json) {
            jsonContent.level = level.prefix;
        }
    }
    if (timestamp) {
        if (format === Formats.Line) {
            var time = '[' + new Date().toISOString() + '] ';
            content = time + content;
        }
        else if (format === Formats.Json) {
            jsonContent.timestamp = new Date().toISOString();
        }
    }
    if (format === Formats.Json) {
        content = JSON.stringify(jsonContent);
    }
    if (mode === LoggerModes.Console) {
        var colorFn = colors_1.default[level.color];
        console.log(colorFn(content));
    }
    else if (mode === LoggerModes.File) {
        writeToFile(content + '\n', filePath).catch(function (err) {
            console.log(err);
        });
    }
    else if (mode === LoggerModes.Custom) {
        if (!!customLogger) {
            customLogger(new Date(), level.prefix, content);
        }
        else {
            throw Error(errors.customLoggerErr);
        }
    }
    else {
        throw Error(errors.modeErr);
    }
}
function writeToFile(content, filePath) {
    return new Promise(function (res, rej) {
        return fs_1.default.appendFile(filePath, content, function (err) {
            return (!!err ? rej(err) : res());
        });
    });
}
exports.default = JetLogger();
