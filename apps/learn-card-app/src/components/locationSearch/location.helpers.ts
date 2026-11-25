export type AddressSpec = {
    streetAddress?: string | undefined;
    addressLocality?: string | undefined;
    addressRegion?: string | undefined;
    addressCountry?: string | undefined;
    postalCode?: string | undefined;
    geo?: {
        latitude?: number | undefined;
        longitude?: number | undefined;
    };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- existing loose type; tightening it is a typing change, out of scope for this lint-only PR
export const formatLocationObject = (placeDetails: any): AddressSpec => {
    const cityComponent = placeDetails.address_components.find(component =>
        component.types.includes('locality')
    );
    const stateComponent = placeDetails.address_components.find(component =>
        component.types.includes('administrative_area_level_1')
    );
    const countryComponent = placeDetails.address_components.find(component =>
        component.types.includes('country')
    );
    const postalComponent = placeDetails.address_components.find(component =>
        component.types.includes('postal_code')
    );
    const geo = {
        latitude: placeDetails?.geometry?.location?.lat(),
        longitude: placeDetails?.geometry?.location?.lng(),
    };

    return {
        streetAddress: placeDetails.formatted_address ?? '',
        addressLocality: cityComponent?.short_name ?? '',
        addressRegion: stateComponent?.short_name ?? '',
        addressCountry: countryComponent?.short_name ?? '',
        postalCode: postalComponent?.short_name ?? '',
        geo,
    };
};
