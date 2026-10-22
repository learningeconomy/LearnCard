import { isSafeInAppMessagePath } from '@learncard/types';

type RedirectHistory = {
    push: (path: string) => unknown;
    replace: (path: string) => unknown;
};

export const isSafeInAppMessageAuthRedirect = (path: string): boolean =>
    isSafeInAppMessagePath(path) && /^\/m\/[^/?#]+$/.test(path);

export const resumeAuthRedirect = (history: RedirectHistory, path: string): void => {
    if (isSafeInAppMessageAuthRedirect(path)) {
        history.replace(path);
        return;
    }

    history.push(path);
};
