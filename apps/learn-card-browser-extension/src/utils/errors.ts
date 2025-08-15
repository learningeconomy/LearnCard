// Error utilities shared across popup/background/content

export const toErrorString = (e: unknown): string => {
  try {
    if (!e) return 'Unknown error';
    if (typeof e === 'string') return e;
    if (e instanceof Error) return e.message || String(e);
    if (typeof e === 'object') {
      const anyE = e as any;
      if (typeof anyE.message === 'string') return anyE.message;
      if (typeof anyE.error === 'string') return anyE.error;
      return JSON.stringify(anyE);
    }
    return String(e);
  } catch {
    return 'Unknown error';
  }
};
