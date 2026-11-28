import React from 'react';
import { AppIcon } from 'learn-card-base/ui/icon';
import { codeSlashOutline } from 'learn-card-base/icons/ionicons';
import { useHistory } from 'react-router-dom';
import { ModalTypes, switchedProfileStore, useGetProfile, useModal } from 'learn-card-base';

import { LearnCardRolesEnum } from '../onboarding/onboarding.helpers';
import * as m from '../../paraglide/messages.js';
import DeveloperRoleConfirmation from './DeveloperRoleConfirmation';

const ProfileDeveloperProgram: React.FC = () => {
    const { data: profile, isPending, isError } = useGetProfile();
    const profileType = switchedProfileStore.use.profileType();
    const history = useHistory();
    const { closeAllModals, newModalWithToken, forceCloseModalByToken } = useModal();
    const isDeveloper =
        profile && 'role' in profile && profile.role === LearnCardRolesEnum.developer;

    const handleOpenProgram = (): void => {
        closeAllModals();
        history.push('/app-store/developer');
    };

    const handleBecomeDeveloper = (): void => {
        if (switchedProfileStore.get.profileType() === 'child' || profile?.type === 'child') return;
        // Shared with the dialog: block duplicate submits synchronously and native dismissal while saving.
        const saving = { current: false };
        const token = newModalWithToken(
            <DeveloperRoleConfirmation
                saving={saving}
                onClose={() => forceCloseModalByToken(token)}
            />,
            {
                className: '[--lc-gutter:24px] [&:is(aside)]:h-dvh! [&:is(aside)]:px-6!',
                sectionClassName:
                    'w-full! max-w-[420px]! max-h-full! [&:is(#center-modal>section)]:p-0! rounded-[20px]! shadow-[0_16px_48px_rgb(24_34_78/0.16)]!',
                onClose: () => !saving.current,
            },
            { desktop: ModalTypes.Center, mobile: ModalTypes.Center }
        );
    };

    if (profileType === 'child' || profile?.type === 'child' || isPending || isError || !profile) {
        return null;
    }

    return (
        <div className="w-full rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur-[10px] font-poppins">
            {!isDeveloper && (
                <div className="mb-4">
                    <h2 className="mb-1 text-base font-semibold text-grayscale-900">
                        {m['launchpad.becomeAnApp.developerProgram']()}
                    </h2>
                    <p className="text-sm text-grayscale-600 leading-relaxed">
                        {m['profile.developerProgram.invitation']()}
                    </p>
                </div>
            )}
            <button
                type="button"
                onClick={isDeveloper ? handleOpenProgram : handleBecomeDeveloper}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-[20px] bg-grayscale-900 text-white font-medium text-sm hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
            >
                <AppIcon icon={codeSlashOutline} aria-hidden="true" className="shrink-0 text-lg" />
                {isDeveloper
                    ? m['launchpad.becomeAnApp.developerProgram']()
                    : m['profile.developerProgram.chooseRole']()}
            </button>
        </div>
    );
};

export default ProfileDeveloperProgram;
