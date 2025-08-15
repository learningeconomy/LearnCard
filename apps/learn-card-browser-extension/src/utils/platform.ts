export type Platform = 'credly' | 'coursera' | 'unknown';

export const detectPlatformFromHostname = (hostname: string): Platform => {
  if (/credly\.com$/i.test(hostname) || /(^|\.)credly\.com$/i.test(hostname)) return 'credly';
  if (/coursera\.org$/i.test(hostname) || /(^|\.)coursera\.org$/i.test(hostname)) return 'coursera';
  return 'unknown';
};

export const detectPlatformFromUrl = (url: string): Platform => {
  try {
    const { hostname } = new URL(url);
    return detectPlatformFromHostname(hostname);
  } catch {
    return 'unknown';
  }
};
