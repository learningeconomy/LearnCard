import React from 'react';
import { IonContent, IonPage } from '@ionic/react';

import { BrandingEnum } from 'learn-card-base';
import MyLearnCardModal from '../../components/learncard/MyLearnCardModal';
import GenericErrorBoundary from '../../components/generic/GenericErrorBoundary';

/**
 * `/profile` route — the current user's "My LearnCard" profile/settings view.
 *
 * Renders the same content as the former Settings/avatar modal
 * (`MyLearnCardModal`), but as a first-class route so it lays out in the
 * content area beside the side menu on desktop and full-screen on mobile,
 * rather than as an overlay. The modal-only Share/X/Close footer is omitted
 * via `hideShare` + `hideFooter`; navigation away is handled by the
 * persistent side menu (desktop) and bottom nav (mobile).
 *
 * Sub-actions (My Account, Email Addresses, etc.) still open as modals on top
 * of this page — that behavior is unchanged.
 */
const ProfilePage: React.FC = () => {
    return (
        <IonPage>
            <IonContent fullscreen>
                <GenericErrorBoundary>
                    <MyLearnCardModal branding={BrandingEnum.learncard} hideShare hideFooter />
                </GenericErrorBoundary>
            </IonContent>
        </IonPage>
    );
};

export default ProfilePage;
