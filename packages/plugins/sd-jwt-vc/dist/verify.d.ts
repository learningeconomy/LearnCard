import type { VerificationCheck } from '@learncard/types';
import { type SdJwtVcDependentLearnCard, type SdJwtVcFormat, type VerifySdJwtVcOptions } from './types';
export declare const verifySdJwtVc: (learnCard: SdJwtVcDependentLearnCard, compact: string, options?: VerifySdJwtVcOptions, format?: SdJwtVcFormat) => Promise<VerificationCheck>;
//# sourceMappingURL=verify.d.ts.map