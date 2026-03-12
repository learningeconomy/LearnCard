import { Query, QueryClient } from '@tanstack/react-query';
import { RESUME_SECTIONS } from './resume-builder.helpers';

const RESUME_SECTION_KEY_SET = new Set(RESUME_SECTIONS.map(section => section.key));

const isResumeBuilderCredentialQuery = (query: Query): boolean => {
    const [queryName, , category] = query.queryKey;

    if (queryName !== 'useGetCredentials' && queryName !== 'useGetCredentialList') return false;
    if (typeof category !== 'string') return false;

    return RESUME_SECTION_KEY_SET.has(category as (typeof RESUME_SECTIONS)[number]['key']);
};

export const invalidateResumeBuilderCredentialQueries = async (
    queryClient: QueryClient
): Promise<void> => {
    await queryClient.invalidateQueries({
        predicate: isResumeBuilderCredentialQuery,
    });
};
