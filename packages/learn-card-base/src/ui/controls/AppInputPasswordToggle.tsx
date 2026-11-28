import React from 'react';

import { eye, eyeOff } from '../../icons/ionicons';
import { getIonMode, type IonMode } from '../app-shell/ionMode';
import { AppIcon } from '../icon';
import './controls.css';

export type AppInputPasswordToggleProps = {
    /** Whether the password shows as text. Pair it with the input's `type`. */
    visible: boolean;
    onVisibleChange: (visible: boolean) => void;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    className?: string;
};

/**
 * App-owned replacement for `IonInputPasswordToggle` (@ionic/core 8.7.2): a round, clear,
 * icon-only switch for an `AppInput`'s `end` slot. Ionic flipped the ancestor ion-input's `type`
 * itself; here the caller owns that state:
 *
 *     <AppInput type={visible ? 'text' : 'password'}
 *         end={<AppInputPasswordToggle visible={visible} onVisibleChange={setVisible} />} />
 */
export const AppInputPasswordToggle: React.FC<AppInputPasswordToggleProps> = ({
    visible,
    onVisibleChange,
    mode: modeProp,
    className,
}) => {
    const mode = modeProp ?? getIonMode();
    return (
        <span className={['app-input-password-toggle', mode, className].filter(Boolean).join(' ')}>
            <button
                type="button"
                role="switch"
                aria-checked={visible}
                aria-label={visible ? 'Hide password' : 'Show password'}
                className={`app-input-password-toggle-button app-input-password-toggle-button-${mode}`}
                // Keeps mobile browsers from blurring the input when the toggle is pressed.
                onPointerDown={event => event.preventDefault()}
                onClick={() => onVisibleChange(!visible)}
            >
                <AppIcon
                    icon={visible ? eyeOff : eye}
                    aria-hidden="true"
                    className="app-input-password-toggle-icon"
                />
            </button>
        </span>
    );
};

export default AppInputPasswordToggle;
