import { DiagnosticsLogger, ServiceLogger } from './loggers-browser.js';
import { LoggerProviderBase } from './logger-base.js';
export class LoggerProvider extends LoggerProviderBase {
    _makeDiagnosticLogger() {
        return new DiagnosticsLogger(this.config.logLevel);
    }
    makeServiceLogger(serviceName) {
        return new ServiceLogger(serviceName, this.config.logLevel);
    }
}
//# sourceMappingURL=logger-provider-browser.js.map