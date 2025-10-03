/* DOM helpers for LearnCard Embed SDK */

export function getTargetEl(target: string | HTMLElement): HTMLElement {
  if (typeof target === 'string') {
    const el = document.querySelector<HTMLElement>(target);
    if (!el) throw new Error(`LearnCard.init: target '${target}' not found`);
    return el;
  }
  return target;
}

export function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (className) n.className = className;
  return n;
}
