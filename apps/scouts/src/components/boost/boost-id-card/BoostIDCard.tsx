import React from 'react';

import { ProfilePicture, useCurrentUser } from 'learn-card-base';
import { BoostCMSState } from '../boost';
import { insertParamsToFilestackUrl } from 'learn-card-base';
import EmptyImage from 'learn-card-base/assets/images/empty-image.png';

const BoostCMSIDCard: React.FC<{
    state: BoostCMSState;
    setState?: React.Dispatch<React.SetStateAction<BoostCMSState>>;
    idClassName?: string;
    idFooterClassName?: string;
    customIssuerThumbContainerClass?: string;
}> = ({ state, setState, idClassName, idFooterClassName, customIssuerThumbContainerClass }) => {
    const currentUser = useCurrentUser();

    let backgroundStyles = {};

    if (state?.appearance?.idBackgroundImage) {
        backgroundStyles = {
            backgroundImage: `url(${state?.appearance?.idBackgroundImage})`,
        };

        if (state?.appearance?.dimIdBackgroundImage) {
            backgroundStyles = {
                backgroundImage: `linear-gradient(to bottom, rgba(0, 0, 0, 0.05), rgba(0, 0, 0, 0.75)), url(${state?.appearance?.idBackgroundImage})`,
            };
        }
    } else {
        backgroundStyles = {
            background: '#18224e',
        };
    }

    const issuerLineClampStyles = state?.address.streetAddress ? 'line-clamp-1' : 'line-clamp-2';

    return (
        <>
            <div
                style={{
                    ...backgroundStyles,
                }}
                className={`relative flex-col w-[335px] h-[180px] rounded-tr-[24px] rounded-tl-[24px] border-white border-opacity-30 border-solid border-l-4 border-r-4 border-t-4 z-50 pl-4 pt-2 bg-cover bg-center bg-no-repeat ${idClassName}`}
            >
                <ProfilePicture
                    customContainerClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl min-w-[80px] min-h-[80px]"
                    customImageClass="flex justify-center items-center h-[80px] w-[80px] rounded-full overflow-hidden object-cover border-white border-solid border-2 min-w-[80px] min-h-[80px]"
                    customSize={500}
                />
                <p
                    style={{ color: state?.appearance?.fontColor || '#ffffff' }}
                    className={`capitalize text-sm font-medium mt-2 max-w-[200px] line-clamp-1`}
                >
                    {currentUser?.name}
                </p>
                <p
                    style={{ color: state?.appearance?.fontColor || '#ffffff' }}
                    className={`font-semibold text-sm max-w-[200px] boost-id-card-issuer-name ${issuerLineClampStyles}`}
                >
                    {state?.basicInfo?.issuerName}
                </p>
                <p
                    style={{ color: state?.appearance?.fontColor || '#ffffff' }}
                    className="uppercase text-sm max-w-[200px] line-clamp-1"
                >
                    {state?.address?.streetAddress}
                </p>
                {state?.appearance?.showIdIssuerImage && (
                    <div
                        className={`absolute rounded-full bottom-[-25px] bg-white flex items-center justify-center overflow-hidden border-[3px] border-solid border-white id-card-issuer-thumb-container ${customIssuerThumbContainerClass}`}
                    >
                        {!state?.appearance?.idIssuerThumbnail ? (
                            <img
                                alt="issuer thumbnail"
                                src={EmptyImage}
                                className="w-[43px] h-[47px]"
                            />
                        ) : (
                            <img
                                alt="issuer thumbnail"
                                src={
                                    state?.appearance?.idIssuerThumbnail
                                        ? insertParamsToFilestackUrl(
                                              state?.appearance?.idIssuerThumbnail,
                                              'resize=width:200/quality=value:75/'
                                          )
                                        : EmptyImage
                                }
                                className="w-full h-full object-cover "
                            />
                        )}
                    </div>
                )}
            </div>
            <div
                style={{ backgroundColor: state?.appearance?.accentColor || '#622599' }}
                className={`relative flex items-start justify-start h-[35px] rounded-br-[24px] rounded-bl-[24px] border-white border-opacity-30 border-solid border-4 w-[335px] boost-id-card-footer ${idFooterClassName}`}
            >
                <div className="w-full h-[2px] bg-white absolute top-[-4px]" />
                <p className="line-clamp-1 boost-id-card-title">{state?.basicInfo?.name}</p>
            </div>
        </>
    );
};

export default BoostCMSIDCard;
