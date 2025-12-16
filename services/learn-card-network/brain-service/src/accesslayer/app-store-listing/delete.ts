import { AppStoreListing } from '@models';

export const deleteAppStoreListing = async (listingId: string): Promise<void> => {
    await AppStoreListing.delete({ detach: true, where: { listing_id: listingId } });
};
