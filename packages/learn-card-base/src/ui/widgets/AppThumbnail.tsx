import React from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import './widgets.css';

export type AppThumbnailProps = React.HTMLAttributes<HTMLDivElement> & {
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonThumbnail`: a `--size` square (48px) with `--border-radius` (0)
 * that crops a child `<img>` to cover it.
 */
export const AppThumbnail: React.FC<AppThumbnailProps> = ({ className, ...rest }) => (
    <div className={['app-thumbnail', className].filter(Boolean).join(' ')} {...rest} />
);

export type AppAvatarProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for `IonAvatar`: a circle (64px md, 48px ios; `--border-radius`) that
 * crops a child `<img>` to cover it.
 */
export const AppAvatar: React.FC<AppAvatarProps> = ({ mode: modeProp, className, ...rest }) => {
    const mode = modeProp ?? getIonMode();
    return (
        <div
            className={['app-avatar', `app-avatar-${mode}`, className].filter(Boolean).join(' ')}
            {...rest}
        />
    );
};

export default AppThumbnail;
