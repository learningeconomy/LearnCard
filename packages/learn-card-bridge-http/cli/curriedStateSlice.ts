import { SetStateAction } from 'react';
import produce, { Draft, castDraft } from 'immer';
import { DraftFunction, Updater } from 'use-immer';

import { SetState } from './types';

// Inlined version of the hopefully one day npm package curriedStateSlice

type ImmerOrReact = 'immer' | 'react';

type UpdaterArgs<T> = T | DraftFunction<T>;

type CurriedReturn<ValueArg, Value> = undefined extends ValueArg
    ? (innerValue: Value) => void
    : void;

type InnerImmerOuterImmer<State> = <
    Field extends keyof Draft<State>,
    Value extends UpdaterArgs<Draft<State>[Field]>,
    ValueArg extends Value | undefined
>(
    field: Field,
    value?: ValueArg
) => CurriedReturn<ValueArg, Value>;

type InnerReactOuterImmer<State> = <
    Field extends keyof Draft<State>,
    Value extends SetStateAction<Draft<State>[Field]>,
    ValueArg extends Value | undefined
>(
    field: Field,
    value?: ValueArg
) => CurriedReturn<ValueArg, Value>;

type InnerImmerOuterReact<State> = <
    Field extends keyof State,
    Value extends UpdaterArgs<State[Field]>,
    ValueArg extends Value | undefined
>(
    field: Field,
    value?: ValueArg
) => CurriedReturn<ValueArg, Value>;

type InnerReactOuterReact<State> = <
    Field extends keyof State,
    Value extends SetStateAction<State[Field]>,
    ValueArg extends Value | undefined
>(
    field: Field,
    value?: ValueArg
) => CurriedReturn<ValueArg, Value>;

export function innerImmerOuterImmer<
    State,
    Field extends keyof Draft<State>,
    Value extends UpdaterArgs<Draft<State>[Field]>
>(setState: Updater<State>, field: Field): (innerValue: NonNullable<Value>) => void;
export function innerImmerOuterImmer<
    State,
    Field extends keyof Draft<State>,
    Value extends UpdaterArgs<Draft<State>[Field]>,
    ValueArg extends Value | undefined
>(setState: Updater<State>, field: Field, value: ValueArg): void;

/**
 * Creates a useImmer Updater style function for a given field. This is useful for creating mini
 * pieces of state from larger pieces of state, or for creating manual setState functions for
 * components that expect setState as a prop.
 *
 * This function assumes you are using useImmer instead of useState
 *
 * Use like so:
 *
 * [state, setState] = useImmer<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * innerImmerOuterImmer(setState, 'num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * innerImmerOuterImmer(
 *     setState,
 *     'num',
 *     oldNum => {
 *         oldNum += 1;
 *     },
 * ); // Updates state to { num: 4, string: 'str' }
 *
 * innerImmerOuterImmer(setState, 'num', 'three'); // TS Error due to invalid type
 *
 */
export function innerImmerOuterImmer<
    State,
    Field extends keyof Draft<State>,
    Value extends UpdaterArgs<Draft<State>[Field]>,
    ValueArg extends Value | undefined
>(setState: Updater<State>, field: Field, value?: ValueArg): any {
    if (value === undefined) {
        return (innerValue: NonNullable<Value>) => {
            setState(oldState => {
                if (innerValue instanceof Function) innerValue(oldState[field]);
                else oldState[field] = innerValue as Draft<State>[Field];
            });
        };
    }

    setState(oldState => {
        if (value instanceof Function) value(oldState[field]);
        else oldState[field] = value as Draft<State>[Field];
    });
}

/**
 * Curry function to allow innerImmerOuterImmer to be used without constantly passing in setState
 *
 * Use like so:
 *
 * [state, setState] = useImmer<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * const updateField = curriedInnerImmerOuterImmer(setState);
 *
 * updateField('num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * updateField(
 *     'num',
 *     oldNum => {
 *         oldNum += 1;
 *     },
 * ); // Updates state to { num: 4, string: 'str' }
 *
 * updateField(setState, 'num', 'three'); // TS Error due to invalid type
 */
export const curriedInnerImmerOuterImmer =
    <State>(setState: Updater<State>): InnerImmerOuterImmer<State> =>
    <
        Field extends keyof Draft<State>,
        Value extends UpdaterArgs<Draft<State>[Field]>,
        ValueArg extends Value | undefined
    >(
        field: Field,
        value?: ValueArg
    ) =>
        innerImmerOuterImmer<State, Field, Value, ValueArg>(setState, field, value);

export function innerReactOuterImmer<
    State,
    Field extends keyof Draft<State>,
    Value extends SetStateAction<Draft<State>[Field]>
>(setState: Updater<State>, field: Field): (innerValue: NonNullable<Value>) => void;

export function innerReactOuterImmer<
    State,
    Field extends keyof Draft<State>,
    Value extends SetStateAction<Draft<State>[Field]>,
    ValueArg extends Value | undefined
>(setState: Updater<State>, field: Field, value: ValueArg): void;
/**
 * Creates a React setState style function for a given field. This is useful for creating mini
 * pieces of state from larger pieces of state, or for creating manual setState functions for
 * components that expect setState as a prop.
 *
 * This function assumes you are using useImmer instead of useState
 *
 * Use like so:
 *
 * [state, setState] = useImmer<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * innerReactOuterImmer(setState, 'num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * innerReactOuterImmer(
 *     setState,
 *     'num',
 *     oldNum => oldNum + 1,
 * ); // Updates state to { num: 4, string: 'str' }
 *
 * innerReactOuterImmer(setState, 'num', 'three'); // TS Error due to invalid type
 *
 */
export function innerReactOuterImmer<
    State,
    Field extends keyof Draft<State>,
    Value extends SetStateAction<Draft<State>[Field]>,
    ValueArg extends Value | undefined
>(setState: Updater<State>, field: Field, value?: ValueArg) {
    if (value === undefined) {
        return (innerValue: NonNullable<Value>) => {
            setState(oldState => {
                if (innerValue instanceof Function) innerValue(oldState[field]);
                else oldState[field] = innerValue as Draft<State>[Field];
            });
        };
    }

    setState(oldState => {
        oldState[field] =
            typeof value === 'function'
                ? (value(oldState[field]) as Draft<State>[Field])
                : (value as Draft<State>[Field]);
    });
}

/**
 * Curry function to allow innerReactOuterImmer to be used without constantly passing in setState
 *
 * Use like so:
 *
 * [state, setState] = useImmer<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * const updateField = curriedUpdateImmerSetStateField(setState);
 *
 * updateField('num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * updateField('num', oldNum => oldNum + 1); // Updates state to { num: 4, string: 'str' }
 *
 * updateField(setState, 'num', 'three'); // TS Error due to invalid type
 */
export const curriedInnerReactOuterImmer =
    <State>(setState: Updater<State>): InnerReactOuterImmer<State> =>
    <
        Field extends keyof Draft<State>,
        Value extends SetStateAction<Draft<State>[Field]>,
        ValueArg extends Value | undefined
    >(
        field: Field,
        value?: ValueArg
    ) =>
        innerReactOuterImmer<State, Field, Value, ValueArg>(setState, field, value);

export function innerImmerOuterReact<
    State,
    Field extends keyof State,
    Value extends UpdaterArgs<State[Field]>
>(setState: SetState<State>, field: Field): (innerValue: NonNullable<Value>) => void;
export function innerImmerOuterReact<
    State,
    Field extends keyof State,
    Value extends UpdaterArgs<State[Field]>,
    ValueArg extends Value | undefined
>(setState: SetState<State>, field: Field, value: ValueArg): void;
/**
 * Creates a useImmer Updater style function for a given field. This is useful for creating mini
 * pieces of state from larger pieces of state, or for creating manual setState functions for
 * components that expect setState as a prop.
 *
 * If possible, please consider updating your useState calls to useImmer and using the immer
 * versions of these functions
 *
 * Use like so:
 *
 * [state, setState] = useImmer<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * innerImmerOuterReact(setState, 'num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * innerImmerOuterReact(
 *     setState,
 *     'num',
 *     oldNum => {
 *         oldNum += 1;
 *     },
 * ); // Updates state to { num: 4, string: 'str' }
 *
 * innerImmerOuterReact(setState, 'num', 'three'); // TS Error due to invalid type
 *
 */
export function innerImmerOuterReact<
    State,
    Field extends keyof State,
    Value extends UpdaterArgs<State[Field]>,
    ValueArg extends Value | undefined
>(setState: SetState<State>, field: Field, value?: ValueArg) {
    if (value === undefined) {
        return (innerValue: NonNullable<Value>) => {
            if (innerValue instanceof Function) {
                setState(produce(oldState => innerValue(oldState[field])));
            } else setState(oldState => ({ ...oldState, [field]: innerValue }));
        };
    }

    if (value instanceof Function) {
        setState(produce(oldState => value(oldState[field])));
    } else setState(oldState => ({ ...oldState, [field]: value }));
}

/**
 * Curry function to allow innerImmerOuterReact to be used without constantly passing in setState
 *
 * Use like so:
 *
 * [state, setState] = useImmer<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * const updateField = curriedInnerImmerOuterImmer(setState);
 *
 * updateField('num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * updateField(
 *     'num',
 *     oldNum => {
 *         oldNum += 1;
 *     },
 * ); // Updates state to { num: 4, string: 'str' }
 *
 * updateField(setState, 'num', 'three'); // TS Error due to invalid type
 */
export const curriedInnerImmerOuterReact =
    <State>(setState: SetState<State>): InnerImmerOuterReact<State> =>
    <
        Field extends keyof State,
        Value extends UpdaterArgs<State[Field]>,
        ValueArg extends Value | undefined
    >(
        field: Field,
        value?: ValueArg
    ) =>
        innerImmerOuterReact<State, Field, Value, ValueArg>(setState, field, value);

export function innerReactOuterReact<
    State,
    Field extends keyof State,
    Value extends SetStateAction<State[Field]>
>(setState: SetState<State>, field: Field): (innerValue: NonNullable<Value>) => void;
export function innerReactOuterReact<
    State,
    Field extends keyof State,
    Value extends SetStateAction<State[Field]>,
    ValueArg extends Value | undefined
>(setState: SetState<State>, field: Field, value: ValueArg): void;
/**
 * Creates a React setState style function for a given field. This is useful for creating mini
 * pieces of state from larger pieces of state, or for creating manual setState functions for
 * components that expect setState as a prop.
 *
 * If possible, please consider updating your useState calls to useImmer and using the immer
 * versions of these functions
 *
 * Use like so:
 *
 * [state, setState] = useState<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * innerReactOuterReact(setState, 'num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * innerReactOuterReact(
 *     setState,
 *     'num',
 *     oldNum => oldNum + 1,
 * ); // Updates state to { num: 4, string: 'str' }
 *
 * innerReactOuterReact(setState, 'num', 'three'); // TS Error due to invalid type
 *
 */
export function innerReactOuterReact<
    State,
    Field extends keyof State,
    Value extends SetStateAction<State[Field]>,
    ValueArg extends Value | undefined
>(setState: SetState<State>, field: Field, value?: ValueArg) {
    if (value === undefined) {
        return (innerValue: NonNullable<Value>) => {
            setState(oldState => ({
                ...oldState,
                [field]: innerValue instanceof Function ? innerValue(oldState[field]) : innerValue,
            }));
        };
    }

    setState(oldState => ({
        ...oldState,
        [field]: value instanceof Function ? value(oldState[field]) : value,
    }));
}

/**
 * Curry function to allow updateSetStateField to be used without constantly passing in setState
 *
 * If possible, please consider updating your useState calls to useImmer and using the immer
 * versions of these functions
 *
 * Use like so:
 *
 * [state, setState] = useState<{ num: number; string: string; }>({ num: 1, string: 'str' });
 *
 * const updateField = curriedInnerReactOuterReact(setState);
 *
 * updateField('num', 3); // Updates state to { num: 3, string: 'str' }
 *
 * updateField('num', oldNum => oldNum + 1); // Updates state to { num: 4, string: 'str' }
 *
 * updateField(setState, 'num', 'three'); // TS Error due to invalid type
 */
export const curriedInnerReactOuterReact =
    <State>(setState: SetState<State>): InnerReactOuterReact<State> =>
    <
        Field extends keyof State,
        Value extends SetStateAction<State[Field]>,
        ValueArg extends Value | undefined
    >(
        field: Field,
        value?: ValueArg
    ) =>
        innerReactOuterReact<State, Field, Value, ValueArg>(setState, field, value);

export function curriedStateSlice<State>(setState: Updater<State>): InnerImmerOuterImmer<State>;
export function curriedStateSlice<State>(
    setState: Updater<State>,
    options: { inner: 'immer'; outer: 'immer' }
): InnerImmerOuterImmer<State>;
export function curriedStateSlice<State>(
    setState: Updater<State>,
    options: { inner: 'immer'; outer: 'react' }
): InnerImmerOuterReact<State>;
export function curriedStateSlice<State>(
    setState: SetState<State>,
    options: { inner: 'react'; outer: 'immer' }
): InnerReactOuterImmer<State>;
export function curriedStateSlice<State>(
    setState: SetState<State>,
    options: { inner: 'react'; outer: 'react' }
): InnerReactOuterReact<State>;
/**
 * This is a magical function that allows you to slice up complex state into smaller pieces of state
 * that are completely contained.
 *
 * This function works with both useImmer and useState, and allows you to seamlessly transform
 * between the two when creating state slices.
 *
 * Use like so:
 *
 * // This component will have access to the whole state, while dealing with subcomponents who only
 * // want access to the individual pieces as if they were their own pieces of state
 * type ComplexStateObject = {
 *     piece1: { num: number; str: string };
 *     piece2: { arr: number[]; obj: { num: number } };
 *     piece3: string;
 * }
 * const ComplexState = () => {
 *     [state, setState] = useImmer<ComplexStateObject>({
 *         piece1: { num: 1, str: '' },
 *         piece2: { arr: [], obj: { num: 2 } },
 *         piece3: '',
 *     });
 *
 *     const updateSlice = curriedStateSlice(setState);
 *
 *     return (
 *         <>
 *             <ComponentWantingOnlyPiece1
 *                 state={state.piece1}
 *                 setState={updateSlice('piece1')}
 *             />
 *             <ComponentWantingOnlyPiece2
 *                 state={state.piece2}
 *                 setState={updateSlice('piece2')}
 *             />
 *             <input
 *                 type="text"
 *                 onChange={e => updateSlice('piece3', e.target.value)}
 *                 value={state.piece3}
 *             />
 *         </>
 *     )
 * }
 *
 * The function returned by this function takes in a type-safe string representing a key from the
 * state object, followed by a type-checked value for that key's field.
 *
 * // Assuming updateSlice is called in the above component
 * updateSlice('piece4', 'nice'); // This errors because piece4 is not in our state object
 * updateSlice('piece3', 123); // This errors because piece3 should be a string, not a number
 *
 * If you are not using immer everywhere (you really should be when dealing with complex state),
 * you can pass in an object as the second parameter specifying whether you want to use immer or
 * react's setState functions for both your outer and inner state objects
 *
 * If you have any questions about this guy, please send a scribbled note via carrier pigeon to T2!
 */
export function curriedStateSlice<
    State,
    Inner extends ImmerOrReact = 'immer',
    Outer extends ImmerOrReact = 'immer'
>(
    setState: Updater<State> | SetState<State>,
    options?: { inner: Inner; outer: Outer }
):
    | InnerImmerOuterImmer<State>
    | InnerReactOuterImmer<State>
    | InnerImmerOuterReact<State>
    | InnerReactOuterReact<State> {
    // The type errors in this function can safely be ignored.
    // For some reason, this type signature works for consumers of this function, but fails to
    // correctly type-check the function body itself
    if ((options?.outer ?? 'immer') === 'immer') {
        return (options?.inner ?? 'immer') === 'immer'
            ? curriedInnerImmerOuterImmer(setState as Updater<State>)
            : curriedInnerReactOuterImmer(setState as Updater<State>);
    }

    return (options?.inner ?? 'immer') === 'immer'
        ? curriedInnerImmerOuterReact(setState as SetState<State>)
        : curriedInnerReactOuterReact(setState as SetState<State>);
}

type UpdateSlice<State> = {
    (index: number): Updater<State>;
    (index: number, value: UpdaterArgs<State>): void;
};

type CurriedArraySlice = {
    <State>(setState: SetState<State[]>): UpdateSlice<State>;
    <State>(setState: SetState<State[]>, index: number): Updater<State>;
    <State>(setState: SetState<State[]>, index: number, value: State): void;
};

export const curriedArraySlice = (<State>(
    setState: SetState<State[]>,
    index?: number,
    value?: State
) => {
    const updateSlice = ((innerIndex: number, innerValue?: State) => {
        const update: Updater<State> = reallyInnerValue =>
            setState(
                produce(draft => {
                    draft[innerIndex] =
                        reallyInnerValue instanceof Function
                            ? produce(draft[innerIndex]!, reallyInnerValue)
                            : castDraft(reallyInnerValue);
                })
            );

        if (!innerValue) return update;

        return update(innerValue);
    }) as UpdateSlice<State>;

    if (!index) return updateSlice;

    if (!value) return updateSlice(index);

    return updateSlice(index, value);
}) as CurriedArraySlice;

type ImmerArraySlice = {
    <State>(setState: Updater<State[]>): UpdateSlice<State>;
    <State>(setState: Updater<State[]>, index: number): Updater<State>;
    <State>(setState: Updater<State[]>, index: number, value: State): void;
};

export const immerArraySlice = (<State>(
    setState: Updater<State[]>,
    index?: number,
    value?: State
) => {
    const updateSlice = ((innerIndex: number, innerValue?: State) => {
        const update: Updater<State> = reallyInnerValue =>
            setState(oldState => {
                if (reallyInnerValue instanceof Function) reallyInnerValue(oldState[innerIndex]!);
                else oldState[innerIndex] = castDraft(reallyInnerValue);
            });

        if (!innerValue) return update;

        return update(innerValue);
    }) as UpdateSlice<State>;

    if (!index) return updateSlice;

    if (!value) return updateSlice(index);

    return updateSlice(index, value);
}) as ImmerArraySlice;
