import type { CredentialCandidate } from '../types/messages';
import { detectPlatformFromHostname } from '../utils/platform';

// Heuristic Khan Academy detector
// Looks for clear completion moments like "Unit complete" or "You did it!"
const COMPLETION_PATTERNS: RegExp[] = [
  /\bunit\s+(challenge|test)\b.*\b(complete|completed|finished)\b/i,
  /\bunit\s+complete(d)?\b/i,
  /\byou\s+did\s+it!?/i,
  /\bbadge\s+earned\b/i,
  /\bmastery\s+(level|goal)\s+(up|reached|achieved)\b/i
];

const getTextNodes = (root: ParentNode): string[] => {
  const texts: string[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let n: Node | null = walker.nextNode();
  while (n) {
    const t = (n.textContent || '').trim();
    if (t) texts.push(t);
    n = walker.nextNode();
  }
  return texts;
};

const matchesCompletion = (): boolean => {
  // Limit to common visible containers to reduce load
  const containers = Array.from(document.querySelectorAll('h1, h2, h3, [role="dialog"], [role="alert"], .modal, .header, .header-2, .title, .message, .notification, .toast'));
  const texts = containers.length ? containers.flatMap((el) => getTextNodes(el)) : getTextNodes(document.body);
  return texts.some((txt) => COMPLETION_PATTERNS.some((re) => re.test(txt)));
};

const extractTitles = (): { unitTitle?: string; courseTitle?: string } => {
  const title = document.title || '';
  const parts = title.split('|').map((s) => s.trim()).filter(Boolean);
  let unitTitle: string | undefined;
  let courseTitle: string | undefined;

  if (parts.length >= 2) {
    // e.g. "Unit test: Intro to HTML/CSS | Khan Academy" or "Intro to SQL | Khan Academy"
    const kaIdx = parts.findIndex((p) => /khan\s+academy/i.test(p));
    if (kaIdx > 0) {
      unitTitle = parts[0];
      courseTitle = parts[kaIdx - 1];
    } else {
      unitTitle = parts[0];
      courseTitle = parts[1];
    }
  } else if (parts.length === 1) {
    unitTitle = parts[0];
  }

  // Try to refine from visible headings
  const h1 = document.querySelector('h1');
  if (h1 && h1.textContent) unitTitle = h1.textContent.trim();

  return { unitTitle, courseTitle };
};

export const khanDetector = (): CredentialCandidate[] => {
  const platform = detectPlatformFromHostname(location.hostname);
  if (platform !== 'khanacademy') return [];

  // Only surface a candidate when we believe a completion moment occurred
  if (!matchesCompletion()) return [];

  const { unitTitle, courseTitle } = extractTitles();

  const title = unitTitle
    ? `Completed: ${unitTitle}`
    : courseTitle
    ? `Completed: ${courseTitle}`
    : 'Completed Khan Academy activity';

  const url = location.href;
  const now = new Date().toISOString();

  const raw = {
    platform: 'khanacademy' as const,
    event: 'completion',
    unitTitle,
    courseTitle,
    completedAt: now,
    url,
    evidence: [
      {
        type: 'Evidence',
        name: 'Khan Academy Activity',
        description: 'Detected completion event on Khan Academy',
        url
      }
    ]
  };

  const candidate: CredentialCandidate = {
    source: 'platform',
    platform: 'khanacademy',
    title,
    url,
    raw
  };

  return [candidate];
};

export type {};
