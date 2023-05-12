import { TextEncoder, TextDecoder } from 'util';
import { readFile } from 'fs/promises';

import { setup } from 'jest-dev-server';

const mockdidkit = readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);

jest.mock('./src/didkit_wasm_bg.wasm', () => mockdidkit);

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
