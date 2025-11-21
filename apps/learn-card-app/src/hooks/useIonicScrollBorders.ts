import React, { useState } from 'react';
import { produce } from 'immer';
import { IonContentCustomEvent, ScrollDetail } from '@ionic/core';

export const useIonicScrollBorders = ({
    topShowClassName = 'border-t border-t-grayscale-200',
    topHideClassName = 'border-t border-t-transparent',
    bottomShowClassName = 'border-b border-b-grayscale-200',
    bottomHideClassName = 'border-b border-b-transparent',
}: {
    topShowClassName?: string;
    topHideClassName?: string;
    bottomShowClassName?: string;
    bottomHideClassName?: string;
} = {}) => {
    const [classNames, setClassNames] = useState([topHideClassName, bottomHideClassName]);

    const onIonScroll = async (event: IonContentCustomEvent<ScrollDetail>) => {
        const scrollElement = await event.target.getScrollElement();

        // Top border
        if (scrollElement.scrollTop > 0) {
            setClassNames(
                produce(oldClassNames => {
                    const index = oldClassNames.findIndex(
                        className => className === topHideClassName
                    );
                    if (index > -1) oldClassNames.splice(index, 1);

                    oldClassNames.push(topShowClassName);
                })
            );
        } else {
            setClassNames(
                produce(oldClassNames => {
                    const index = oldClassNames.findIndex(
                        className => className === topShowClassName
                    );
                    if (index > -1) oldClassNames.splice(index, 1);

                    oldClassNames.push(topHideClassName);
                })
            );
        }

        // Bottom border
        if (scrollElement.scrollTop < scrollElement.scrollHeight - scrollElement.clientHeight) {
            setClassNames(
                produce(oldClassNames => {
                    const index = oldClassNames.findIndex(
                        className => className === bottomHideClassName
                    );
                    if (index > -1) oldClassNames.splice(index, 1);

                    oldClassNames.push(bottomShowClassName);
                })
            );
        } else {
            setClassNames(
                produce(oldClassNames => {
                    const index = oldClassNames.findIndex(
                        className => className === bottomShowClassName
                    );
                    if (index > -1) oldClassNames.splice(index, 1);

                    oldClassNames.push(bottomHideClassName);
                })
            );
        }
    };

    return { classNames: classNames.join(' '), onIonScroll };
};
