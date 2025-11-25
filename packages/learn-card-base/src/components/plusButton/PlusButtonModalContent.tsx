import React from 'react';
import { useHistory } from 'react-router-dom';

import {
    IonCol,
    IonContent,
    IonRow,
    IonList,
    IonToolbar,
    IonFooter,
    IonItem,
    IonHeader,
    IonPage,
} from '@ionic/react';
import X from 'learn-card-base/svgs/X';

const PlusButtonModalContent: React.FC<{
    handleCloseModal: () => void;
    showFixedFooter?: boolean;
    showCloseButton?: boolean;
    title?: String | React.ReactNode;
    footer?: React.ReactNode;
}> = ({ handleCloseModal, showCloseButton = true, title, showFixedFooter = false, footer }) => {
    const history = useHistory();

    const plusButtonLinks = [
        {
            id: 1,
            title: 'Sync My School',
            onClick: () => {
                handleCloseModal();
                history.push('/sync-my-school');
            },
        },
    ];

    const fixedFooterStyles = showFixedFooter ? 'absolute bottom-[25%] left-0 w-full' : '';

    return (
        <IonPage>
            <IonHeader className="ion-no-border">
                <IonRow className="w-full bg-white">
                    <IonCol className="w-full flex items-center justify-end">
                        {showCloseButton && (
                            <button onClick={handleCloseModal}>
                                <X className="text-grayscale-600 h-8 w-8" />
                            </button>
                        )}
                    </IonCol>
                </IonRow>
                {title && <IonToolbar>{title}</IonToolbar>}
            </IonHeader>
            <IonContent>
                <IonList lines="none">
                    {plusButtonLinks.map(link => (
                        <IonItem className="w-full" key={link.id}>
                            <button
                                className="w-full flex items-center justify-center px-[15px] my-[10px] font-medium text-lg"
                                onClick={link.onClick}
                            >
                                {link.title}
                            </button>
                        </IonItem>
                    ))}
                </IonList>
            </IonContent>
            {footer && (
                <IonFooter className={fixedFooterStyles}>
                    <IonToolbar>{footer}</IonToolbar>
                </IonFooter>
            )}
        </IonPage>
    );
};

export default PlusButtonModalContent;
