export declare enum LoggerModes {
    Console = "CONSOLE",
    File = "FILE",
    Custom = "CUSTOM",
    Off = "OFF"
}
export declare enum Formats {
    Line = "LINE",
    Json = "JSON"
}
declare type TJetLogger = ReturnType<typeof JetLogger>;
export declare type TCustomLogger = (timestamp: Date, prefix: string, content: any) => void;
export declare function JetLogger(mode?: LoggerModes, filePath?: string, timestamp?: boolean, format?: Formats, customLogger?: TCustomLogger): {
    readonly settings: {
        readonly mode: LoggerModes;
        readonly filePath: string;
        readonly timestamp: boolean;
        readonly format: Formats;
        readonly customLogger: TCustomLogger | undefined;
    };
    readonly info: typeof info;
    readonly imp: typeof imp;
    readonly warn: typeof warn;
    readonly err: typeof err;
};
declare function info(this: TJetLogger, content: any, printFull?: boolean): void;
declare function imp(this: TJetLogger, content: any, printFull?: boolean): void;
declare function warn(this: TJetLogger, content: any, printFull?: boolean): void;
declare function err(this: TJetLogger, content: any, printFull?: boolean): void;
declare const _default: {
    readonly settings: {
        readonly mode: LoggerModes;
        readonly filePath: string;
        readonly timestamp: boolean;
        readonly format: Formats;
        readonly customLogger: TCustomLogger | undefined;
    };
    readonly info: typeof info;
    readonly imp: typeof imp;
    readonly warn: typeof warn;
    readonly err: typeof err;
};
export default _default;
