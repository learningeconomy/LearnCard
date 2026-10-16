import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { signupPolicyData } from '../account-runtime/signup-policy';
// One policy table feeds native presentation and the SDK's mutation validation.
await writeFile(
    resolve(
        import.meta.dir,
        '../ios/NativeCore/Sources/LearnCardNativeSDK/Resources/signup-policy.json'
    ),
    JSON.stringify(signupPolicyData)
);
