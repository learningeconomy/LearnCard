// DOM-related utilities that can be used by content scripts

export const debounce = <T extends (...args: any[]) => void>(fn: T, wait = 200) => {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), wait);
  };
};

export const installLocationChangeHook = () => {
  // Idempotent
  const anyHistory = history as History & { __lcHooked?: boolean };
  if (anyHistory.__lcHooked) return;

  const pushState = history.pushState;
  history.pushState = function (this: History, ...args) {
    const ret = pushState.apply(this, args as unknown as any);
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  } as typeof history.pushState;

  const replaceState = history.replaceState;
  history.replaceState = function (this: History, ...args) {
    const ret = replaceState.apply(this, args as unknown as any);
    window.dispatchEvent(new Event('locationchange'));
    return ret;
  } as typeof history.replaceState;

  window.addEventListener('popstate', () => {
    window.dispatchEvent(new Event('locationchange'));
  });

  anyHistory.__lcHooked = true;
};
