import { z } from 'zod';
import * as m from '../../../../paraglide/messages.js';

export const getPinValidator = () =>
    z.object({
        pin: z.array(z.string()).length(5, m['family.pinModal.requiresFiveDigits']()),
    });

export const getConfirmPinValidator = () =>
    z
        .object({
            pin: z.array(z.string()).length(5, m['family.pinModal.requiresFiveDigits']()),
            confirmPin: z.array(z.string()).length(5, ' '),
        })
        .refine(data => data.pin.join('') === data.confirmPin.join(''), {
            message: m['arabicFixes.pinMustMatch'](),
            path: ['confirmPin'],
        });

export const getExistingPinValidator = () =>
    z
        .object({
            pin: z.array(z.string()).length(5, m['family.pinModal.requiresFiveDigits']()),
            confirmPin: z.array(z.string()).length(5, ' '),
        })
        .refine(data => data.pin.join('') === data.confirmPin.join(''), {
            message: m['family.pinModal.invalidPin'](),
            path: ['confirmPin'],
        });
