import React, { lazy, Suspense } from 'react';
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

const CredentialPreview = lazy(() => import('../boost/boostCMS/BoostPreview/BoostPreview'));
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
            className="rounded-[20px] border border-grayscale-300 px-4 py-2.5 text-sm font-medium text-grayscale-700 hover:bg-grayscale-10 focus-visible:ring-2 focus-visible:ring-emerald-500"
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
            {m['alerts.viewCredential']()}
        </button>
    );
};
