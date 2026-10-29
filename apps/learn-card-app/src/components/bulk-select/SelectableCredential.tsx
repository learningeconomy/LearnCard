import { KeyboardEvent, PointerEvent, ReactNode, useRef } from 'react';
import { IonIcon } from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import type { LCR } from 'learn-card-base/types/credential-records';
import {
    credentialSelectionStore,
    SelectedCredential,
} from '../../stores/credentialSelectionStore';

type SelectableCredentialProps = {
    record: Partial<LCR>;
    children: ReactNode;
    listId: string;
};

const LONG_PRESS_MS = 450;
const MOVE_TOLERANCE = 8;

const toSelection = (record: Partial<LCR>): SelectedCredential | undefined =>
    record.id && record.uri && record.category
        ? { uri: record.uri, recordId: record.id, category: record.category }
        : undefined;

export const SelectableCredential = ({ record, children, listId }: SelectableCredentialProps) => {
    const active = credentialSelectionStore.use.active();
    const items = credentialSelectionStore.use.items();
    const press = useRef<{ x: number; y: number; timer?: ReturnType<typeof setTimeout> }>();
    const selection = toSelection(record);
    const selected = selection ? Boolean(items[selection.uri]) : false;
    const label = record.title ?? record.metadata?.title ?? record.uri ?? 'Credential';

    const clearPress = () => {
        if (press.current?.timer) clearTimeout(press.current.timer);
        press.current = undefined;
    };

    const toggle = () => {
        if (selection) credentialSelectionStore.set.toggle(selection, listId);
    };

    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (!selection || active) return;
        press.current = {
            x: event.clientX,
            y: event.clientY,
            timer: setTimeout(() => {
                credentialSelectionStore.set.enter('passport');
                toggle();
                clearPress();
            }, LONG_PRESS_MS),
        };
    };

    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const current = press.current;
        if (!current) return;
        if (Math.hypot(event.clientX - current.x, event.clientY - current.y) > MOVE_TOLERANCE) {
            clearPress();
        }
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        if (!active || !selection || ![' ', 'Enter'].includes(event.key)) {
            return;
        }
        event.preventDefault();
        toggle();
    };

    return (
        <div
            role={active ? 'checkbox' : undefined}
            aria-checked={active ? selected : undefined}
            aria-label={active ? label : undefined}
            tabIndex={active ? 0 : undefined}
            className={
                active
                    ? `relative transition-transform duration-200 ${
                          selected ? 'scale-[0.97] ring-2 ring-emerald-500 rounded-[20px]' : ''
                      }`
                    : 'relative'
            }
            onClickCapture={event => {
                if (!active || !selection) return;
                event.preventDefault();
                event.stopPropagation();
                toggle();
            }}
            onKeyDown={onKeyDown}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={clearPress}
            onPointerCancel={clearPress}
        >
            {children}
            {active && (
                <span
                    aria-hidden="true"
                    className={`absolute end-3 top-3 z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                        selected
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-white bg-white/50'
                    }`}
                >
                    {selected && <IonIcon icon={checkmark} />}
                </span>
            )}
        </div>
    );
};
