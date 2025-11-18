import { Boost, VC } from '@learncard/types';
import { LCR } from './credential-records';

/**
 * Represents an AI assessment session with its associated boost, verifiable credential, and record
 */
export type AiSession = {
    /** The boost associated with this AI session */
    boost: Boost & { boost: VC };

    /** The verifiable credential for this session, if it exists */
    vc?: VC;

    /** The LearnCard record for this session, if it exists */
    record?: LCR;
};
