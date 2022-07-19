"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEmpty = exports.trimExtension = exports.zip = exports.humanSize = exports.findProjectRoot = exports.findUp = exports.spawnProcess = exports.SpawnError = void 0;
const bestzip_1 = require("bestzip");
const archiver_1 = __importDefault(require("archiver"));
const child_process_1 = __importDefault(require("child_process"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const ramda_1 = require("ramda");
class SpawnError extends Error {
    constructor(message, stdout, stderr) {
        super(message);
        this.stdout = stdout;
        this.stderr = stderr;
    }
    toString() {
        return `${this.message}\n${this.stderr}`;
    }
}
exports.SpawnError = SpawnError;
/**
 * Executes a child process without limitations on stdout and stderr.
 * On error (exit code is not 0), it rejects with a SpawnProcessError that contains the stdout and stderr streams,
 * on success it returns the streams in an object.
 * @param {string} command - Command
 * @param {string[]} [args] - Arguments
 * @param {Object} [options] - Options for child_process.spawn
 */
function spawnProcess(command, args, options) {
    return new Promise((resolve, reject) => {
        const child = child_process_1.default.spawn(command, args, options);
        let stdout = '';
        let stderr = '';
        // Configure stream encodings
        child.stdout.setEncoding('utf8');
        child.stderr.setEncoding('utf8');
        // Listen to stream events
        child.stdout.on('data', (data) => {
            stdout += data;
        });
        child.stderr.on('data', (data) => {
            stderr += data;
        });
        child.on('error', (err) => {
            reject(err);
        });
        child.on('close', (exitCode) => {
            if (exitCode !== 0) {
                reject(new SpawnError(`${command} ${(0, ramda_1.join)(' ', args)} failed with code ${exitCode}`, stdout, stderr));
            }
            else {
                resolve({ stdout, stderr });
            }
        });
    });
}
exports.spawnProcess = spawnProcess;
/**
 * Find a file by walking up parent directories
 */
function findUp(names, directory = process.cwd()) {
    const absoluteDirectory = path_1.default.resolve(directory);
    if (typeof names === 'string') {
        names = [names];
    }
    /* For vs. .forEach so it can exit when we get a hit. */
    for (const name of names) {
        if (fs_extra_1.default.existsSync(path_1.default.join(directory, name))) {
            return directory;
        }
    }
    const { root } = path_1.default.parse(absoluteDirectory);
    if (absoluteDirectory === root) {
        return undefined;
    }
    return findUp(names, path_1.default.dirname(absoluteDirectory));
}
exports.findUp = findUp;
/**
 * Forwards `rootDir` or finds project root folder.
 */
function findProjectRoot(rootDir) {
    return rootDir !== null && rootDir !== void 0 ? rootDir : findUp(['yarn.lock', 'package-lock.json']);
}
exports.findProjectRoot = findProjectRoot;
const humanSize = (size) => {
    const i = Math.floor(Math.log(size) / Math.log(1024));
    const sanitized = (size / Math.pow(1024, i)).toFixed(2);
    return `${sanitized} ${['B', 'KB', 'MB', 'GB', 'TB'][i]}`;
};
exports.humanSize = humanSize;
const zip = async (zipPath, filesPathList, useNativeZip = false) => {
    // create a temporary directory to hold the final zip structure
    const tempDirName = `${path_1.default.basename(zipPath).slice(0, -4)}-${Date.now().toString()}`;
    const tempDirPath = path_1.default.join(os_1.default.tmpdir(), tempDirName);
    fs_extra_1.default.mkdirpSync(tempDirPath);
    // copy all required files from origin path to (sometimes modified) target path
    await Promise.all(filesPathList.map((file) => fs_extra_1.default.copy(file.rootPath, path_1.default.join(tempDirPath, file.localPath))));
    // prepare zip folder
    fs_extra_1.default.mkdirpSync(path_1.default.dirname(zipPath));
    if (useNativeZip) {
        // zip the temporary directory
        await (0, bestzip_1.bestzip)({
            source: '*',
            destination: zipPath,
            cwd: tempDirPath,
        });
        // delete the temporary folder
        fs_extra_1.default.removeSync(tempDirPath);
    }
    else {
        const zip = archiver_1.default.create('zip');
        const output = fs_extra_1.default.createWriteStream(zipPath);
        // write zip
        output.on('open', () => {
            zip.pipe(output);
            filesPathList.forEach((file) => {
                const stats = fs_extra_1.default.statSync(file.rootPath);
                if (stats.isDirectory())
                    return;
                zip.append(fs_extra_1.default.readFileSync(file.rootPath), {
                    name: file.localPath,
                    mode: stats.mode,
                    date: new Date(0), // necessary to get the same hash when zipping the same content
                });
            });
            zip.finalize();
        });
        return new Promise((resolve, reject) => {
            output.on('close', () => {
                // delete the temporary folder
                fs_extra_1.default.removeSync(tempDirPath);
                resolve();
            });
            zip.on('error', (err) => reject(err));
        });
    }
};
exports.zip = zip;
function trimExtension(entry) {
    return entry.slice(0, -path_1.default.extname(entry).length);
}
exports.trimExtension = trimExtension;
const isEmpty = (obj) => {
    for (const _i in obj)
        return false;
    return true;
};
exports.isEmpty = isEmpty;
