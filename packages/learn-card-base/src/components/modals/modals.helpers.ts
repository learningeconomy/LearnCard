/* eslint-disable import/prefer-default-export */
import CenterModal from './CenterModal';
import CancelModal from './CancelModal';
import { SelectModal } from './CancelModal';
import FreeformModal from './FreeformModal';
import RightModal from './RightModal';
import FullScreenModal from './FullScreenModal';

import { ModalContainer, ModalTypes } from './types/Modals';

export const MODALS: Record<Exclude<ModalTypes, ModalTypes.None>, ModalContainer> = {
    [ModalTypes.Center]: CenterModal,
    [ModalTypes.Cancel]: CancelModal,
    [ModalTypes.Select]: SelectModal,
    [ModalTypes.Freeform]: FreeformModal,
    [ModalTypes.FullScreen]: FullScreenModal,
    [ModalTypes.Right]: RightModal,
} as const;
