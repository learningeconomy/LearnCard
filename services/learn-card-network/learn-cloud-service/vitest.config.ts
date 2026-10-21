import { createVitestConfig, nodePreset } from '../../../vitest.shared';

export default createVitestConfig(nodePreset, {
    test: {
        include: [
            'test/uri-helpers.spec.ts',
            'test/query.helpers.spec.ts',
            'test/xapi.helpers.spec.ts',
            'test/share-content-auth.spec.ts',
            'src/config/stageConfig.test.ts',
            'src/config/serverlessFunctionEnv.test.ts',
            '*Lambda.test.ts',
        ],
    },
});
