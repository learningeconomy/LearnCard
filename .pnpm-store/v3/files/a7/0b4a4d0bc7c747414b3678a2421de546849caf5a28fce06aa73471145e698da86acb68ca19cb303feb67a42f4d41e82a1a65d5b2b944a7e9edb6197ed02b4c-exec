import { ServiceLoggerBase, DiagnosticsLoggerBase, } from './logger-base.js';
import flatten from 'flat';
const consoleLogger = {
    info: console.log,
    imp: console.log,
    warn: console.warn,
    err: console.error,
};
export class DiagnosticsLogger extends DiagnosticsLoggerBase {
    constructor(logLevel) {
        super(logLevel, false);
        this.logger = consoleLogger;
    }
    log(style, content) {
        this.logger[style](content);
    }
}
export class ServiceLogger extends ServiceLoggerBase {
    constructor(service, logLevel) {
        super(service, logLevel, false);
    }
    format(serviceLog) {
        return JSON.stringify(flatten(serviceLog));
    }
}
//# sourceMappingURL=loggers-browser.js.map