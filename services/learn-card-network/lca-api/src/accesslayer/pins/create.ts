import { MongoPinValidator } from '@models';
import { Pins } from '.';
import { v4 as uuidv4 } from 'uuid';
import { getPinForDid } from './read';

export const createPin = async (did: string, pin: string): Promise<string | boolean> => {
    try {
        const validation = MongoPinValidator.safeParse({
            _id: uuidv4(),
            did: did,
            pin: pin,
            createdAt: new Date(),
            updatedAt: new Date(),
        });

        if (!validation.success) {
            throw new Error(
                `Validation failed: ${validation.error.errors.map(e => e.message).join(', ')}`
            );
        }

        const existingPin = await getPinForDid(did);
        if (existingPin) {
            throw new Error(`A PIN already exists for the user with DID: ${did}`);
        }

        await Pins.insertOne(validation.data);
        return true;
    } catch (e) {
        console.error(e);
        throw new Error('An unexpected error occured, unable to create PIN');
    }
};
