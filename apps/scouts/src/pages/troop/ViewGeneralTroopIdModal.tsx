import React, { useEffect, useState } from 'react';

import useEditTroopId from '../../hooks/useEditTroopId';
import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';
import {
    useModal,
    useResolveBoost,
    useGetCredentialWithEdits,
    useCountBoostRecipients,
    useGetBoostPermissions,
    useGetBoostRecipients,
    UserProfilePicture,
    ModalTypes,
} from 'learn-card-base';

import ViewTroopIdTemplate from './ViewTroopIdTemplate';
import TroopIdDetails from './TroopIdDetails/TroopIdDetails';
import BulkyAddUser from 'learn-card-base/svgs/BulkyAddUser';
import ThreeDots from 'learn-card-base/svgs/ThreeDots';
import X from 'learn-card-base/svgs/X';

import {
    getRoleFromCred,
    getScoutDefaultsForRole,
    getWallpaperBackgroundStyles,
} from '../../helpers/troop.helpers';
import { VC, VerificationItem } from '@learncard/types';

type ViewGeneralTroopIdModalProps = {
    credential: VC;
    boostUri: string;
};

const ViewGeneralTroopIdModal: React.FC<ViewGeneralTroopIdModalProps> = ({
    credential,
    boostUri,
}) => {
    const { closeModal } = useModal({
        desktop: ModalTypes.FullScreen,
        mobile: ModalTypes.FullScreen,
    });

    const [showDetails, setShowDetails] = useState(false);

    const { data: resolvedCredential } = useResolveBoost(boostUri);
    credential = resolvedCredential ?? credential;
    const { credentialWithEdits } = useGetCredentialWithEdits(credential, boostUri);
    credential = credentialWithEdits ?? credential;

    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    const { verifyCredential } = useVerifyCredential(false);

    useEffect(() => {
        verifyCredential(credential, verifications => setVerificationItems(verifications));
    }, [credential]);

    const { data: recipients } = useGetBoostRecipients(boostUri);
    const { data: recipientCount } = useCountBoostRecipients(boostUri);

    const role = getRoleFromCred(credential);
    const { roleName } = getScoutDefaultsForRole(role);

    const { data: permissionsData } = useGetBoostPermissions(boostUri);
    const { canEdit } = permissionsData ?? {};

    const { openEditIdModal } = useEditTroopId(credential);

    const backgroundStyles = getWallpaperBackgroundStyles(undefined, credential);

    return (
        <section className="h-full w-full" style={backgroundStyles}>
            <div className="h-full w-full overflow-y-auto">
                {!showDetails && (
                    <ViewTroopIdTemplate
                        idThumb={credential?.boostID?.idThumbnail}
                        idMainText={`${roleName}`}
                        idSubText={`Issued to ${recipientCount} ${recipientCount === 1 ? 'person' : 'people'
                            }`}
                        idExtraInfo={
                            <div className="flex">
                                {recipients.slice(0, 5)?.map((r, index) => (
                                    <UserProfilePicture
                                        key={index}
                                        user={r.to}
                                        customContainerClass="w-[25px] h-[25px] mr-[-7px]"
                                        customSize={500}
                                    />
                                ))}
                                {(recipients?.length ?? 0) > 5 && (
                                    <div className="w-[25px] h-[25px] text-[12px] font-notoSans font-[600] flex items-center justify-center bg-gray-100 rounded-full text-gray-600 z-10">
                                        +{recipients?.length - 5}
                                    </div>
                                )}
                            </div>
                        }
                        credential={{ ...credential, boostId: boostUri }}
                        divetButton={
                            <button
                                // onClick={handleShare}
                                className="bg-sp-green-forest rounded-full h-[50px] w-[50px] shadow-box-bottom flex items-center justify-center"
                            >
                                <BulkyAddUser />
                            </button>
                        }
                        isGeneralView
                    />
                )}

                {showDetails && (
                    <div className="max-w-[335px] mx-auto pt-[80px] pb-[120px]">
                        <TroopIdDetails
                            credential={credential}
                            verificationItems={verificationItems}
                            boostUri={boostUri}
                            isGeneralView
                        />
                    </div>
                )}
            </div>

            <footer className="w-full bg-white bg-opacity-70 border-t-[1px] border-solid border-white absolute bottom-0 p-[20px] backdrop-blur-[10px] h-[85px]">
                <div className="max-w-[600px] mx-auto flex gap-[10px]">
                    <button
                        onClick={closeModal}
                        className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom"
                    >
                        <X className="h-[20px] w-[20px]" />
                    </button>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                    >
                        {showDetails ? 'Back' : 'Details'}
                    </button>
                    {canEdit && (
                        <button
                            onClick={openEditIdModal}
                            className="bg-white py-[9px] px-[15px] rounded-[30px] font-notoSans text-[17px] text-grayscale-900 w-full shadow-button-bottom"
                        >
                            Edit
                        </button>
                    )}
                    <button className="bg-white rounded-full text-grayscale-80 py-[10px] px-[12px] shadow-button-bottom">
                        <ThreeDots />
                    </button>
                </div>
            </footer>
        </section>
    );
};

export default ViewGeneralTroopIdModal;
