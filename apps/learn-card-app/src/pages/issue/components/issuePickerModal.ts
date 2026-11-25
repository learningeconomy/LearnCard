import { ModalTypes } from 'learn-card-base';

export const ISSUE_PICKER_MODAL_LAYOUT = [
    {
        sectionClassName:
            'flex flex-col overflow-hidden! bg-white! desktop:h-[80%]! desktop:max-h-full! desktop:max-w-[560px]!',
    },
    { mobile: ModalTypes.FullScreen, desktop: ModalTypes.Center },
] as const;
