/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module is the main function for command line usage.
// It reads a source file and writes a destination file, converting the source format to the destination format.
// The files are all treated as byte streams.
// `stdin` and `stdout` are the default input and output streams.
//
// Run<br>
// `npm run apg-conv -- --help`<br>
// or<br>
// `./bin/apg-conv.sh --help`<br>
// to see the options.

module.exports = function exfn() {
  'use strict;';

  const SRC_FILEL = '--src';
  const SRC_FILES = '-s';
  const SRC_TYPEL = '--src-type';
  const SRC_TYPES = '-st';
  const DST_FILEL = '--dst';
  const DST_FILES = '-d';
  const DST_TYPEL = '--dst-type';
  const DST_TYPES = '-dt';
  const ERR_FILEL = '--err';
  const ERR_FILES = '-e';
  const HELPL = '--help';
  const HELPS = '-h';
  const VERSIONL = '--version';
  const VERSIONS = '-v';
  let srcType = 'UTF8';
  let dstType = 'UTF8';
  let srcFile = '';
  let dstFile = '';
  let errFile = '';
  const fs = require('fs');
  const api = require('../apg-conv-api/node-exports');
  const help = require('./help');
  const { convert } = api.converter;
  let srcStream = process.stdin;
  let dstStream = process.stdout;
  let errStream = process.stderr;
  let srcBuf;
  let dstBuf;
  const args = process.argv.slice(2);
  try {
    /* get the input arguments */
    if (!args || args.length === 0) {
      console.log(help.help());
      return;
    }
    for (let i = 0; i < args.length; i += 2) {
      const key = args[i].toLowerCase();
      if (key === HELPL || key === HELPS) {
        console.log(help.help());
        return;
      }
      if (key === VERSIONL || key === VERSIONS) {
        console.log(help.version());
        return;
      }
      const i1 = i + 1;
      if (i1 >= args.length) {
        throw new TypeError(`no matching value for option: ${key}`);
      }
      const value = args[i1];
      switch (key) {
        case SRC_FILEL:
        case SRC_FILES:
          srcFile = value;
          break;
        case SRC_TYPEL:
        case SRC_TYPES:
          srcType = value;
          break;
        case DST_FILEL:
        case DST_FILES:
          dstFile = value;
          break;
        case DST_TYPEL:
        case DST_TYPES:
          dstType = value;
          break;
        case ERR_FILEL:
        case ERR_FILES:
          errFile = value;
          break;
        default:
          throw new TypeError(`unrecognized option: ${key}`);
      }
    }

    /* disable STRING type, allowed by converter, but not here */
    if (srcType.toUpperCase() === 'STRING') {
      throw new Error('Input type may not be STRING.');
    }
    if (dstType.toUpperCase() === 'STRING') {
      throw new Error('Output type may not be STRING.');
    }

    /* create file streams, if necessary */
    if (srcFile) {
      srcStream = fs.createReadStream(srcFile, { flags: 'r' });
    }
    if (dstFile) {
      dstStream = fs.createWriteStream(dstFile, { flags: 'w' });
    }
    if (errFile) {
      errStream = fs.createWriteStream(errFile, { flags: 'w' });
    }

    /* read the input data */
    srcBuf = Buffer.alloc(0);
    srcStream.on('data', (chunkBuf) => {
      srcBuf = Buffer.concat([srcBuf, chunkBuf]);
    });

    srcStream.on('end', () => {
      try {
        /* translate the data */
        dstBuf = convert(srcType, srcBuf, dstType);

        /* write the translated the data */
        dstStream.write(dstBuf);
        if (dstFile) {
          dstStream.end();
        }
      } catch (e) {
        errStream.write(`EXCEPTION: on srcStream end: ${e.message}\n`);
      }
    });
    srcStream.on('error', (e) => {
      errStream.write(`srcStream error: ${e.message}\n`);
    });
    dstStream.on('error', (e) => {
      errStream.write(`dstStream error: ${e.message}\n`);
    });
  } catch (e) {
    errStream.write(`EXCEPTION: ${e.message}\n`);
    errStream.write(help.help());
  }
  if (errFile) {
    errStream.end();
  }
};
