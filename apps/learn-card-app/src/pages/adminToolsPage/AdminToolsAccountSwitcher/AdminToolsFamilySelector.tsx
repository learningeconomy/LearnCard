import React from 'react';

import { ProfilePicture, useModal } from 'learn-card-base';
import Checkmark from 'learn-card-base/svgs/Checkmark';

import { VC } from '@learncard/types';

export const AdminToolsFamilySelector: React.FC<{
    families: VC[];
    selectedFamily: VC | undefined;
    setSelectedFamily: React.Dispatch<
        React.SetStateAction<
            | {
                  name: string;
                  picture: string;
                  uri: string;
              }
            | undefined
        >
    >;
}> = ({ families, setSelectedFamily, selectedFamily }) => {
    const { closeModal } = useModal();

    return (
        <>
            <div className="flex flex-col items-center ion-padding bg-white rounded-[20px]">
                <h4 className="text-[20px] text-grayscale-900 py-4">Select a Family</h4>

                {families.map(family => {
                    const isSelected =
                        family?.boostCredential?.name === selectedFamily?.name &&
                        family?.boostId === selectedFamily?.uri;

                    return (
                        <button
                            onClick={() => {
                                setSelectedFamily({
                                    name: family?.boostCredential?.name,
                                    picture: family?.boostCredential?.image,
                                    uri: family?.boostId,
                                });
                                closeModal();
                            }}
                            className="text-left text-lg flex items-center justify-start gap-2 w-full py-4 px-2"
                        >
                            <div className="flex-1 flex items-center justify-start">
                                <ProfilePicture
                                    customSize={120}
                                    customContainerClass="w-[40px] h-[40px]"
                                    customImageClass="w-full h-full object-cover"
                                    overrideSrc
                                    overrideSrcURL={family?.boostCredential?.image}
                                />
                                <p className="text-grayscale-700 ml-2">
                                    {family?.boostCredential?.name}
                                </p>
                            </div>

                            {isSelected && (
                                <div
                                    className={`flex items-center justify-center absolute h-[35px] w-[35px] right-1 rounded-full bg-emerald-600 mr-4`}
                                >
                                    <Checkmark
                                        className={`h-[30px] w-[30px] text-white`}
                                        strokeWidth="4"
                                    />
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>
        </>
    );
};

export default AdminToolsFamilySelector;
