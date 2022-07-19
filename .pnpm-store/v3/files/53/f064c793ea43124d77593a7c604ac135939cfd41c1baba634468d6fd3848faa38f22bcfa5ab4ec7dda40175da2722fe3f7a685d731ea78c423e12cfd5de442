import { IOutput } from '../interfaces';
export declare class Output implements IOutput {
    private verb;
    constructor(verb?: boolean);
    set verbose(value: boolean);
    info(message: string): void;
    error(message: string, exitProcess?: boolean): void;
    clear(): void;
    assert(claim: unknown, message: string): void;
}
