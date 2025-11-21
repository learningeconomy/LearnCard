import { z } from 'zod';
import { calculateAge } from 'learn-card-base/helpers/dateHelpers';

export const StateValidator = z.object({
    name: z
        .string()
        .nonempty(' Name is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(30, ' Must contain at most 30 character(s).')
        .regex(/^[A-Za-z0-9 ]+$/, ' Alpha numeric characters(s) only'),
    dob: z
        .string()
        .nonempty(' Date of birth is required.')
        .refine(dob => !Number.isNaN(calculateAge(dob)) && calculateAge(dob) >= 13, {
            message: ' You must be at least 13 years old.',
        }),
    country: z.string().nonempty(' Country is required.'),
});

export const ProfileIDStateValidator = z.object({
    profileId: z
        .string()
        .nonempty(' User ID is required.')
        .min(3, ' Must contain at least 3 character(s).')
        .max(25, ' Must contain at most 25 character(s).')
        .regex(/^[a-zA-Z0-9-]+$/, ` Alpha numeric characters(s) and dashes '-' only, no spaces allowed.`),
});

export const DobValidator = StateValidator.pick({ dob: true });
