import { LearnCardConfig } from 'types/LearnCard';
import { LearnCard } from '@learncard/core';

export type InitFunction<
    Args extends Record<string, any> = Record<string, any>,
    Config extends keyof LearnCardConfig | undefined = keyof LearnCardConfig,
    ReturnValue extends LearnCard<any, any> = LearnCard<any, any>
> = {
    args: Args &
    (undefined extends Config ? {} : Partial<Pick<LearnCardConfig, NonNullable<Config>>>);
    returnValue: ReturnValue;
};

export type GenericInitFunction<InitFunctions extends InitFunction<any, any, any>[]> = {
    args: InitFunctions[number]['args'];
    returnValue: Promise<InitFunctions[number]['returnValue']>;
};
