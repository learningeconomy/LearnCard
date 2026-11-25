import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useModal } from '../components/modals/useModal';
import { ModalTypes, type ModalInstanceToken } from '../components/modals/types/Modals';
import { useModalsContext } from '../components/modals/ModalsContext';
import type { MessagePresentationProps } from './presentationTypes';
import { InAppMessageStory } from './InAppMessageStory';
import { InAppMessageIframe } from './InAppMessageIframe';

const Mounted: React.FC<{ onShown: () => void; children: React.ReactNode }> = ({
    onShown,
    children,
}) => {
    useEffect(onShown, [onShown]);
    return <>{children}</>;
};

/** Keep screen position available to the modal's passive dismissal callback. */
export const InAppMessageRichPresentation: React.FC<
    MessagePresentationProps & { onShown: () => void }
> = props => {
    const [stepIndex, setStepIndex] = useState(0);
    const onClose: MessagePresentationProps['onClose'] = (reason, details) =>
        props.onClose(
            reason,
            props.message.presentation === 'story' ? { stepIndex, ...details } : details
        );
    return (
        <InAppMessageSurface {...props} onClose={onClose}>
            {props.message.presentation === 'story' ? (
                <InAppMessageStory
                    {...props}
                    onClose={onClose}
                    stepIndex={stepIndex}
                    onStepChange={setStepIndex}
                />
            ) : (
                <InAppMessageIframe {...props} />
            )}
        </InAppMessageSurface>
    );
};

/** The token owns only this modal. Portaling keeps live locale and host callbacks intact. */
export const InAppMessageSurface: React.FC<
    MessagePresentationProps & {
        onShown: () => void;
        children: React.ReactNode;
    }
> = props => {
    const { newModalWithToken, forceCloseModalByToken } = useModal();
    const { modals } = useModalsContext();
    const [ownedToken, setOwnedToken] = useState<ModalInstanceToken | null>(null);
    const [surfaceRevision, setSurfaceRevision] = useState(0);
    const handledToken = useRef<ModalInstanceToken | null>(null);
    const [target] = useState(() => {
        const container = document.createElement('div');
        container.className = 'w-full h-full min-h-0';
        return container;
    });
    const [attached, setAttached] = useState(false);
    const attach = useCallback(
        (host: HTMLDivElement | null): void => {
            if (!host) return;
            // Reparent the same portal container; replacing it remounts in-flight action owners.
            host.appendChild(target);
            setAttached(true);
        },
        [target]
    );
    const latest = useRef(props);
    useLayoutEffect(() => {
        latest.current = props;
    });

    useEffect(() => {
        const story = latest.current.message.presentation === 'story';
        const token = newModalWithToken(
            <div ref={attach} className="w-full h-full min-h-0" />,
            {
                hideButton: true,
                sectionClassName: story ? 'lc-message-story' : 'lc-message-iframe',
                onClose: () => {
                    if (latest.current.message.dismissible) latest.current.onClose('dismissed');
                    // Host cleanup removes precisely this instance, never the next modal in the stack.
                    return false;
                },
            },
            {
                desktop: story ? ModalTypes.Center : ModalTypes.FullScreen,
                mobile: ModalTypes.FullScreen,
            }
        );
        setOwnedToken(token);
        return () => forceCloseModalByToken(token);
    }, [newModalWithToken, forceCloseModalByToken, attach, surfaceRevision]);

    useEffect(() => {
        if (!ownedToken || handledToken.current === ownedToken) return;
        const instance = modals.find(
            modal => modal.id === ownedToken.id && modal.generation === ownedToken.generation
        );
        // Wait for exit cleanup before opening another campaign into a bulk-clearing stack.
        if (instance) return;
        handledToken.current = ownedToken;
        if (latest.current.message.dismissible) latest.current.onClose('expired');
        else setSurfaceRevision(value => value + 1);
    }, [modals, ownedToken]);

    return attached
        ? createPortal(<Mounted onShown={props.onShown}>{props.children}</Mounted>, target)
        : null;
};
