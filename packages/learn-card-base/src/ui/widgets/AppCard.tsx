import React from 'react';

import { getIonMode, type IonMode } from '../app-shell/ionMode';
import '../controls/controls.css';
import './widgets.css';

export type AppCardColor = 'light';

export type AppCardProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Palette color (`--app-color-*`): background and contrasting text. */
    color?: AppCardColor;
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

/**
 * App-owned replacement for a non-clickable `IonCard`: a rounded, shadowed surface (md: 4px
 * radius; ios: 8px radius, softer shadow). Its outer margins lose to Tailwind's preflight, as
 * ion-card's did.
 */
export const AppCard: React.FC<AppCardProps> = ({ color, mode: modeProp, className, ...rest }) => {
    const mode = modeProp ?? getIonMode();
    const classes = [
        'app-card',
        `app-card-${mode}`,
        color && `app-color app-color-${color}`,
        className,
    ];
    return <div className={classes.filter(Boolean).join(' ')} {...rest} />;
};

export type AppCardContentProps = React.HTMLAttributes<HTMLDivElement> & {
    /** Platform look. Defaults to the document's Ionic mode (`ios` on iOS, `md` elsewhere). */
    mode?: IonMode;
    ref?: React.Ref<HTMLDivElement>;
};

/** App-owned replacement for `IonCardContent`: card padding and heading / paragraph type. */
export const AppCardContent: React.FC<AppCardContentProps> = ({
    mode: modeProp,
    className,
    ...rest
}) => {
    const mode = modeProp ?? getIonMode();
    return (
        <div
            className={['app-card-content', `app-card-content-${mode}`, className]
                .filter(Boolean)
                .join(' ')}
            {...rest}
        />
    );
};

export default AppCard;
