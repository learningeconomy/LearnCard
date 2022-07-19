import { Transformer } from '@jest/transform';
import { Loader } from 'esbuild';

interface Options {
    jsxFactory?: string;
    jsxFragment?: string;
    sourcemap?: boolean | 'inline' | 'external';
    loaders?: {
        [ext: string]: Loader;
    };
    target?: string;
    format?: string;
}

declare const transformer: Pick<Transformer, 'canInstrument' | 'createTransformer'>;

export default transformer;
export { Options };
