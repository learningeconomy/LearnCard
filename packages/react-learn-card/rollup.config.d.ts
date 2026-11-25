// Types for rollup.config.js so tests can import the real build config. Every entry has an
// output array.
import type { OutputOptions, RollupOptions } from 'rollup';

declare const configs: Array<RollupOptions & { output: OutputOptions[] }>;
export default configs;
