import { Logger } from './options/logger';
import { QuoteCharacter } from './options/quoteCharacter';
import { Directory } from './interfaces/directory.interface';
import { FileTreeLocation } from './interfaces/location.interface';
export declare function mockFsConfiguration(): {
    'code.ts': string;
    directory1: {
        'barrel.ts': string;
        directory2: {
            directory4: {
                'deeplyNested.ts': string;
            };
            'script.ts': string;
        };
        directory3: {
            'program.ts': string;
        };
        'ignore.txt': string;
        'index.ts': string;
    };
};
export declare function mockDirectoryTree(): Directory;
export declare function mockModules(rootDirectory: Directory): FileTreeLocation[];
export declare function mockLogger(_: string[]): Logger;
export declare function assertMultiLine(actual: string, expected: string): void;
export declare function tslint(content: string, quoteCharacter: QuoteCharacter): void;
