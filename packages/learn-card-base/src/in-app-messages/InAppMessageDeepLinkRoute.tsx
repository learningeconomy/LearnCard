import { useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useBrandingConfig } from '../config/TenantConfigProvider';
import { getHomeRoute } from '../config/brandingHelpers';
import { requestInAppMessage } from './deepLinkRequestStore';
import { getInAppMessageEntryPath } from './authRedirectHistory';

/** Mount behind authentication; remove the transient entry route from Back history. */
export const InAppMessageDeepLinkRoute = (): null => {
    const { messageId } = useParams<{ messageId: string }>();
    const history = useHistory();
    const branding = useBrandingConfig();
    const handled = useRef<string>();
    useEffect(() => {
        if (handled.current === messageId) return;
        handled.current = messageId;
        try {
            const entryPath = getInAppMessageEntryPath(history.location.pathname);
            const encodedId = /^\/m\/([^/]+)\/?$/i.exec(entryPath)?.[1];
            if (encodedId) requestInAppMessage(decodeURIComponent(encodedId));
        } catch {
            // Malformed links return home without creating a request.
        }
        history.replace(getHomeRoute(branding));
    }, [messageId, history, branding]);
    return null;
};
