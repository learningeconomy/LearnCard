import React, { Suspense, useEffect } from 'react';
import { IonSpinner } from '@ionic/react';

import { ModalTypes, lazyWithRetry, useModal } from 'learn-card-base';
import { AppContent, AppPage } from '../../../components/chrome';

// The skill-profile wizard statically reaches the framework editor and its emoji picker (~1 MB
// with deps); loading it lazily keeps all of that out of the dashboard's cold-start chunk.
const SkillProfileModal = lazyWithRetry(() => import('../components/SkillProfileModal'));

const IDLE_PRELOAD_DELAY_MS = 3000;

const SkillProfileModalFallback: React.FC = () => (
    <AppPage>
        <AppContent>
            <div className="font-poppins flex items-center justify-center min-h-[360px] p-8">
                <IonSpinner name="crescent" className="text-grayscale-700" />
            </div>
        </AppContent>
    </AppPage>
);

export const useSkillProfileModal = () => {
    const { newModal, closeModal } = useModal({
        mobile: ModalTypes.Right,
        desktop: ModalTypes.Right,
    });

    // Warm the wizard once the dashboard has settled, so opening it rarely shows the spinner.
    useEffect(() => {
        const timer = setTimeout(() => void SkillProfileModal.preload(), IDLE_PRELOAD_DELAY_MS);
        return () => clearTimeout(timer);
    }, []);

    const openSkillProfile = () => {
        newModal(
            <Suspense fallback={<SkillProfileModalFallback />}>
                <SkillProfileModal onClose={closeModal} />
            </Suspense>,
            {
                hideButton: true,
                sectionClassName: 'max-w-[640px]!',
            }
        );
    };

    return { openSkillProfile };
};

export default useSkillProfileModal;
