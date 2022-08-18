import { LearnCard, LearnCardConfig } from 'types/LearnCard';

export type InitFunction<
    Args extends Record<string, any> | undefined = Record<string, any>,
    Config extends keyof LearnCardConfig = keyof LearnCardConfig,
    ReturnValue extends LearnCard<any, any> = LearnCard<any, any>
> = {
    args: undefined extends Args
        ? Partial<Pick<LearnCardConfig, Config>>
        : Args & Partial<Pick<LearnCardConfig, Config>>;
    returnValue: ReturnValue;
};

export type GenericInitFunction<InitFunctions extends InitFunction<any, any, any>[]> = {
    args: InitFunctions[number]['args'];
    returnValue: Promise<InitFunctions[number]['returnValue']>;
};
