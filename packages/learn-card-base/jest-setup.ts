import { TextEncoder, TextDecoder } from 'util';
import { readFile } from 'fs/promises';

/* jest.mock('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm?url', () =>
    readFile(require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm'))
); */

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
