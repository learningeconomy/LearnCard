import React from 'react';
import {
    CredentialCategoryEnum,
    useGetCredentialList,
    useGetResolvedCredential,
} from 'learn-card-base';

export const useGetFamilyCredential = () => {
    const { data: familyCredentials, isLoading: credListLoading } = useGetCredentialList(
        CredentialCategoryEnum.family
    );
    const familyCredentialInfo = familyCredentials?.pages?.[0]?.records?.[0]; // Assume only one family

    const { data: familyCredential, isLoading: credLoading } = useGetResolvedCredential(
        familyCredentialInfo?.uri
    );

    return { familyCredential, isLoading: credListLoading || credLoading };
};

export default useGetFamilyCredential;
