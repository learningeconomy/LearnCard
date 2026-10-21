import { toastStore } from '../stores/toastStore';

export { ToastTypeEnum } from '../stores/toastStore';

export const useToast = () => {
    const presentToast = toastStore.set.presentToast;
    const dismissToast = toastStore.set.dismissToast;

    return { presentToast, dismissToast };
};
