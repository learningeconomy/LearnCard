import React from 'react';

import OnboardingRoleItem from './OnboardingRoleItem';

import { LearnCardRolesEnum, LearnCardRoles } from '../onboarding.helpers';

export const OnboardingRoles = ({
    role,
    setRole,
}: {
    role: LearnCardRolesEnum | null;
    setRole: (role: LearnCardRolesEnum) => void;
}) => {
    return (
        <ul className="w-full flex flex-col items-center gap-[10px]">
            {LearnCardRoles.map(r => {
                return <OnboardingRoleItem key={r.id} role={role} setRole={setRole} roleItem={r} />;
            })}
        </ul>
    );
};

export default OnboardingRoles;
