import * as m from '../../paraglide/messages.js';

/** Resolve only stable publication codes; exception messages can contain private data. */
export const resumePublicationErrorMessage = (error: unknown): string => {
    const code =
        typeof error === 'object' && error !== null && 'code' in error ? error.code : undefined;
    switch (code) {
        case 'legacy':
            return m['resumePublishing.legacy']();
        case 'pending':
            return m['resumePublishing.pending']();
        case 'size':
            return m['resumePublishing.size']();
        case 'inactive':
            return m['resumePublishing.inactive']();
        case 'account':
            return m['resumePublishing.account']();
        case 'changed':
            return m['resumePublishing.changed']();
        default:
            return m['resumePublishing.failed']();
    }
};
