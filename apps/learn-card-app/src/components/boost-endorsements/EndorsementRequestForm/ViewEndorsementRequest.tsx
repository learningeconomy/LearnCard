import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

import { useIonAlert } from '@ionic/react';
import EndorsementFormHeader from '../EndorsementForm/EndorsementFormHeader';
import EndorsementReviewFooter from '../EndorsementsList/EndorsementReviewFooter';
import EndorsementFullView from '../EndorsementsList/EndorsementFullView';
import EndorsementFormBoostPreviewCard from '../EndorsementForm/EndorsementFormBoostPreviewCard';

import { VC, VerificationItem, VP } from '@learncard/types';
import {
    getDefaultCategoryForCredential,
    unwrapBoostCredential,
} from 'learn-card-base/helpers/credentialHelpers';
import { useGetCredentialWithEdits } from 'learn-card-base';
import { getBespokeLearnCard } from 'learn-card-base/helpers/walletHelpers';
import { EndorsementModeEnum } from '../boost-endorsement.helpers';
import { LCNNotification } from '@learncard/types';

const ViewEndorsementRequest: React.FC<{
    sharedLink: { seed: string; pin: string; uri: string };
    notification?: LCNNotification;
    endorsementVC?: VC;
    handleSaveEndorsement?: (visibility?: boolean) => void;
    isClaimed?: boolean;
}> = ({ sharedLink, notification, endorsementVC, handleSaveEndorsement, isClaimed }) => {
    const location = useLocation();
    const [vc, setVC] = useState<VP>();
    const [errMsg, setErrMsg] = useState<string | undefined | null>();
    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    const [tryRefetch, setTryRefetch] = useState(false);
    const [loading, setLoading] = useState<boolean>(true);
    const [visibility, setVisibility] = useState<boolean>(true);

    const uri = sharedLink?.uri;
    const seed = sharedLink?.seed;
    const pin = sharedLink?.pin;

    const [presentAlert] = useIonAlert();

    const [boost, setBoost] = useState<VC[] | undefined>();
    const [category, setCategory] = useState<string>('');

    const { credentialWithEdits } = useGetCredentialWithEdits(boost, uri);
    let _boost = credentialWithEdits ?? boost;

    // Get credential from ceramic
    const fetchCredential = async (uri: string) => {
        setLoading(true);
        const _seed = `${seed}${pin}`;

        try {
            const wallet = await getBespokeLearnCard(_seed);

            const resolvedVc = await wallet.read.get(uri);

            const verifications = await wallet?.invoke?.verifyCredential(
                Array.isArray(resolvedVc?.verifiableCredential)
                    ? resolvedVc?.verifiableCredential[0]
                    : resolvedVc?.verifiableCredential,
                {},
                true
            );

            setVerificationItems(verifications);

            setVC(resolvedVc);
            if (resolvedVc?.verifiableCredential) {
                // From array of credentials, sort them by type
                const credential = Array.isArray(resolvedVc?.verifiableCredential)
                    ? resolvedVc?.verifiableCredential[0]
                    : resolvedVc?.verifiableCredential;

                const unwrappedVc = unwrapBoostCredential(credential);
                const category = getDefaultCategoryForCredential(unwrappedVc);

                setBoost(unwrappedVc);
                setCategory(category);
            }
            setLoading(false);
            return vc;
        } catch (e) {
            setLoading(false);
            setErrMsg(`Error: wrong PIN: ${e}`);

            presentAlert({
                backdropDismiss: false,
                cssClass: 'boost-confirmation-alert',
                header: `Error fetching credential: ${e}`,
                buttons: [
                    {
                        text: 'OK',
                        role: 'confirm',
                        handler: async () => {
                            setTryRefetch(!tryRefetch);
                        },
                    },
                    {
                        text: 'Cancel',
                        role: 'cancel',
                        handler: () => {
                            console.log('Cancel clicked');
                        },
                    },
                ],
            });

            throw new Error(`Error fetching credential: ${e}`);
        }
    };

    useEffect(() => {
        if (pin && uri) {
            fetchCredential((uri as string).replace('localhost:', 'localhost%3A'));
        }
    }, [pin, tryRefetch]);

    return (
        <section className="h-full w-full flex flex-col items-start justify-start overflow-y-scroll bg-grayscale-50 gap-4 pb-[200px]">
            {!isClaimed && (
                <EndorsementFormHeader
                    credential={_boost}
                    mode="review"
                    endorsementVC={endorsementVC}
                />
            )}

            <div className={`px-4 w-full ${isClaimed ? 'mt-2' : ''}`}>
                <EndorsementFormBoostPreviewCard credential={_boost} categoryType={category} />
                <div className="w-full h-[1px] bg-grayscale-300 mt-4 mb-4" />
                <EndorsementFullView
                    credential={_boost}
                    endorsement={endorsementVC}
                    mode={EndorsementModeEnum.Review}
                    visibility={visibility}
                    setVisibility={setVisibility}
                    isClaimed={isClaimed}
                    metadata={notification?.data?.metadata}
                />
            </div>
            <EndorsementReviewFooter
                handleSaveEndorsement={() => handleSaveEndorsement?.(visibility)}
                isDisabled={isClaimed}
            />
        </section>
    );
};

export default ViewEndorsementRequest;
