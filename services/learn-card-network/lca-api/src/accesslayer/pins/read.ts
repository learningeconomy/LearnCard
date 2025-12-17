import { MongoPinType } from '@models';
import { Pins } from '.';

// lookup pin
export const getPinForDid = async (did: string): Promise<MongoPinType | null> => {
    try {
        const pin = await Pins.findOne({ did });
        return pin;
    } catch (e) {
        console.error(e);
        throw new Error(`Failed to get PIN for user with DID: ${did}`);
    }
};

export const didHasPin = async (did: string): Promise<boolean> => {
    try {
        const pinExists = await Pins.findOne({ did });
        if (!pinExists) return false;
        return true;
    } catch (e) {
        console.error(e);
        return false;
    }
};

// check if the pin entered is valid
export const verifyPin = async (did: string, pin: string): Promise<boolean | null> => {
    try {
        const existingPin = await Pins.findOne({ did, pin });
        return !!existingPin;
    } catch (e) {
        console.error(e);
        throw new Error(`An unexpected error occured, unable to verify PIN`);
    }
};
