import { RecaptchaVerifier } from 'firebase/auth';
import { v4 as uuidv4 } from 'uuid';

declare global {
    interface Window {
        recaptchaVerifier?: any;
        recaptchaWidgetId?: number;
        grecaptcha?: { reset?: (id?: number) => void };
        confirmationResult?: any;
        recaptchaContainerId?: string;
    }
}

const generateContainerId = () => `recaptcha-container-${uuidv4()}`;

export const ensureRecaptcha = async (auth: any) => {
    // Clear any previous instances first
    destroyRecaptcha();

    // Generate a new unique container ID
    const containerId = generateContainerId();
    window.recaptchaContainerId = containerId;

    // Create a new container
    const container = document.createElement('div');
    container.id = containerId;
    container.style.display = 'none';
    document.body.appendChild(container);

    try {
        // Create new recaptcha verifier with the new container ID
        window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
            size: 'invisible',
        });

        window.recaptchaWidgetId = await window.recaptchaVerifier.render();
        return window.recaptchaVerifier;
    } catch (error) {
        console.error('Failed to render reCAPTCHA:', error);
        destroyRecaptcha();
        throw error;
    }
};

export const destroyRecaptcha = () => {
    // Remove the recaptcha container if it exists
    if (window.recaptchaContainerId) {
        const container = document.getElementById(window.recaptchaContainerId);
        if (container) container.remove();
        window.recaptchaContainerId = undefined;
    }

    // Clear recaptcha verifier if it exists
    if (window.recaptchaVerifier) {
        try {
            window.recaptchaVerifier.clear();
        } catch (error) {
            console.debug('Error clearing recaptchaVerifier:', error);
        }
        window.recaptchaVerifier = undefined;
    }

    // Reset grecaptcha widget if it exists
    if (window.recaptchaWidgetId !== undefined) {
        try {
            window.grecaptcha?.reset?.(window.recaptchaWidgetId);
        } catch (error) {
            console.debug('Error resetting grecaptcha:', error);
        }
        window.recaptchaWidgetId = undefined;
    }

    // Clear confirmation result
    window.confirmationResult = undefined;

    // Remove any leftover recaptcha iframes
    const iframes = document.getElementsByTagName('iframe');
    for (let i = iframes.length - 1; i >= 0; i--) {
        if (iframes[i].src.includes('recaptcha')) {
            iframes[i].parentNode?.removeChild(iframes[i]);
        }
    }
};
