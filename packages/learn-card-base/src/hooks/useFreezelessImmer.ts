import { useState, useCallback } from 'react';
import { produce, setAutoFreeze } from 'immer';
import { ImmerHook } from 'use-immer';

setAutoFreeze(false);

/**
 * The original useImmer hook calls immer's freeze method on the value you pass in. This is mostly
 * totally fine, but if it's _not_ fine for some reason (perhaps you are storing JSX that passes in
 * the history object which must remain mutable), then you can use this hook that does the same thing
 * without calling freeze!
 */
export function useFreezelessImmer<S = any>(initialValue: S | (() => S)): ImmerHook<S>;
export function useFreezelessImmer(initialValue: any) {
    const [val, updateValue] = useState(initialValue);

    return [
        val,
        useCallback((updater: any) => {
            if (typeof updater === 'function') updateValue(produce(updater));
            else updateValue(updater);
        }, []),
    ];
}
