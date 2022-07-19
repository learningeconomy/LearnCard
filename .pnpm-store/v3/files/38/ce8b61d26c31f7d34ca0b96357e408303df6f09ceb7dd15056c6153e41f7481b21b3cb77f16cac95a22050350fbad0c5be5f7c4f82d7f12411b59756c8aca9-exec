import { LoggerModes, JetLogger as Logger } from 'jet-logger';
import logfmt from 'logfmt';
import * as util from 'util';
import flatten from 'flat';
import { ServiceLoggerBase, DiagnosticsLoggerBase, } from './logger-base.js';
export class DiagnosticsLogger extends DiagnosticsLoggerBase {
    constructor(logLevel, logToFiles, fileLogger) {
        super(logLevel, logToFiles, fileLogger);
        const removeTimestamp = true;
        this.logger = Logger(LoggerModes.Console, '', removeTimestamp);
    }
    log(style, content) {
        this.logger[style](content, this.includeStackTrace);
        if (this.logToFiles) {
            const now = new Date();
            const message = `[${now.toUTCString()}] ${content}\n`;
            this.fileLogger.write(message);
        }
    }
}
export class ServiceLogger extends ServiceLoggerBase {
    write(message) {
        super.write(message);
        if (this.logToFiles) {
            const now = new Date();
            message = `[${now.toUTCString()}] service=${this.service} ${util
                .format(message, '\n')
                .replace(/\n\s*\n$/, '\n')}`;
            this.stream.write(message);
        }
    }
    format(serviceLog) {
        return logfmt.stringify(flatten(serviceLog));
    }
}
//# sourceMappingURL=loggers.js.map