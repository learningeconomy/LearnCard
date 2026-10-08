import React, { Suspense, useState } from 'react';

import { IonIcon, IonPage, IonContent, IonPopover, IonSpinner } from '@ionic/react';
import { chevronDownOutline, eyeOutline, shareOutline } from 'ionicons/icons';
import { lazyWithRetry, ModalTypes, useDeviceTypeByWidth, useModal } from 'learn-card-base';

import * as m from '../../paraglide/messages.js';
import { ShareCredentialsIllustration } from '../../components/share-links/ShareCredentialsIllustration';

const ShareBoostsBundleModal = lazyWithRetry(
    () => import('../../components/creds-bundle/ShareBoostsBundleModal')
);

const SharedBundleModalFallback: React.FC = () => (
    <IonPage>
        <IonContent>
            <div className="font-poppins flex min-h-[360px] items-center justify-center p-8">
                <IonSpinner name="crescent" className="text-grayscale-700" />
            </div>
        </IonContent>
    </IonPage>
);

type SharingActionsProps = {
    onShare: () => void;
    onViewShared: () => void;
    showHeading?: boolean;
};

const SharingActions: React.FC<SharingActionsProps> = ({
    onShare,
    onViewShared,
    showHeading = false,
}) => (
    <div className={`font-poppins bg-white ${showHeading ? 'px-6 pb-6 pt-2' : 'p-2'}`}>
        {showHeading && (
            <div className="mb-4">
                <h2 className="text-xl font-semibold text-grayscale-900">
                    {m['shareLinks.sharing']()}
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-grayscale-600">
                    {m['shareLinks.sharingHint']()}
                </p>
            </div>
        )}

        <div className={showHeading ? 'space-y-2' : ''} role="menu">
            <button
                type="button"
                role="menuitem"
                onClick={onShare}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 transition-colors group-hover:bg-emerald-200">
                    <IonIcon icon={shareOutline} className="text-xl" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-semibold text-grayscale-900">
                        {m['shareLinks.share']()}
                    </span>
                    <span className="block text-xs leading-relaxed text-grayscale-600">
                        {m['shareLinks.shareActionHint']()}
                    </span>
                </span>
            </button>

            <button
                type="button"
                role="menuitem"
                onClick={onViewShared}
                className="group flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors hover:bg-grayscale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-grayscale-100 text-grayscale-700 transition-colors group-hover:bg-grayscale-200">
                    <IonIcon icon={eyeOutline} className="text-xl" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                    <span className="block text-sm font-semibold text-grayscale-900">
                        {m['shareLinks.viewShared']()}
                    </span>
                    <span className="block text-xs leading-relaxed text-grayscale-600">
                        {m['shareLinks.viewSharedHint']()}
                    </span>
                </span>
            </button>
        </div>
    </div>
);

type PassportSharingMenuProps = {
    onViewShared: () => void;
};

const PassportSharingMenu: React.FC<PassportSharingMenuProps> = ({ onViewShared }) => {
    const { isMobile } = useDeviceTypeByWidth();
    const { newModal, replaceModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const [popoverOpen, setPopoverOpen] = useState(false);
    const [popoverEvent, setPopoverEvent] = useState<Event>();

    const shareModal = (
        <Suspense fallback={<SharedBundleModalFallback />}>
            <ShareBoostsBundleModal
                onDismiss={() => closeModal()}
                onManage={() => {
                    closeModal();
                    onViewShared();
                }}
            />
        </Suspense>
    );

    const openShareModal = (replaceCurrent = false) => {
        setPopoverOpen(false);

        if (replaceCurrent) {
            replaceModal(
                shareModal,
                {},
                { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen }
            );
            return;
        }

        newModal(shareModal, {}, { desktop: ModalTypes.FullScreen, mobile: ModalTypes.FullScreen });
    };

    const viewShared = (fromSheet = false) => {
        setPopoverOpen(false);
        if (fromSheet) closeModal();
        onViewShared();
    };

    const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        if (isMobile) {
            newModal(
                <SharingActions
                    showHeading
                    onShare={() => openShareModal(true)}
                    onViewShared={() => viewShared(true)}
                />,
                { sectionClassName: '!max-w-[500px]' },
                { desktop: ModalTypes.Center, mobile: ModalTypes.BottomSheet }
            );
            return;
        }

        setPopoverEvent(event.nativeEvent);
        setPopoverOpen(true);
    };

    return (
        <>
            <button
                type="button"
                onClick={openMenu}
                aria-label={m['common.share']()}
                aria-haspopup="menu"
                aria-expanded={isMobile ? undefined : popoverOpen}
                className="flex h-10 items-center justify-center gap-2 rounded-[20px] border border-grayscale-200 bg-white py-1 pl-1.5 pr-3 text-sm font-medium text-grayscale-900 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
                <ShareCredentialsIllustration className="h-8 w-8" />
                <span className="hidden sm:inline">{m['common.share']()}</span>
                <IonIcon
                    icon={chevronDownOutline}
                    className="hidden text-sm text-grayscale-600 sm:block"
                    aria-hidden="true"
                />
            </button>

            {!isMobile && (
                <IonPopover
                    isOpen={popoverOpen}
                    event={popoverEvent}
                    reference="event"
                    side="bottom"
                    alignment="end"
                    dismissOnSelect={false}
                    onDidDismiss={() => setPopoverOpen(false)}
                    style={{ '--width': '304px' } as React.CSSProperties}
                >
                    <SharingActions
                        onShare={() => openShareModal()}
                        onViewShared={() => viewShared()}
                    />
                </IonPopover>
            )}
        </>
    );
};

export default PassportSharingMenu;
