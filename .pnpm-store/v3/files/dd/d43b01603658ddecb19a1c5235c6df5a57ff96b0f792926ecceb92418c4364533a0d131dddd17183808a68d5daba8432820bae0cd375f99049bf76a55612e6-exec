export declare enum LogStyle {
    verbose = "info",
    info = "info",
    imp = "imp",
    warn = "warn",
    err = "err"
}
export declare enum LogLevel {
    verbose = 0,
    debug = 1,
    important = 2,
    warn = 3
}
export interface WriteableStream {
    write: (message: string) => void;
}
export declare class DiagnosticsLoggerBase {
    readonly logLevel: LogLevel;
    protected logger: any;
    protected readonly fileLogger: WriteableStream;
    protected readonly includeStackTrace: boolean;
    protected readonly logToFiles: any;
    constructor(logLevel: LogLevel, logToFiles: boolean, fileLogger?: WriteableStream);
    write(content: string | Record<string, unknown> | Error): void;
    verbose(content: string | Record<string, unknown> | Error): void;
    debug(content: string | Record<string, unknown> | Error): void;
    imp(content: string | Record<string, unknown> | Error): void;
    warn(content: string | Record<string, unknown> | Error): void;
    err(content: string | Record<string, unknown> | Error): void;
    log(style: LogStyle, content: string | Record<string, unknown> | Error): void;
}
export interface ServiceLog {
    [key: string]: any;
}
export declare class ServiceLoggerBase {
    readonly service: string;
    readonly logToFiles: boolean;
    readonly logToConsole: boolean;
    readonly logLevel: LogLevel;
    protected readonly stream: WriteableStream;
    constructor(service: string, logLevel: LogLevel, logToFiles: boolean, stream?: WriteableStream);
    log(serviceLog: ServiceLog): void;
    write(message: string): void;
    format(serviceLog: ServiceLog): string;
}
export interface FileLoggerFactory {
    (logPath: string): WriteableStream;
}
export interface LoggerConfig {
    logDirectory?: string;
    logLevel?: LogLevel;
    logToFiles?: boolean;
}
export declare class LoggerProviderBase {
    readonly config: LoggerConfig;
    protected readonly _diagnosticLogger: DiagnosticsLoggerBase;
    protected readonly _fileLoggerFactory: FileLoggerFactory;
    constructor(config?: LoggerConfig, fileLoggerFactory?: FileLoggerFactory);
    protected _makeDiagnosticLogger(): DiagnosticsLoggerBase;
    getDiagnosticsLogger(): DiagnosticsLoggerBase;
    makeServiceLogger(serviceName: string): ServiceLoggerBase;
}
//# sourceMappingURL=logger-base.d.ts.map