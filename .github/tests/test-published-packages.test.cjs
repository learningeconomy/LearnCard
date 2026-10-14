const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { tmpdir } = require('node:os');
const { parse } = require('yaml');
const { build } = require('esbuild');
const ts = require('typescript');

const root = path.resolve(__dirname, '../..');
const workflow = file => parse(fs.readFileSync(path.join(root, file), 'utf8'));

const main = async () => {
    const deploy = workflow('.github/workflows/deploy.yml').jobs;
    const publish = deploy['publish-npm'];
    assert.equal(
        publish.outputs['package-versions'],
        '${{ steps.smoke-versions.outputs.package-versions }}'
    );
    assert.equal(
        deploy['smoketest-published-packages'].with['package-versions'],
        '${{ needs.publish-npm.outputs.package-versions }}'
    );
    const prepareIndex = publish.steps.findIndex(
        step => step.name === 'Prepare publish dependency versions'
    );
    const excludeIndex = publish.steps.findIndex(
        step => step.name === 'Keep DIDKit native addon out of changeset publish'
    );
    assert(
        prepareIndex >= 0 && prepareIndex < excludeIndex,
        'validate original package privacy before excluding the separately published native addon'
    );

    const smoke = workflow('.github/workflows/smoketest-npm-packages.yml').jobs;
    for (const name of ['smoketest', 'bundler-smoketest']) {
        const job = smoke[name];
        assert.equal(job.needs, 'resolve-versions');
        assert.equal(
            job.env.SMOKE_PACKAGE_VERSIONS,
            '${{ needs.resolve-versions.outputs.package-versions }}'
        );
        assert(job.steps.some(step => step.run?.includes('smoketest-npm-packages.mjs" install')));
    }
    assert(
        smoke['resolve-versions'].steps.some(step =>
            step.run?.includes('smoketest-npm-packages.mjs versions')
        )
    );

    for (const service of ['brain-service', 'lca-api', 'learn-cloud-service']) {
        const serviceRoot = path.join(root, 'services/learn-card-network', service);
        const manifest = JSON.parse(
            fs.readFileSync(path.join(serviceRoot, 'package.json'), 'utf8')
        );
        assert.equal(manifest.dependencies['@learncard/service-config'], 'workspace:*');
        const project = JSON.parse(fs.readFileSync(path.join(serviceRoot, 'project.json'), 'utf8'));
        assert(project.targets.build.inputs.includes('{projectRoot}/bundle.mjs'));
        assert(
            project.targets.build.inputs.includes(
                '{workspaceRoot}/packages/service-config/src/**/*'
            )
        );
        // Exercise the real configuration entry bundled into the published
        // service. A manifest-only removal would break consumers if the build
        // emitted an external require/import of the private helper.
        const entry = path.join(serviceRoot, 'src/config/stageConfig.ts');
        const result = await build({
            entryPoints: [entry],
            absWorkingDir: serviceRoot,
            outfile: 'dist/index.js',
            bundle: true,
            platform: 'node',
            format: 'cjs',
            write: false,
            metafile: true,
            logLevel: 'silent',
        });
        assert(
            Object.keys(result.metafile.inputs).some(file =>
                file.endsWith('service-config/src/stageConfig.ts')
            )
        );
        for (const output of Object.values(result.metafile.outputs)) {
            assert(!output.imports.some(item => item.path.startsWith('@learncard/service-config')));
        }
        const declarations = [];
        const program = ts.createProgram([entry], {
            target: ts.ScriptTarget.ES2022,
            module: ts.ModuleKind.ESNext,
            moduleResolution: ts.ModuleResolutionKind.Bundler,
            resolveJsonModule: true,
            skipLibCheck: true,
            declaration: true,
            emitDeclarationOnly: true,
            outDir: path.join(serviceRoot, 'dist-publish-contract'),
        });
        assert.deepEqual(ts.getPreEmitDiagnostics(program), []);
        const emitted = program.emit(undefined, (file, text) => {
            if (file.endsWith('/src/config/stageConfig.d.ts')) declarations.push(text);
        });
        assert.deepEqual(emitted.diagnostics, []);
        assert.equal(declarations.length, 1);
        assert(
            !declarations[0].includes('@learncard/service-config'),
            'public configuration declarations must not import private types'
        );

        const staging = fs.mkdtempSync(path.join(tmpdir(), 'service-publish-contract-'));
        try {
            const stagedService = path.join(staging, 'service');
            fs.mkdirSync(path.join(stagedService, 'dist'), { recursive: true });
            fs.mkdirSync(path.join(staging, 'packages/service-config'), { recursive: true });
            fs.writeFileSync(
                path.join(staging, 'packages/service-config/package.json'),
                JSON.stringify({
                    name: '@learncard/service-config',
                    version: '0.1.1',
                    private: true,
                })
            );
            fs.writeFileSync(
                path.join(stagedService, 'package.json'),
                JSON.stringify({
                    name: manifest.name,
                    version: manifest.version,
                    main: 'dist/index.js',
                    types: 'dist/index.d.ts',
                    dependencies: { '@learncard/service-config': 'workspace:*' },
                })
            );
            fs.writeFileSync(
                path.join(stagedService, 'dist/index.js'),
                result.outputFiles[0].contents
            );
            fs.writeFileSync(path.join(stagedService, 'dist/index.d.ts'), declarations[0]);
            fs.writeFileSync(
                path.join(stagedService, 'dist/publish-metafile.json'),
                JSON.stringify(result.metafile)
            );
            const prepare = spawnSync(
                process.execPath,
                [
                    path.join(root, 'scripts/prepare-publish-workspace-deps.mjs'),
                    '--root=' + staging,
                ],
                { encoding: 'utf8' }
            );
            assert.equal(prepare.status, 0, prepare.stderr);
            const published = JSON.parse(
                fs.readFileSync(path.join(stagedService, 'package.json'), 'utf8')
            );
            assert.equal(published.dependencies['@learncard/service-config'], undefined);
            assert.equal(
                manifest.dependencies['@learncard/service-config'],
                'workspace:*',
                'source hosts keep their runtime helper'
            );
        } finally {
            fs.rmSync(staging, { recursive: true, force: true });
        }
    }

    const tests = spawnSync(
        process.execPath,
        [
            '--test',
            'scripts/smoketest-npm-packages.test.mjs',
            'scripts/prepare-publish-workspace-deps.test.mjs',
        ],
        { cwd: root, stdio: 'inherit' }
    );
    assert.equal(tests.status, 0);
    console.log('Published package contracts passed');
};

main().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
