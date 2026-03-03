import { z } from 'zod';

export const pinValidator = z.object({
    pin: z.array(z.string()).length(5, 'Pin requires 5 digits'),
});

export const confirmPinValidator = z
    .object({
        pin: z.array(z.string()).length(5, 'Pin requires 5 digits'),
        confirmPin: z.array(z.string()).length(5, ' '),
    })
    .refine(data => data.pin.join('') === data.confirmPin.join(''), {
        message: 'Pin must match',
        path: ['confirmPin'],
    });

export const existingPinValidator = z
    .object({
        pin: z.array(z.string()).length(5, 'Pin requires 5 digits'),
        confirmPin: z.array(z.string()).length(5, ' '),
    })
    .refine(data => data.pin.join('') === data.confirmPin.join(''), {
        message: 'Invalid PIN. Please try again',
        path: ['confirmPin'],
    });
