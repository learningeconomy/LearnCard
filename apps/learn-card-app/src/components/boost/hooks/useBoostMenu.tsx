import React from 'react';

import {
    useDeleteCredentialRecord,
    useModal,
    ModalTypes,
    useDeleteManagedBoostMutation,
    useGetRecordForUri,
} from 'learn-card-base';
import { LCR } from 'learn-card-base/types/credential-records';
import BoostOptionsMenu from '../boost-options-menu/BoostOptionsMenu';

import { UnsignedVC, VC } from '@learncard/types';

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
}:
    | {
          credential?: VC;
          record?: Partial<LCR>;
          categoryType?: string;
          menuType: BoostMenuType.earned;
          onCloseModal?: () => void;
          onDelete?: () => void;
          boostUri?: never;
          boostCredential?: never;
      }
    | {
          boostUri: string;
          categoryType: string;
          menuType: BoostMenuType.managed;
          boostCredential?: VC | UnsignedVC;
          onCloseModal?: () => void;
          onDelete?: () => void;
          credential?: never;
          record?: never;
      }) => {
    const { newModal, closeModal } = useModal({
        desktop: ModalTypes.Cancel,
        mobile: ModalTypes.Cancel,
    });
    const { mutateAsync: deleteManagedBoost } = useDeleteManagedBoostMutation();

    const { mutateAsync: deleteCredentialRecord } = useDeleteCredentialRecord();

    const { data: retrievedRecord } = useGetRecordForUri(
        _record?.uri,
        Boolean(menuType === BoostMenuType.earned && !_record?.id && _record?.uri)
    );

    const record = retrievedRecord || _record;

    const handleDelete = async () => {
        if (menuType === BoostMenuType.managed) {
            await deleteManagedBoost({ boostUri, category: categoryType });
            onDelete?.();
        } else if (record?.id && record.uri) {
            console.log('deleting record', record);
            await deleteCredentialRecord(record as LCR);
            onDelete?.();
        } else {
            console.error("Couldn't delete boost: missing credential record data");
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
            />,
            { sectionClassName: '!max-w-[400px]' }
        );
    };

    return handlePresentBoostMenuModal;
};

export default useBoostMenu;
