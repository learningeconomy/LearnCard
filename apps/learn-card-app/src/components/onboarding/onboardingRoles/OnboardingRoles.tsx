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
    const visibleRoles = LearnCardRoles.filter(r => r.type !== LearnCardRolesEnum.counselor);

    return (
        <ul className="w-full flex flex-col items-center gap-[10px]">
            {visibleRoles.map(r => (
                <OnboardingRoleItem key={r.id} role={role} setRole={setRole} roleItem={r} />
            ))}
        </ul>
    );
};

export default OnboardingRoles;
