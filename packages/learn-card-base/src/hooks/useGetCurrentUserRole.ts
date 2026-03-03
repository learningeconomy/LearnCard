import React from 'react';

import { useGetCurrentLCNUser } from './useGetCurrentLCNUser';

export const useGetCurrentUserRole = () => {
    const { currentLCNUser } = useGetCurrentLCNUser();

    return currentLCNUser?.role ?? null;
};

export default useGetCurrentUserRole;
