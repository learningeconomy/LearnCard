import { readFile } from 'fs/promises';

export default readFile(
    require.resolve('@learncard/didkit-plugin/dist/didkit/didkit_wasm_bg.wasm')
);
