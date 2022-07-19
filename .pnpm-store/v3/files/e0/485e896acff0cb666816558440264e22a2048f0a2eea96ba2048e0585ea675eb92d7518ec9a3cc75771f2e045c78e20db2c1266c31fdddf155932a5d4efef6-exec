import { ServiceLoggerBase, DiagnosticsLoggerBase, LogStyle, LogLevel, ServiceLog, WriteableStream } from './logger-base.js';
export declare class DiagnosticsLogger extends DiagnosticsLoggerBase {
    constructor(logLevel: LogLevel, logToFiles: boolean, fileLogger?: WriteableStream);
    log(style: LogStyle, content: string | Record<string, unknown> | Error): void;
}
export declare class ServiceLogger extends ServiceLoggerBase {
    write(message: string): void;
    format(serviceLog: ServiceLog): string;
}
//# sourceMappingURL=loggers.d.ts.map