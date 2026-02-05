import React, { useEffect, useState, useMemo } from 'react';

import { ScoutsRoleEnum } from '../../stores/troopPageStore';
import boostSearchStore from '../../stores/boostSearchStore';
import useVerifyCredential from 'learn-card-base/hooks/useVerifyCredential';

import TroopPageIdAndTroopBox from './TroopPageIdAndTroopBox';
import TroopPageMembersBox from './TroopPageMembersBox';
import TroopChildrenBox from './TroopChildrenBox';
import TroopPageFooter from './TroopPageFooter';
import TroopIdDetails from './TroopIdDetails/TroopIdDetails';

import ScoutBackground from '../../assets/images/TroopPageBackground_standard.png';
import GlobalBackground from '../../assets/images/TroopPageBackground_global.png';

import { getScoutsRole } from '../../helpers/troop.helpers';
import { getWallpaperBackgroundStyles } from '../../helpers/troop.helpers';
import {
    useGetBoostRecipients,
    useGetCredentialWithEdits,
    useGetCurrentLCNUser,
    useResolveBoost,
    useGetCurrentUserTroopIds,
    useGetBoostParents,
    useGetBoostPermissions,
} from 'learn-card-base';
import { VC, VerificationItem, Boost } from '@learncard/types';
import { useTroopIDStatus } from './TroopIdStatusButton';

type TroopPageProps = {
    credential: VC;
    boost?: Boost;
    boostUri?: string;
    handleShare: () => void;
};

const TroopPage: React.FC<TroopPageProps> = ({ credential, handleShare, boostUri, boost }) => {
    const credentialRole = getScoutsRole(credential);

    // Get current user's actual permissions to determine if they have elevated access
    const { data: myTroopIds } = useGetCurrentUserTroopIds();

    let _credential = boost ? boost : credential.boostCredential ?? credential;
    let _boostUri = boostUri || _credential?.boostId;

    // Get parent boost (network) to check permissions
    const { data: parentBoosts } = useGetBoostParents(_boostUri);
    const parentBoostUri = parentBoosts?.records?.[0]?.uri;

    // Check if user has permissions on the parent network
    // This indicates they are an admin of the parent and should have elevated access
    const { data: parentPermissions } = useGetBoostPermissions(parentBoostUri);

    // Calculate if user has parent admin access (can view child troop details)
    // canEditChildren is a string: "*" means full access, "" means none
    const hasParentAdminAccess = useMemo(() => {
        const hasParentEdit = 
            parentPermissions?.canEdit === true || 
            (parentPermissions?.canEditChildren && parentPermissions.canEditChildren !== '');
        
        console.log('TroopPage permissions debug:', {
            credentialRole,
            parentBoostUri,
            hasParentEdit,
            parentPermissions,
            isNationalAdmin: myTroopIds?.isNationalAdmin,
            isGlobalAdmin: myTroopIds?.isScoutGlobalAdmin,
        });

        return hasParentEdit || myTroopIds?.isScoutGlobalAdmin || myTroopIds?.isNationalAdmin;
    }, [parentPermissions, myTroopIds, credentialRole, parentBoostUri]);

    // For the role, we keep the credential's natural role - this determines what TYPE of content to show
    // But hasParentAdminAccess determines if user CAN SEE that content
    // When viewing a troop, we want to show troop content (leader view), not national content
    const effectiveRole = credentialRole;

    // Keep original role for background styling purposes
    const role = credentialRole;

    const [showIdDetails, setShowIdDetails] = useState(false);

    const [scoutIdType, setScoutIdType] = useState();

    const [verificationItems, setVerificationItems] = useState<VerificationItem[]>([]);
    const { verifyCredential } = useVerifyCredential();

    const currentUser = useGetCurrentLCNUser();
    const { data: recipients } = useGetBoostRecipients(_boostUri);

    const currentUserRecipient = recipients?.find(
        r => r.to.profileId === currentUser?.currentLCNUser?.profileId
    );
    const ownsCurrentId = recipients ? !!currentUserRecipient : true; // default to true since that's the 99% case

    // Use resolved credential from recipient uri
    //   Handles some problems when you drill down into an ID that you own
    //     e.g. If I open the global ID page -> Networks -> select a network which I own the network ID for
    //     then this will make it so that we're using the "earned" version of that credential (which has a valid proof)
    const { data: resolvedCredential } = useResolveBoost(currentUserRecipient?.uri);
    _credential = resolvedCredential?.boostCredential ?? _credential;

    const { credentialWithEdits, isError, error } = useGetCredentialWithEdits(
        _credential,
        _boostUri
    );

    useEffect(() => {
        boostSearchStore.set.contextCredential(credentialWithEdits);
    }, [credentialWithEdits]);

    // Check credential status (valid, pending, revoked)
    const credentialStatus = useTroopIDStatus(_credential, undefined, _boostUri);
    // Parent admins should always see content regardless of credential status
    // (The old revocation logic is being deprecated and may incorrectly mark credentials)
    const isRevokedOrPending = !hasParentAdminAccess && (credentialStatus === 'revoked' || credentialStatus === 'pending');

    console.log('TroopPage status debug:', { credentialStatus, isRevokedOrPending, ownsCurrentId, hasParentAdminAccess });

    const getScoutIdTypeFromBoost = (vc: VC) => {
        return vc?.credentialSubject?.achievement?.achievementType;
    };

    useEffect(() => {
        if (credential) {
            setScoutIdType(credential?.credentialSubject?.achievement?.achievementType);
            verifyCredential(credential, verifications => setVerificationItems(verifications));
        }
    }, [credential]);

    const backgroundStyles = getWallpaperBackgroundStyles(undefined, credentialWithEdits);

    if (!credentialWithEdits?.display?.backgroundImage) {
        backgroundStyles.backgroundImage = `url(${
            role === ScoutsRoleEnum.global ? GlobalBackground : ScoutBackground
        })`;
    }
    const handleDetails = () => {
        setShowIdDetails(!showIdDetails);
    };

    return (
        <section
            className="bg-sp-green-base min-h-full h-full overflow-y-auto"
            style={backgroundStyles}
        >
            <section className="min-h-[calc(100%-85px)] p-[20px] pb-[100px]">
                {showIdDetails && (
                    <div className="max-w-[335px] mx-auto">
                        <TroopIdDetails
                            credential={credentialWithEdits}
                            verificationItems={verificationItems}
                        />
                    </div>
                )}
                {!showIdDetails && (
                    <div className="max-w-[335px] mx-auto flex flex-col gap-[15px]">
                        <TroopPageIdAndTroopBox
                            credential={_credential}
                            handleShare={handleShare}
                            ownsCurrentId={ownsCurrentId}
                            boostUri={_boostUri}
                            handleShowIdDetails={() => setShowIdDetails(true)}
                        />
                        {!isRevokedOrPending && (
                            <>
                                <TroopChildrenBox
                                    credential={credential}
                                    boostUri={_boostUri}
                                    networkName={credentialWithEdits?.name}
                                    userRole={effectiveRole}
                                />
                                <TroopPageMembersBox
                                    credential={credential}
                                    boostUri={_boostUri}
                                    handleShare={handleShare}
                                    userRole={effectiveRole}
                                />
                            </>
                        )}
                    </div>
                )}
            </section>

            <TroopPageFooter
                handleDetails={handleDetails}
                ownsCurrentId={ownsCurrentId}
                credential={_credential}
                uri={_boostUri}
                showIdDetails={showIdDetails}
                handleShare={handleShare}
                isRevoked={isRevokedOrPending}
            />
        </section>
    );
};

export default TroopPage;
