import type { KeyManagementService } from './types';
import { LocalKeyManagementService } from './local';
import { AwsKmsKeyManagementService } from './aws';

export function getKeyManagementService(
    env: NodeJS.ProcessEnv = process.env
): KeyManagementService {
    const provider = env.KMS_PROVIDER ?? 'local';

    switch (provider) {
        case 'aws':
        case 'aws-kms':
            return new AwsKmsKeyManagementService({ region: env.AWS_REGION });
        case 'local':
            return new LocalKeyManagementService();
        default:
            throw new Error(`Unknown KMS_PROVIDER: ${provider}`);
    }
}
