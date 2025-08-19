import type { CredentialCandidate } from '../types/messages';

export type TransformerHelpers = {
  postJson: (url: string, body: unknown) => Promise<any>;
  fetchJson: (url: string) => Promise<any>;
  getDidAuthVp: (args: { challenge: string; domain?: string }) => Promise<unknown>;
};

export type TransformResult = {
  vcs: unknown[];
};

export type Transformer = {
  id: string;
  canTransform: (candidate: CredentialCandidate) => boolean;
  transform: (candidate: CredentialCandidate, helpers: TransformerHelpers) => Promise<TransformResult | null>;
};
