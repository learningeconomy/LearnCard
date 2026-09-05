import { TRPCError } from '@trpc/server';
import { InstitutionTypeEnum, LCNOrganizationDetails } from '@learncard/types';

type OrganizationProfileInput = {
    type?: string;
    organization?: LCNOrganizationDetails;
};

type OrganizationSummaryInput = {
    institutionType: unknown;
    addressLocality: unknown;
    addressRegion: unknown;
    addressCountry: unknown;
};

// ADR-001 §4 amendment: Profile.type is the coarse kind; institutionType refines institutions only.
export const assertOrganizationInvariants = (input: OrganizationProfileInput): void => {
    if (!input.organization) return;

    if (input.type !== 'institution' && input.type !== 'employer') {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'organization metadata is only valid for institution/employer profiles',
        });
    }

    if (input.type === 'employer' && input.organization.institutionType) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'institutionType is only valid for institution profiles',
        });
    }
};

const nonEmptyString = (value: unknown): string | undefined =>
    typeof value === 'string' && value.trim().length > 0 ? value : undefined;

export const organizationDetailsFromSummary = (
    input: OrganizationSummaryInput
): LCNOrganizationDetails | undefined => {
    const parsedInstitutionType = InstitutionTypeEnum.safeParse(input.institutionType);
    const institutionType = parsedInstitutionType.success ? parsedInstitutionType.data : undefined;
    const addressLocality = nonEmptyString(input.addressLocality);
    const addressRegion = nonEmptyString(input.addressRegion);
    const addressCountry = nonEmptyString(input.addressCountry);
    const hasAddress = Boolean(addressLocality || addressRegion || addressCountry);

    if (!institutionType && !hasAddress) return undefined;

    return {
        ...(institutionType ? { institutionType } : {}),
        ...(hasAddress
            ? {
                  address: {
                      type: 'PostalAddress' as const,
                      ...(addressLocality ? { addressLocality } : {}),
                      ...(addressRegion ? { addressRegion } : {}),
                      ...(addressCountry ? { addressCountry } : {}),
                  },
              }
            : {}),
    };
};
