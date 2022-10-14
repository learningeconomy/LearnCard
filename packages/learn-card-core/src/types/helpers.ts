import { LearnCard, LearnCardConfig } from 'types/LearnCard';

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

export type DiscriminatedUnionize<T extends object = {}, K extends string = 'type'> = {
    [Key in keyof T]: { [Key2 in K]: Key } & T[Key];
}[keyof T];
