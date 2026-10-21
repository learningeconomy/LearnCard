import { useEffect, useRef } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { useBrandingConfig } from '../config/TenantConfigProvider';
import { getHomeRoute } from '../config/brandingHelpers';
import { requestInAppMessage } from './deepLinkRequestStore';

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
            requestInAppMessage(decodeURIComponent(messageId));
        } catch {
            // Malformed links return home without creating a request.
        }
        history.replace(getHomeRoute(branding));
    }, [messageId, history, branding]);
    return null;
};
