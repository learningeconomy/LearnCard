import { z } from 'zod';

// Note: SetState is exported from ./state.ts to avoid duplicate exports

export const ImageResizingValidator = z.object({ type: z.literal('resizing') });
export type ImageResizing = z.infer<typeof ImageResizingValidator>;

export const ImageUploadingValidator = z.object({
    type: z.literal('uploading'),
    progress: z.number().optional(),
});
export type ImageUploading = z.infer<typeof ImageUploadingValidator>;

export const ImageWithLoadingStateValdator = z.object({
    image: z.string(),
    loading: z.union([ImageResizingValidator, ImageUploadingValidator]).optional(),
});
export type ImageWithLoadingState = z.infer<typeof ImageWithLoadingStateValdator>;

export type FilestackImage = {
    filename: string;
    handle: string;
    mimetype: string;
    originalFile: {
        name: string;
        size: number;
        type: string;
    };
    originalPath: string;
    size: number;
    source: string;
    status: string;
    uploadId: string;
    url: string;
};

export type Simplify<T> = {
    [KeyType in keyof T]: T[KeyType];
};

export type Maybify<T> = Simplify<{
    [P in keyof T]?: Maybify<T[P]> | null;
}>;

/** If Maybify gives you an exceeds maximum length error, try this one!  */
export type PerformantMaybify<T> = {
    [P in keyof T]?: PerformantMaybify<T[P]> | null;
};

export type DeepValues<ObjectType extends object> = {
    [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
        ? DeepValues<ObjectType[Key]>
        : ObjectType[Key];
}[keyof ObjectType & (string | number)];

export interface Nothing {}
export type Other<T> = T & Nothing;

export type SuggestString<Literals extends string> = Literals | Other<string>;

export type DeepPartial<T> = T extends Date
    ? T
    : T extends object
    ? {
          [P in keyof T]?: DeepPartial<T[P]>;
      }
    : T;

export const isNotUndefined = <T>(value: T | null | undefined): value is T => Boolean(value);

export const filterUndefined = <T>(arr: (T | null | undefined)[]) => arr.filter(isNotUndefined);
