import React from 'react';
import { IonPage, IonSpinner } from '@ionic/react';
import { QRCodeSVG } from 'qrcode.react';

import ModalLayout from 'apps/learn-card-app/src/layout/ModalLayout';
import { ProfilePicture, useCurrentUser } from 'learn-card-base';

import { useInviteLink } from '../../../hooks/useInviteLink';
import * as m from '../../../paraglide/messages.js';

/**
 * QR rendering of the user's personal invite link.
 *
 * Encodes the same `/invite?challenge=…&profileId=…` URL the share sheet hands
 * out, so an in-person scan lands on the same warm page and auto-connects.
 */
const InviteQRCodeModal: React.FC<{ handleCloseModal: () => void }> = ({ handleCloseModal }) => {
    const currentUser = useCurrentUser();
    const { data: invite, isLoading, isError } = useInviteLink({ enabled: true });

    return (
        <IonPage>
            <ModalLayout handleOnClick={handleCloseModal} allowScroll>
                <div className="flex w-full flex-col items-center justify-center">
                    <h1 className="m-0 p-0 font-poppins text-[24px] font-semibold text-grayscale-800">
                        {m['contacts.invite.qrHeading']()}
                    </h1>
                    <p className="m-0 mt-[8px] p-0 font-poppins text-[17px] text-grayscale-600">
                        {m['contacts.invite.qrBody']()}
                    </p>
                </div>

                <div className="mt-[20px] flex w-full items-center justify-center">
                    <ProfilePicture
                        customContainerClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden border-white border-solid border-2 text-white font-medium text-4xl"
                        customImageClass="flex justify-center items-center h-[70px] w-[70px] rounded-full overflow-hidden object-cover border-white border-solid border-2"
                        customSize={500}
                    />
                </div>

                <div className="mt-[10px] flex w-full items-center justify-center">
                    <p className="text-xl font-medium text-grayscale-900">
                        {currentUser?.name || currentUser?.email}
                    </p>
                </div>

                <div className="relative mb-5 mt-5 flex w-full items-center justify-center px-10">
                    {/*
                      `data-invite-url` exposes the encoded value for manual QA
                      and future automation — QRCodeSVG renders paths, so the
                      URL is otherwise unreadable from the DOM.
                    */}
                    <div
                        data-invite-url={invite?.url}
                        className="user-qr-code-modal-qr-wrap relative h-auto w-full max-w-[90%]"
                    >
                        {isLoading && (
                            <div className="flex items-center justify-center py-10">
                                <IonSpinner color="black" />
                            </div>
                        )}
                        {isError && (
                            <p className="py-10 text-center font-poppins text-[15px] text-grayscale-600">
                                {m['contacts.invite.linkFailed']()}
                            </p>
                        )}
                        {invite && (
                            <QRCodeSVG
                                className="h-full w-full"
                                value={invite.url}
                                data-testid="invite-qrcode"
                                bgColor="transparent"
                            />
                        )}
                    </div>
                </div>
            </ModalLayout>
        </IonPage>
    );
};

export default InviteQRCodeModal;
