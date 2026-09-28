import React, { lazy, Suspense } from 'react';
import { IonIcon } from '@ionic/react';
import { arrowForwardOutline } from 'ionicons/icons';
import type { VC } from '@learncard/types';
import { ModalTypes, useModal, type BoostCategoryOptionsEnum } from 'learn-card-base';
import {
    getDefaultCategoryForCredential,
    getAchievementType,
    getImageUrlFromCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { credentialText, type ProofState } from './shareLinkFlow';
import * as m from '../../paraglide/messages.js';

const CredentialPreview = lazy(() => import('./ShareCredentialProfilePreview'));
const CredentialBadgeNew = lazy(
    () => import('learn-card-base/components/CredentialBadge/CredentialBadgeNew')
);

/** Render the shared original without applying issuer edits or exposing owner actions. */
export const ShareCredentialVisual = ({
    credential,
    proof,
    endorsements,
}: {
    credential: VC;
    proof?: ProofState;
    endorsements: VC[];
}) => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.FullScreen,
        desktop: ModalTypes.FullScreen,
    });
    const proofText =
        proof === 'verified'
            ? m['shareLinks.verified']()
            : proof === 'failed'
              ? m['shareLinks.failed']()
              : m['shareLinks.unavailable']();
    const displayCredential = unwrapBoostCredential(credential);
    return (
        <button
            type="button"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-[20px] !bg-grayscale-900 px-5 py-3 text-sm font-medium leading-none !text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            onClick={() =>
                newModal(
                    <Suspense fallback={<p role="status">{m['shareLinks.loading']()}</p>}>
                        <CredentialPreview
                            credential={credential}
                            sharedOriginal
                            categoryType={
                                getDefaultCategoryForCredential(
                                    credential
                                ) as BoostCategoryOptionsEnum
                            }
                            titleOverride={credentialText(credential).name}
                            issuerOverride={credentialText(credential).issuer}
                            customThumbComponent={
                                <CredentialBadgeNew
                                    showBackgroundImage={false}
                                    backgroundImage=""
                                    backgroundColor=""
                                    credential={displayCredential}
                                    boostType={
                                        getDefaultCategoryForCredential(
                                            credential
                                        ) as BoostCategoryOptionsEnum
                                    }
                                    achievementType={getAchievementType(credential)}
                                    badgeThumbnail={getImageUrlFromCredential(credential)}
                                    fallbackCircleText={credentialText(credential).name}
                                    badgeCircleCustomClass="w-[170px] h-[170px]"
                                />
                            }
                            customBodyCardComponent={undefined}
                            customFooterComponent={
                                <p className="text-xs text-grayscale-600">{proofText}</p>
                            }
                            customIssueHistoryComponent={undefined}
                            verificationItems={[
                                {
                                    check: 'proof',
                                    status:
                                        proof === 'verified'
                                            ? 'Success'
                                            : proof === 'failed'
                                              ? 'Failed'
                                              : 'Error',
                                    message: proofText,
                                },
                            ]}
                            existingEndorsements={endorsements}
                            hideQRCode
                            handleCloseModal={closeModal}
                        />
                    </Suspense>
                )
            }
        >
            <span>{m['alerts.viewCredential']()}</span>
            <IonIcon
                icon={arrowForwardOutline}
                aria-hidden="true"
                className="block h-4 w-4 shrink-0"
            />
        </button>
    );
};
