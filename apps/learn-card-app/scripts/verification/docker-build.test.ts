import { describe, expect, it } from 'bun:test';
import { dockerBuildArguments } from './docker-build';

const localBuilder = async () =>
    JSON.stringify({
        Name: 'lc-verification',
        Driver: 'docker-container',
        Nodes: [{ Endpoint: 'unix:///var/run/docker.sock' }],
    });

describe('verification Docker build cache', () => {
    it('keeps the uncached local build and ownership label', async () => {
        const args = await dockerBuildArguments('owner', async () => {
            throw new Error('unexpected inspect');
        });
        expect(args.slice(0, 2)).toEqual(['docker', 'build']);
        expect(args).toContain('org.learncard.verification=owner');
        expect(args).toContain('learncard-verification:owner');
        expect(args).not.toContain('--cache-from');
    });

    it('builds and loads the current checkout through the explicitly prewarmed local builder', async () => {
        const args = await dockerBuildArguments('warm', localBuilder, 'lc-verification');
        expect(args.slice(0, 3)).toEqual(['docker', 'buildx', 'build']);
        expect(args).toContain('--load');
        expect(args).toContain('lc-verification');
        expect(args).toContain('backend');
        expect(args).toContain('org.learncard.verification=warm');
        expect(args).toContain('learncard-verification:warm');
        expect(args).not.toContain('--cache-to');
    });

    it('selects the requested builder from real newline-delimited list output', async () => {
        const args = await dockerBuildArguments(
            'owner',
            async command => {
                expect(command).toEqual(['docker', 'buildx', 'ls', '--format', 'json']);
                return [
                    JSON.stringify({
                        Name: 'other',
                        Driver: 'docker',
                        Nodes: [{ Endpoint: 'default' }],
                    }),
                    await localBuilder(),
                    '',
                ].join('\r\n');
            },
            'lc-verification'
        );
        expect(args).toContain('lc-verification');
        expect(args).toContain('--load');
    });

    it('does not fall back to a different builder when the requested name is absent', async () => {
        await expect(dockerBuildArguments('owner', localBuilder, 'missing')).rejects.toThrow(
            'was not found'
        );
        await expect(dockerBuildArguments('owner', async () => '', 'missing')).rejects.toThrow(
            'was not found'
        );
    });

    it.each(['tcp://remote:2375', 'ssh://remote', 'alternate-context', 'default'])(
        'rejects a builder endpoint outside the trusted daemon: %s',
        async endpoint => {
            await expect(
                dockerBuildArguments(
                    'owner',
                    async () =>
                        JSON.stringify({
                            Name: 'named',
                            Driver: 'docker-container',
                            Nodes: [{ Endpoint: endpoint }],
                        }),
                    'named'
                )
            ).rejects.toThrow('unix:///var/run/docker.sock');
        }
    );

    it('rejects extra builder nodes and builder option injection', async () => {
        await expect(
            dockerBuildArguments(
                'owner',
                async () =>
                    JSON.stringify({
                        Name: 'named',
                        Driver: 'docker-container',
                        Nodes: [
                            { Endpoint: 'unix:///var/run/docker.sock' },
                            { Endpoint: 'ssh://remote' },
                        ],
                    }),
                'named'
            )
        ).rejects.toThrow('unix:///var/run/docker.sock');
        await expect(dockerBuildArguments('owner', localBuilder, '--flag')).rejects.toThrow(
            'builder name'
        );
    });
});
