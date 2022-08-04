import { z } from 'zod';

/** Adds a string serialization transform to a zod validator type */
export type SerializeValidator<Validator extends z.ZodTypeAny> = z.ZodEffects<Validator, string>;
/** Adds a string deserialization transform to a zod validator type */
export type DeserializeValidator<Validator extends z.ZodTypeAny> = z.ZodEffects<
    z.ZodType<string>,
    z.infer<Validator>
>;

/** Adds a string serialization transform to each validator of an object of zod validator types  */
export type SerializedArguments<Args extends Record<string, z.ZodTypeAny>> = {
    [Key in keyof Args]: SerializeValidator<Args[Key]>;
};

/** Adds a string deserialization transform to each validator of an object of zod validator types  */
export type DeserializedArguments<Args extends Record<string, z.ZodTypeAny>> = {
    [Key in keyof Args]: DeserializeValidator<Args[Key]>;
};

/**
 * A standardized RPCMethod object containing validation and serialization/deserialization for
 * arguments and return values
 */
export type RPCMethod<
    Method extends string = any,
    Args extends Record<string, z.ZodTypeAny> = any,
    ReturnValidator extends z.ZodTypeAny = any
> = {
    method: Method;
    arguments: {
        validator: z.ZodObject<{ method: z.ZodLiteral<Method> } & Args>;
        serializer: z.ZodObject<{ method: z.ZodLiteral<Method> } & SerializedArguments<Args>>;
        deserializer: z.ZodObject<{ method: z.ZodLiteral<Method> } & DeserializedArguments<Args>>;
    };
    returnValue: {
        validator: ReturnValidator;
        serializer: SerializeValidator<ReturnValidator>;
        deserializer: DeserializeValidator<ReturnValidator>;
    };
};

/** Creates a zod discriminated union type from a series of RPCMethods */
export type GetAPIEndpointUnion<
    RPCMethods extends Record<string, RPCMethod>,
    Type extends keyof RPCMethod['arguments']
> = z.ZodDiscriminatedUnion<'method', z.Primitive, RPCMethods[keyof RPCMethods]['arguments'][Type]>;

/** A standardized APIEndpoint object containing a series of RPCMethods */
export type APIEndpoint<RPCMethods extends Record<string, RPCMethod> = any> = {
    [key in keyof RPCMethods as RPCMethods[key]['method']]: RPCMethods[key];
} & {
    validator: GetAPIEndpointUnion<RPCMethods, 'validator'>;
    serializer: GetAPIEndpointUnion<RPCMethods, 'serializer'>;
    deserializer: GetAPIEndpointUnion<RPCMethods, 'deserializer'>;
};

/** Infers TS Types from zod types of an RPCMethod */
export type GetRPCMethodType<T extends RPCMethod> = {
    method: T['method'];
    arguments: {
        validator: z.infer<T['arguments']['validator']>;
        serializer: z.infer<T['arguments']['serializer']>;
        deserializer: z.infer<T['arguments']['deserializer']>;
    };
    returnValue: {
        validator: z.infer<T['returnValue']['validator']>;
        serializer: z.infer<T['returnValue']['serializer']>;
        deserializer: z.infer<T['returnValue']['deserializer']>;
    };
};

/** Infers TS Types from zod types of an APIEndpoint */
export type GetAPIEndpointType<T extends APIEndpoint> = {
    [Key in keyof Omit<T, 'validator' | 'serializer' | 'deserializer'>]: GetRPCMethodType<T[Key]>;
} & {
    validator: z.infer<T['validator']>;
    serializer: z.infer<T['serializer']>;
    deserializer: z.infer<T['deserializer']>;
};

/** Adds a string serialization transform to a zod validator */
export const getJSONSerializer = <Validator extends z.ZodTypeAny>(
    validator: Validator
): SerializeValidator<Validator> => validator.transform(value => JSON.stringify(value));

/** Adds a string deserialization transform to a zod validator */
export const getJSONDeserializer = <Validator extends z.ZodTypeAny>(
    validator: Validator
): DeserializeValidator<Validator> =>
    z.string().transform((value, ctx) => {
        try {
            const validated = validator.safeParse(JSON.parse(value));

            if (validated.success) return validated.data as z.infer<Validator>;

            throw new Error(validated.error.message);
        } catch (error) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: error.message,
            });
            return {} as z.infer<Validator>;
        }
    });

/** Converts an RPCMethod's zod validators into serializers */
export const getSerializerObject = <
    Method extends string,
    Args extends Record<string, z.ZodTypeAny>
>(
    method: Method,
    args: Args,
    skipSerializationKeys?: Array<keyof Args>
): z.ZodObject<{ method: z.ZodLiteral<Method> } & SerializedArguments<Args>> => {
    const serializedArguments = Object.entries(args).reduce<SerializedArguments<Args>>(
        (acc, [key, value]) => {
            if (key in args) {
                if (skipSerializationKeys?.includes(key)) acc[key as keyof Args] = value as any;
                else acc[key as keyof Args] = getJSONSerializer(value as Args[keyof Args]);
            }

            return acc;
        },
        {} as SerializedArguments<Args>
    );

    return z.object({ method: z.literal(method), ...serializedArguments }) as any;
};

/** Converts an RPCMethod's zod validators into deserializers */
export const getDeserializerObject = <
    Method extends string,
    Args extends Record<string, z.ZodTypeAny>
>(
    method: Method,
    args: Args,
    skipSerializationKeys?: Array<keyof Args>
): z.ZodObject<{ method: z.ZodLiteral<Method> } & DeserializedArguments<Args>> => {
    const serializedArguments = Object.entries(args).reduce<DeserializedArguments<Args>>(
        (acc, [key, value]) => {
            if (key in args) {
                if (skipSerializationKeys?.includes(key)) acc[key as keyof Args] = value as any;
                else acc[key as keyof Args] = getJSONDeserializer(value as Args[keyof Args]);
            }

            return acc;
        },
        {} as DeserializedArguments<Args>
    );

    return z.object({ method: z.literal(method), ...serializedArguments }) as any;
};

/** Creates an RPC method */
export const getRpcMethod = <
    Method extends string,
    Args extends Record<string, z.ZodTypeAny>,
    ReturnValidator extends z.ZodTypeAny
>(
    method: Method,
    args: Args,
    returnValidator: ReturnValidator,
    {
        skipSerializationKeys = [],
        serializeReturnValue = true,
    }: { skipSerializationKeys?: Array<keyof Args>; serializeReturnValue?: boolean } = {}
): RPCMethod<Method, Args, ReturnValidator> => ({
    method,
    arguments: {
        validator: z.object({ method: z.literal(method), ...args }) as any,
        serializer: getSerializerObject(method, args, skipSerializationKeys) as any,
        deserializer: getDeserializerObject(method, args, skipSerializationKeys) as any,
    },
    returnValue: {
        validator: returnValidator,
        serializer: serializeReturnValue
            ? getJSONSerializer(returnValidator)
            : (returnValidator as any),
        deserializer: serializeReturnValue
            ? getJSONDeserializer(returnValidator)
            : (returnValidator as any),
    },
});

/** Creates an API endpoint */
export const getAPIEndpoint = <RPCObjects extends Record<string, RPCMethod>>(
    rpcObjects: RPCObjects
) => {
    const APIObject = Object.values(rpcObjects).reduce<APIEndpoint<RPCObjects>>(
        (acc, rpcObject) => {
            acc[rpcObject.method as RPCObjects[keyof RPCObjects]['method']] = rpcObject as any;

            return acc;
        },
        {} as APIEndpoint<RPCObjects>
    );

    APIObject.validator = z.discriminatedUnion(
        'method',
        Object.values(rpcObjects).map(rpcObject => rpcObject.arguments.validator) as any
    );
    APIObject.serializer = z.discriminatedUnion(
        'method',
        Object.values(rpcObjects).map(rpcObject => rpcObject.arguments.serializer) as any
    );
    APIObject.deserializer = z.discriminatedUnion(
        'method',
        Object.values(rpcObjects).map(rpcObject => rpcObject.arguments.deserializer) as any
    );

    return APIObject;
};
