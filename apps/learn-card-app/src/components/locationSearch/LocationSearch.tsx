import React, { useState } from 'react';
import Lottie from 'react-lottie-player';

import useGoogle from 'react-google-autocomplete/lib/usePlacesAutocompleteService';

import {
    IonCol,
    IonContent,
    IonGrid,
    IonHeader,
    IonInput,
    IonPage,
    IonRow,
    IonToolbar,
} from '@ionic/react';
import GoogleLogo from 'learn-card-base/assets/images/google-logo.png';
import X from 'learn-card-base/svgs/X';

const HourGlass = '/lotties/hourglass.json';

import { AddressSpec, formatLocationObject } from './location.helpers';

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const LocationSearch: React.FC<{
    showCloseButton?: boolean;
    handleLocationStateChange: (locaton: AddressSpec) => void;
    handleCloseModal: () => void;
}> = ({ showCloseButton = false, handleLocationStateChange, handleCloseModal }) => {
    const [locationSearch, setLocationSearch] = useState<string>('');

    const { placePredictions, getPlacePredictions, isPlacePredictionsLoading, placesService } =
        useGoogle({
            apiKey: GOOGLE_MAPS_API_KEY,
            debounce: 500,
            sessionToken: true,
        });

    const handleLocationSelect = (placeId: string) => {
        placesService?.getDetails(
            {
                placeId: placeId,
            },
            (placeDetails: any) => {
                const address: AddressSpec = formatLocationObject(placeDetails);
                handleLocationStateChange(address);
                handleCloseModal();
            }
        );
    };

    const noSearchResults =
        (!isPlacePredictionsLoading &&
            locationSearch?.length > 0 &&
            placePredictions.length === 0) ||
        (!isPlacePredictionsLoading &&
            locationSearch?.length === 0 &&
            placePredictions.length === 0);

    return (
        <IonPage className="bg-white">
            <IonHeader className="learn-card-header ion-no-border my-[0px]">
                <IonToolbar className="ion-no-border bg-white " color="white">
                    <IonGrid className="bg-white">
                        <IonRow className="w-full flex items-center justify-center">
                            <IonRow className="flex flex-col w-full max-w-[600px]">
                                {showCloseButton && (
                                    <IonCol className="flex flex-1 justify-end items-center">
                                        <button onClick={handleCloseModal}>
                                            <X className="text-grayscale-600 h-6 w-6" />
                                        </button>
                                    </IonCol>
                                )}

                                <div className="flex items-center justify-start w-full mt-4">
                                    <IonInput
                                        autocapitalize="on"
                                        placeholder="Enter your location..."
                                        value={locationSearch}
                                        className="bg-grayscale-100 text-grayscale-800 rounded-[15px] ion-padding font-medium tracking-widest text-base"
                                        onIonInput={e => {
                                            setLocationSearch(e?.detail?.value);
                                            getPlacePredictions({ input: e?.detail?.value });
                                        }}
                                        type="text"
                                    />
                                </div>
                            </IonRow>
                        </IonRow>
                    </IonGrid>
                </IonToolbar>
            </IonHeader>
            <IonContent fullscreen>
                <section className="relative flex flex-col items-center justify-center w-full">
                    <ul className="flex flex-col items-start justify-center w-full max-w-[600px]">
                        {isPlacePredictionsLoading && (
                            <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full ">
                                <div className="max-w-[150px]">
                                    <Lottie
                                        loop
                                        path={HourGlass}
                                        play
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                </div>
                            </section>
                        )}

                        {!isPlacePredictionsLoading &&
                            placePredictions?.length > 0 &&
                            placePredictions.map(place => {
                                return (
                                    <li
                                        onClick={() => handleLocationSelect(place?.place_id)}
                                        className="text-left flex items-start justify-center w-full"
                                    >
                                        <button className="border-b-2 border-solid border-grayscale-100 text-left w-[90%] py-4 font-medium text-base">
                                            {place.description}
                                        </button>
                                    </li>
                                );
                            })}

                        {noSearchResults && (
                            <section className="relative loading-spinner-container flex flex-col items-center justify-center h-[80%] w-full">
                                <div className="max-w-[200px] m-auto mt-4"></div>
                                <p className="font-bold text-grayscale-800 mt-[20px]">
                                    No search results yet
                                </p>
                            </section>
                        )}
                    </ul>
                </section>
                <div className="absolute bottom-[5px] right-[15px] flex items-center justify-center text-grayscale-500">
                    powered by <img src={GoogleLogo} className="ml-1 h-[20px]" />
                </div>
            </IonContent>
        </IonPage>
    );
};

export default LocationSearch;
