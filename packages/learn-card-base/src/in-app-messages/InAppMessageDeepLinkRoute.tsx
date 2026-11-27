import { useEffect, useRef } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router';
import { useBrandingConfig } from '../config/TenantConfigProvider';
import { getHomeRoute } from '../config/brandingHelpers';
import { requestInAppMessage } from './deepLinkRequestStore';
import { getInAppMessageEntryPath } from './authRedirectHistory';

/** Mount behind authentication; remove the transient entry route from Back history. */
export const InAppMessageDeepLinkRoute = (): null => {
    const { messageId } = useParams() as { messageId: string };
    const navigate = useNavigate();
    const location = useLocation();
    const branding = useBrandingConfig();
    const handled = useRef<string>(undefined);
    useEffect(() => {
        if (handled.current === messageId) return;
        handled.current = messageId;
        try {
            const entryPath = getInAppMessageEntryPath(location.pathname);
            const encodedId = /^\/m\/([^/]+)\/?$/i.exec(entryPath)?.[1];
            if (encodedId) requestInAppMessage(decodeURIComponent(encodedId));
        } catch {
            // Malformed links return home without creating a request.
        }
        navigate(getHomeRoute(branding), { replace: true });
    }, [messageId, navigate, branding]);
    return null;
};
