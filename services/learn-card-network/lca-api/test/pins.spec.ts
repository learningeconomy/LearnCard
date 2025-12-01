import { Pins } from '@accesslayer/pins';
import { getUser } from './helpers/getClient';

import { client } from '@mongo';
import { didHasPin, getPinForDid, verifyPin } from '@accesslayer/pins/read';
import {
    generatePinUpdateToken,
    updatePin,
    updatePinWithToken,
    validatePinUpdateToken,
} from '@accesslayer/pins/update';

let userA: Awaited<ReturnType<typeof getUser>>;

beforeAll(async () => {
    try {
        await client.connect();
    } catch (error) {
        console.error(error);
    }
});

afterAll(async () => {
    try {
        await client.close();
    } catch (error) {
        console.error(error);
    }
});

describe('Pins', () => {
    let did: string;
    let pin: string;

    beforeAll(async () => {
        userA = await getUser();
    });

    beforeEach(async () => {
        await Pins.deleteMany({});
        did = userA.learnCard.id.did();
        pin = '12345';
    });

    const createTestPin = async (pin: string) => {
        await expect(
            userA.clients.fullAuth.pins.createPin({
                pin,
            })
        ).resolves.not.toThrow();
    };

    describe('create Pin', () => {
        it('should allow you to create a pin', async () => {
            await createTestPin(pin);
        });

        it('should prevent you from creating a pin, if one already exists', async () => {
            await createTestPin(pin);

            await expect(
                userA.clients.fullAuth.pins.createPin({
                    pin,
                })
            ).rejects.toThrow('An unexpected error occured, unable to create PIN');
        });
    });

    describe('Get Pin', () => {
        const did2 = 'aaaaaa';
        it('Get Pin for DID', async () => {
            await createTestPin(pin);
            const result = await getPinForDid(did);

            expect(result?.pin).toEqual(pin);
        });

        it('Return null for non existing DID with PIN', async () => {
            const result = await getPinForDid(did2);
            expect(result).toBeNull();
        });
    });

    describe('Pin exists', () => {
        it('DID has pin', async () => {
            await createTestPin(pin);
            const result = await didHasPin(did);

            expect(result).toBeTruthy();
        });

        it("DID doesn't have pin", async () => {
            const result = await didHasPin(did);

            expect(result).toBeFalsy();
        });
    });

    describe('Verify Pin', () => {
        it('Verify PIN successfully', async () => {
            await createTestPin(pin);

            expect(await verifyPin(did, pin)).toBeTruthy();
        });

        it('Fails to verify PIN', async () => {
            await createTestPin(pin);

            await expect(
                userA.clients.fullAuth.pins.verifyPin({
                    pin: '22222',
                })
            ).rejects.toThrow('An unexpected error occured, unable to verify PIN');
        });
    });

    describe('Update Pin', () => {
        it('Update PIN successfully', async () => {
            await createTestPin(pin);
            const newPin = '55555';

            await updatePin(did, pin, newPin);

            const result = await getPinForDid(did);

            expect(result?.pin).toEqual(newPin);
        });

        it('Fails to update PIN', async () => {
            await createTestPin(pin);

            expect(updatePin(did, '22222', '55555')).rejects.toThrow(
                'An unexpected error occured, unable to update PIN'
            );
        });
    });

    describe('Pin tokens', () => {
        it('Generate token for pin', async () => {
            await createTestPin(pin);

            const pinToken = await generatePinUpdateToken(did);

            const result = await getPinForDid(did);

            expect(pinToken?.token).toEqual(result?.token);
        });

        it('Fails to generate token for pin', async () => {
            const result = await getPinForDid(did);

            expect(result).toBeNull();
        });

        it('Validate pin update token', async () => {
            await createTestPin(pin);
            const pinToken = await generatePinUpdateToken(did);
            const token = pinToken?.token ?? '';
            const result = await validatePinUpdateToken(did, token);
            expect(result).toBeTruthy();
        });

        it('Fails to validate pin update token', async () => {
            await createTestPin(pin);
            await generatePinUpdateToken(did);
            const token = '';
            const result = await validatePinUpdateToken(did, token);
            expect(result).toBeFalsy();
        });

        it('Updates pin with update token', async () => {
            await createTestPin(pin);
            const pinToken = await generatePinUpdateToken(did);
            const token = pinToken?.token ?? '';
            const newPin = '55555';
            const result = await updatePinWithToken(did, token, newPin);
            expect(result).toBeTruthy();
        });

        it('Fails to update pin with update token', async () => {
            await createTestPin(pin);
            await generatePinUpdateToken(did);
            const newPin = '55555';

            await expect(updatePinWithToken(did, '', newPin)).rejects.toThrow(
                'Failed to update PIN. Please try again.'
            );
        });
    });
});
