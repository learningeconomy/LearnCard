import React from 'react';
import { getLogger } from 'learn-card-base';
const log = getLogger('use-boost-menu');

import {
    useDeleteCredentialRecord,
    useModal,
    ModalTypes,
    useDeleteManagedBoostMutation,
    useGetRecordForUri,
    useToast,
    ToastTypeEnum,
} from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import BoostOptionsMenu from '../boost-options-menu/BoostOptionsMenu';
import CredentialHistoryModal from '../../credentials/credential-history/CredentialHistoryModal';

import { UnsignedVC, VC } from '@learncard/types';
import * as m from '../../../paraglide/messages.js';

export enum BoostMenuType {
    managed = 'MANAGED',
    earned = 'EARNED',
}

const useBoostMenu = ({
    boostUri,
    credential,
    record: _record,
    categoryType,
    menuType,
    boostCredential,
    onCloseModal,
    onDelete,
    onManageIssuances,
    isDraft,
}:
    | {
          credential?: VC;
          record?: Partial<LCR>;
          categoryType?: string;
          menuType: BoostMenuType.earned;
          onCloseModal?: () => void;
          onDelete?: () => void;
          onManageIssuances?: never;
          boostUri?: never;
          boostCredential?: never;
          isDraft?: never;
      }
    | {
          boostUri: string;
          categoryType: string;
          menuType: BoostMenuType.managed;
          boostCredential?: VC | UnsignedVC;
          onCloseModal?: () => void;
          onDelete?: () => void;
          onManageIssuances?: () => void;
          credential?: never;
          record?: never;
          isDraft?: boolean;
      }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { mutateAsync: deleteManagedBoost } = useDeleteManagedBoostMutation();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();
    const { presentToast } = useToast();

    const { data: retrievedRecord } = useGetRecordForUri(
        _record?.uri,
        Boolean(menuType === BoostMenuType.earned && !_record?.id && _record?.uri)
    );

    const record = retrievedRecord || _record;

    // View Previous Versions is offered only when encrypted local history exists on the
    // record; managed remote history is optional enrichment and never gates the entry.
    const hasCredentialHistory = Boolean(record?.refresh?.history?.length);

    const presentCredentialHistory = () => {
        if (!record?.refresh?.history?.length) return;

        newModal(
            <CredentialHistoryModal record={record as LCR} handleCloseModal={() => closeModal()} />,
            { sectionClassName: '!max-w-[480px]' }
        );
    };

    const handleDelete = async () => {
        if (menuType === BoostMenuType.managed) {
            await deleteManagedBoost({ boostUri, category: categoryType });
            onDelete?.();
        } else if (record?.id && record.uri) {
            log.info('deleting record', record);
            await deleteCredentialRecord({
                ...(record as LCR),
                deferPostDeleteCleanup: true,
                onLocalDeleteComplete: () => {
                    closeModal();
                    onCloseModal?.();
                    onDelete?.();
                },
            });
        } else {
            presentToast(m['toasts.boost.deleteCredentialError'](), {
                type: ToastTypeEnum.Error,
                hasDismissButton: true,
            });
        }
    };

    const handlePresentBoostMenuModal = () => {
        newModal(
            <BoostOptionsMenu
                handleCloseModal={() => {
                    closeModal();
                    onCloseModal?.();
                }}
                boost={credential || boostCredential!}
                boostUri={record?.uri || boostUri}
                record={record}
                handleDelete={handleDelete}
                menuType={menuType}
                categoryType={categoryType}
                handleManageIssuances={onManageIssuances}
                onViewHistory={
                    menuType === BoostMenuType.earned && hasCredentialHistory
                        ? presentCredentialHistory
                        : undefined
                }
                isDraft={isDraft}
            />,
            { sectionClassName: '!max-w-[400px]' }
        );
    };

    return handlePresentBoostMenuModal;
};

export default useBoostMenu;
