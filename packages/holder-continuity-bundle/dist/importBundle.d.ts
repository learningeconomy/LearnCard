import type { ImportLearnCardBundleOptions, ImportLearnCardBundleReport, ReadLearnCardBundleOptions, ReadLearnCardBundleResult } from './types';
export declare const readLearnCardBundleData: (data: Buffer, options?: ReadLearnCardBundleOptions) => Promise<ReadLearnCardBundleResult>;
export declare const readLearnCardBundle: (path: string, options?: ReadLearnCardBundleOptions) => Promise<ReadLearnCardBundleResult>;
export declare const importLearnCardBundle: (path: string, options: ImportLearnCardBundleOptions) => Promise<ImportLearnCardBundleReport>;
//# sourceMappingURL=importBundle.d.ts.map