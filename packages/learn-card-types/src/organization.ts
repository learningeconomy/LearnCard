import { z } from 'zod/v4';

import { AddressValidator } from './vc';

export const InstitutionTypeEnum = z.enum([
    'preschool',
    'primary_school',
    'secondary_school',
    'college',
    'university',
]);
export type InstitutionType = z.infer<typeof InstitutionTypeEnum>;

export const OrganizationAddressValidator = AddressValidator.pick({
    type: true,
    addressCountry: true,
    addressCountryCode: true,
    addressRegion: true,
    addressLocality: true,
    streetAddress: true,
    postOfficeBoxNumber: true,
    postalCode: true,
})
    .extend({ type: z.literal('PostalAddress') })
    .refine(
        ({ type: _type, ...rest }) =>
            Object.values(rest).some(value => typeof value === 'string' && value.trim().length > 0),
        { message: 'Address must contain at least one address field.' }
    );
export type OrganizationAddress = z.infer<typeof OrganizationAddressValidator>;

export const LCNOrganizationDetailsValidator = z.object({
    institutionType: InstitutionTypeEnum.optional().describe(
        'Primary institutional category. Valid only when Profile.type is "institution". Self-asserted; grants no trust or authorization.'
    ),
    address: OrganizationAddressValidator.optional().describe(
        'Self-asserted primary/mailing address; not proof of legal location.'
    ),
});
export type LCNOrganizationDetails = z.infer<typeof LCNOrganizationDetailsValidator>;
