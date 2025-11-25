import React, { useEffect, useRef } from 'react';

import { IonList, IonSpinner } from '@ionic/react';
import AddressBookContactItem from './AddressBookContactItem';

import { LCNProfile, VC } from '@learncard/types';
import useOnScreen from 'learn-card-base/hooks/useOnScreen';

export const AddressBookContactList: React.FC<{
    pages?: any[];
    hasNextPage?: boolean;
    fetchNextPage?: () => void;
    isFetching?: boolean;
    contacts: LCNProfile[];
    showBoostButton?: boolean;
    showRequestButton?: boolean;
    showDeleteButton?: boolean;
    handleRemoveConnection?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showAcceptButton?: boolean;
    showCancelButton?: boolean;
    showBlockButton: boolean;
    handleBlockUser?: (
        e: React.MouseEvent<HTMLButtonElement, MouseEvent>,
        profileId: string
    ) => void;
    showUnblockButton: boolean;
    search: string;
    setConnectionCount: React.Dispatch<React.SetStateAction<number>>;
    showArrow?: boolean;
    resolvedCredential?: VC;
}> = ({
    pages,
    hasNextPage,
    fetchNextPage,
    isFetching,
    contacts,
    showBoostButton = true,
    showRequestButton = false,
    showDeleteButton = false,
    handleRemoveConnection = () => {},
    showAcceptButton = false,
    showCancelButton = false,
    showBlockButton = false,
    handleBlockUser = () => {},
    showUnblockButton = false,
    search,
    setConnectionCount,
    showArrow = false,
    resolvedCredential,
}) => {
    const infiniteScrollRef = useRef<HTMLDivElement>(null);

    const onScreen = useOnScreen(infiniteScrollRef as any, '-100px', [pages?.[0]?.records?.length]);

    useEffect(() => {
        if (onScreen && hasNextPage) fetchNextPage?.();
    }, [fetchNextPage, hasNextPage, onScreen, infiniteScrollRef]);

    const contactItems = contacts?.map((contact, index) => {
        return (
            <AddressBookContactItem
                showBoostButton={showBoostButton}
                showRequestButton={showRequestButton}
                showDeleteButton={showDeleteButton}
                handleRemoveConnection={handleRemoveConnection}
                showAcceptButton={showAcceptButton}
                showCancelButton={showCancelButton}
                showBlockButton={showBlockButton}
                handleBlockUser={handleBlockUser}
                showUnblockButton={showUnblockButton}
                contact={contact}
                key={index}
                search={search}
                setConnectionCount={setConnectionCount}
                showArrow={showArrow}
                resolvedCredential={resolvedCredential}
            />
        );
    });

    if (!pages) {
        return (
            <IonList lines="none" className="flex flex-col items-center justify-center w-[100%]">
                {contactItems}
            </IonList>
        );
    }

    return (
        <IonList lines="none" className="flex flex-col items-center justify-center w-[100%]">
            {pages?.flatMap(page => (
                <>
                    {page?.records?.map((record, index) => (
                        <AddressBookContactItem
                            showBoostButton={showBoostButton}
                            showRequestButton={showRequestButton}
                            showDeleteButton={showDeleteButton}
                            handleRemoveConnection={handleRemoveConnection}
                            showAcceptButton={showAcceptButton}
                            showCancelButton={showCancelButton}
                            showBlockButton={showBlockButton}
                            handleBlockUser={handleBlockUser}
                            showUnblockButton={showUnblockButton}
                            contact={record}
                            key={index}
                            search={search}
                            setConnectionCount={setConnectionCount}
                            showArrow={showArrow}
                            resolvedCredential={resolvedCredential}
                        />
                    ))}
                </>
            ))}
            <div role="presentation" ref={infiniteScrollRef} />
            {isFetching && (
                <div className="w-full flex items-center justify-center">
                    <IonSpinner
                        name="crescent"
                        color="grayscale-900"
                        className="scale-[2] mb-8 mt-6"
                    />
                </div>
            )}
        </IonList>
    );
};

export default AddressBookContactList;
