export var LogStyle;
(function (LogStyle) {
    LogStyle["verbose"] = "info";
    LogStyle["info"] = "info";
    LogStyle["imp"] = "imp";
    LogStyle["warn"] = "warn";
    LogStyle["err"] = "err";
})(LogStyle || (LogStyle = {}));
export var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["verbose"] = 0] = "verbose";
    LogLevel[LogLevel["debug"] = 1] = "debug";
    LogLevel[LogLevel["important"] = 2] = "important";
    LogLevel[LogLevel["warn"] = 3] = "warn";
})(LogLevel || (LogLevel = {}));
export class DiagnosticsLoggerBase {
    constructor(logLevel, logToFiles, fileLogger) {
        this.logLevel = logLevel;
        this.includeStackTrace = this.logLevel <= LogLevel.debug ? true : false;
        this.logToFiles = logToFiles;
        this.fileLogger = fileLogger;
    }
    write(content) {
        this.debug(content);
    }
    verbose(content) {
        if (this.logLevel > LogLevel.verbose) {
            return;
        }
        this.log(LogStyle.verbose, content);
    }
    debug(content) {
        if (this.logLevel > LogLevel.debug) {
            return;
        }
        this.log(LogStyle.info, content);
    }
    imp(content) {
        if (this.logLevel > LogLevel.important) {
            return;
        }
        this.log(LogStyle.imp, content);
    }
    warn(content) {
        this.log(LogStyle.warn, content);
    }
    err(content) {
        this.log(LogStyle.err, content);
    }
    log(style, content) {
        throw new Error('Not implmented in base class');
    }
}
export class ServiceLoggerBase {
    constructor(service, logLevel, logToFiles, stream) {
        this.service = service;
        this.logLevel = logLevel;
        this.logToFiles = logToFiles;
        this.stream = stream;
        this.logToConsole = this.logLevel <= LogLevel.debug;
    }
    log(serviceLog) {
        this.write(this.format(serviceLog));
    }
    write(message) {
        const now = new Date();
        message = `[${now.toUTCString()}] service=${this.service} ${message}`;
        if (this.logToConsole) {
            console.log(message);
        }
    }
    format(serviceLog) {
        throw new Error('Not implmented in base class');
    }
}
const DEFAULT_LOG_CONFIG = {
    logLevel: LogLevel.important,
    logToFiles: false,
};
export class LoggerProviderBase {
    constructor(config = {}, fileLoggerFactory) {
        this.config = {
            logLevel: config.logLevel !== undefined ? config.logLevel : DEFAULT_LOG_CONFIG.logLevel,
            logToFiles: config.logToFiles !== undefined ? config.logToFiles : DEFAULT_LOG_CONFIG.logToFiles,
            logDirectory: config.logDirectory,
        };
        this._fileLoggerFactory = fileLoggerFactory;
        if (this.config.logToFiles && !this._fileLoggerFactory) {
            throw new Error('Must provide a FileLoggerFactory in order to log to files');
        }
        this._diagnosticLogger = this._makeDiagnosticLogger();
    }
    _makeDiagnosticLogger() {
        throw new Error('Not implmented in base class');
    }
    getDiagnosticsLogger() {
        return this._diagnosticLogger;
    }
    makeServiceLogger(serviceName) {
        throw new Error('Not implmented in base class');
    }
}
//# sourceMappingURL=logger-base.js.map