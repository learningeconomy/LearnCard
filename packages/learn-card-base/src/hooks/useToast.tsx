import { toastStore } from 'learn-card-base/stores/toastStore';

export enum ToastTypeEnum {
    Success = 'success',
    Error = 'error',
}

export const useToast = () => {
    const presentToast = toastStore.set.presentToast;
    const dismissToast = toastStore.set.dismissToast;

    return { presentToast, dismissToast };
};
