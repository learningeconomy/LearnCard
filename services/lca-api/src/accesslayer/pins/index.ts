import { PINS_COLLECTION, MongoPinType } from '@models';
import mongodb from '@mongo';

export const getPinsCollection = () => {
    return mongodb.collection<MongoPinType>(PINS_COLLECTION);
};

export const Pins = getPinsCollection();
