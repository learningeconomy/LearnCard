import { Options } from '../options';
import type { Instance, UserEvent } from './index';
import { Config } from './config';
export declare function createConfig(options?: Partial<Config>, defaults?: Required<Options>, node?: Node): Config;
/**
 * Start a "session" with userEvent.
 * All APIs returned by this function share an input device state and a default configuration.
 */
export declare function setupMain(options?: Options): UserEvent;
/**
 * Setup in direct call per `userEvent.anyApi()`
 */
export declare function setupDirect(options?: Partial<Config>, node?: Node): {
    config: Config;
    api: UserEvent;
};
/**
 * Create a set of callbacks with different default settings but the same state.
 */
export declare function setupSub(this: Instance, options: Options): UserEvent;
