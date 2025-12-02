import { v4 as uuidv4 } from 'uuid';

import { Pins } from '.';
import { verifyPin } from './read';

export const updatePin = async (
    did: string,
    currentPin: string,
    newPin: string
): Promise<string | boolean> => {
    try {
        // Verify the current PIN
        const isVerified = await verifyPin(did, currentPin);
        if (!isVerified) throw new Error('Current PIN verification failed.');

        // Update the PIN
        await Pins.updateOne({ did }, { $set: { pin: newPin, updatedAt: new Date() } });

        return true;
    } catch (e) {
        console.error(e);
        throw new Error('An unexpected error occured, unable to update PIN');
    }
};

export const generatePinUpdateToken = async (
    did: string
): Promise<{ token: string; tokenExpire: Date } | null> => {
    const token = uuidv4();
    const now = new Date();
    const tokenExpire = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes from now

    const result = await Pins.findOneAndUpdate(
        { did },
        { $set: { token, tokenExpire } },
        { returnDocument: 'after' }
    );

    if (!result) return null;

    return { token, tokenExpire };
};

export const validatePinUpdateToken = async (did: string, token: string): Promise<boolean> => {
    const existingPin = await Pins.findOne({ did });

    if (!existingPin || existingPin.token !== token) return false;

    const now = new Date();
    if (!existingPin.tokenExpire || now > new Date(existingPin.tokenExpire)) {
        return false;
    }

    return true;
};

export const updatePinWithToken = async (
    did: string,
    token: string,
    newPin: string
): Promise<boolean> => {
    try {
        const isValid = await validatePinUpdateToken(did, token);
        if (!isValid) throw new Error('Invalid or expired token.');

        const result = await Pins.updateOne(
            { did },
            {
                $set: {
                    pin: newPin,
                    updatedAt: new Date(),
                },
                $unset: {
                    token: '', // Remove the token
                    tokenExpire: '', // Remove the token expiry
                },
            }
        );

        return result.modifiedCount > 0;
    } catch (error) {
        throw new Error('Failed to update PIN. Please try again.');
    }
};
