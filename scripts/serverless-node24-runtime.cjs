/* global module */
// Serverless 3.40 predates Node 24. Extend only the loading service's runtime enum, keeping
// all other configuration validation enabled. AWS supports nodejs24.x.
module.exports = class Node24Runtime {
    constructor(serverless) {
        const runtimes = serverless.configSchemaHandler.schema.definitions.awsLambdaRuntime.enum;
        if (!runtimes.includes('nodejs24.x')) runtimes.push('nodejs24.x');
    }
};
