export const PUBLISH_RESUME_KEY = 'lc-publish-resume-after-sign-in';

export const consumePublishResume = (): boolean => {
    try {
        const pending = sessionStorage.getItem(PUBLISH_RESUME_KEY) === '1';
        sessionStorage.removeItem(PUBLISH_RESUME_KEY);
        return pending;
    } catch {
        return false;
    }
};
