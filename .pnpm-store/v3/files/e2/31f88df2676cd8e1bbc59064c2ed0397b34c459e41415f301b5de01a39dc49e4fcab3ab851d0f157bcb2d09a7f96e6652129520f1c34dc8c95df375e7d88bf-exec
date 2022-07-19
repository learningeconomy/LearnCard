import { DiagnosticsLogger, ServiceLogger } from './loggers.js';
import { LoggerProviderBase } from './logger-base.js';
import * as path from 'path';
import * as os from 'os';
export class LoggerProvider extends LoggerProviderBase {
    _getLogPath(filename) {
        if (!this.config.logToFiles) {
            throw new Error('Tried to generate log path when logToFiles is false');
        }
        const logDirectory = this.config.logDirectory || path.join(os.homedir(), '.ceramic', 'logs/');
        return path.join(logDirectory, filename);
    }
    _makeDiagnosticLogger() {
        let stream = null;
        if (this.config.logToFiles) {
            stream = this._fileLoggerFactory(this._getLogPath('diagnostics.log'));
        }
        return new DiagnosticsLogger(this.config.logLevel, this.config.logToFiles, stream);
    }
    makeServiceLogger(serviceName, fileName) {
        let stream = null;
        if (this.config.logToFiles) {
            const logName = fileName || serviceName;
            stream = this._fileLoggerFactory(this._getLogPath(`${logName}.log`));
        }
        return new ServiceLogger(serviceName, this.config.logLevel, this.config.logToFiles, stream);
    }
}
//# sourceMappingURL=logger-provider.js.map