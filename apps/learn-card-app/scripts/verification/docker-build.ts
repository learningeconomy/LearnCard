/** Opt-in CI cache. The ordinary local build and token-owned image identity stay unchanged. */
export const dockerBuildArguments = async (
    token: string,
    inspect: (args: string[]) => Promise<string>,
    builderName?: string
): Promise<string[]> => {
    const args = builderName ? ['docker', 'buildx', 'build'] : ['docker', 'build'];
    if (builderName) {
        if (!/^[a-zA-Z0-9][a-zA-Z0-9_.-]*$/.test(builderName))
            throw new Error('Docker cache builder must be an explicit Buildx builder name.');
        const builder = JSON.parse(
            await inspect(['docker', 'buildx', 'inspect', builderName, '--format', '{{json .}}'])
        );
        // --host alone does not constrain an explicitly selected Buildx builder. Require
        // its nodes to use the same trusted system daemon, never a remote/context endpoint.
        if (
            builder.Driver !== 'docker-container' ||
            !Array.isArray(builder.Nodes) ||
            builder.Nodes.length !== 1 ||
            builder.Nodes[0]?.Endpoint !== 'unix:///var/run/docker.sock'
        )
            throw new Error(
                'Docker cache builder must use only unix:///var/run/docker.sock with the docker-container driver.'
            );
        // CI warms this builder's backend-dependencies stage from the shared layer cache.
        // Runtime commands still get only cleanEnvironment(), never cache/API credentials.
        args.push('--builder', builderName, '--load');
    }
    args.push(
        '--file',
        'Dockerfile.monorepo',
        '--target',
        'backend',
        '--label',
        `org.learncard.verification=${token}`,
        '--tag',
        `learncard-verification:${token}`,
        '.'
    );
    return args;
};
