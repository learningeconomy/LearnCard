import { Config } from '../../setup';
export declare enum ApiLevel {
    Trigger = 2,
    Call = 1
}
declare const Level: unique symbol;
interface LevelRefs {
    [k: number]: object | undefined;
}
declare module '../../setup' {
    interface Config {
        [Level]?: LevelRefs;
    }
}
export declare function setLevelRef(config: Config, level: ApiLevel): void;
export declare function getLevelRef(config: Config, level: ApiLevel): object | undefined;
export {};
