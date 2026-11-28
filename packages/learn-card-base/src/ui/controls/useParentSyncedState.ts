import { useCallback, useState } from 'react';

/**
 * Internal control state with Ionic React's prop model.
 *
 * Ionic React's wrapper writes every prop back onto the element on every parent re-render
 * (`attachProps` in `componentDidUpdate`), while user input changes the element's own state
 * without re-rendering the wrapper. So `ion-checkbox.checked` / `ion-radio-group.value`:
 * - start from the prop,
 * - flip on user input even if the parent ignores the change event,
 * - are overwritten by the prop the next time the parent re-renders (even with the same value).
 *
 * This hook reproduces that: a parent re-render is detected as a new `props` object, which
 * React creates for every render of the parent but not for this component's own state updates.
 * When the prop key is absent (`<AppCheckbox />`), the state is never overwritten (uncontrolled).
 */
export const useParentSyncedState = <P extends object, K extends keyof P>(
    props: P,
    key: K,
    fallback: NonNullable<P[K]>
): [NonNullable<P[K]>, (next: NonNullable<P[K]>) => void] => {
    type V = NonNullable<P[K]>;
    const provided = Object.prototype.hasOwnProperty.call(props, key);
    const fromProps = (): V => (props[key] ?? fallback) as V;

    const [state, setState] = useState<{ value: V; props: P }>(() => ({
        value: provided ? fromProps() : fallback,
        props,
    }));

    let { value } = state;
    if (state.props !== props) {
        // Render-phase update of this component's own state (React's "adjust state on prop
        // change" pattern): no extra commit, no flash of the stale value.
        if (provided) value = fromProps();
        setState({ value, props });
    }

    const set = useCallback((next: V) => setState(current => ({ ...current, value: next })), []);

    return [value, set];
};
