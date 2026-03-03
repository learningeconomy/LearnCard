// updates the background of the IonModal container to the provided image
// via a css variable
export const setIonicModalBackground = (backgroundImage: string | undefined) => {
    if (backgroundImage) {
        document.documentElement.style.setProperty(
            '--modal-bg',
            `url(${backgroundImage})`,
            'important'
        );
        document.documentElement.style.setProperty('--modal-backdrop-opacity', `0`, 'important');
    }

    return;
};

// resets the background of the IonModal container to the default rgb value
export const resetIonicModalBackground = () => {
    document.documentElement.style.setProperty('--modal-bg', 'rgb(73, 85, 109, 0.4)', 'important');
    document.documentElement.style.setProperty('--modal-backdrop-opacity', '0.25', 'important');

    return;
};
