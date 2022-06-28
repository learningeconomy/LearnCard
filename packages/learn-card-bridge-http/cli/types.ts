import { Dispatch, SetStateAction } from 'react';

export type FormState = {
    name: string;
    seed: string;
};

export type SetState<T> = Dispatch<SetStateAction<T>>;
