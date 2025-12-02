export type AddressSpec = {
    streetAddress?: string | undefined,
    addressLocality?: string | undefined,
    addressRegion?: string | undefined,
    addressCountry?: string | undefined,
    postalCode?: string | undefined,
    geo?: {
        latitude?: number | undefined;
        longitude?: number | undefined;
    }
}

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