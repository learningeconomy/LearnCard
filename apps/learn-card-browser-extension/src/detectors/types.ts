import type { CredentialCandidate } from '../types/messages';

export type Detector = () => CredentialCandidate[];
