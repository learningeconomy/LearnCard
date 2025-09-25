// VC helpers shared between content and popup

export type MinimalVc = {
  '@context'?: unknown[] | string;
  type?: string | string[];
  name?: string;
  issuer?: string;
  credentialSubject?: { name?: string; issuer?: string } & Record<string, unknown>;
  boostCredential?: {
    name?: string;
    issuer?: string;
    credentialSubject?: { name?: string; issuer?: string } & Record<string, unknown>;
  } & Record<string, unknown>;
} & Record<string, unknown>;

export const isVc = (data: unknown): data is MinimalVc => {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  const ctx = obj['@context'] as unknown;
  const type = obj['type'] as unknown;
  const ctxOk = Array.isArray(ctx) || typeof ctx === 'string';
  const typeOk = Array.isArray(type) || typeof type === 'string';
  return ctxOk && typeOk;
};

export const getTitleFromVc = (vc: MinimalVc): string => {
  const b = vc.boostCredential;
  if (b) return b.name || b.credentialSubject?.name || 'Credential';
  return vc.name || vc.credentialSubject?.name || 'Credential';
};

export const getIssuerNameFromVc = (vc: MinimalVc): string => {
  const b = vc.boostCredential;
  if (b) return b.issuer || b.credentialSubject?.issuer || 'Unknown';
  return vc.issuer || vc.credentialSubject?.issuer || 'Unknown';
};
