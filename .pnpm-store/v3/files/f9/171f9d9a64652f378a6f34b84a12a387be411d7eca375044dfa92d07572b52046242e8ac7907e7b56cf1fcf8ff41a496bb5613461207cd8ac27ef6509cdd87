/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module simply houses the help and version text and functions used by `apg-conv`.
//
// `module.help()` - returns the help text.
// Called if the `-h` or `--help` argument is present
// or if there are any input argument errors.
//
// `module.version()` - returns the version text.
// Called if the `-v` or `--version` argument is present.
//
module.exports = {
  help: function help() {
    let str = 'Usage:\n';
    str += 'apg-conv [options]\n';
    str += '(--help     | -h) display this help screen\n';
    str += '(--version  | -v) display version number\n';
    str += '(--src      | -s) <path>, the file to convert, default stdin\n';
    str += '(--src-type | -st) type, the source file type, default UTF8\n';
    str += '(--dst      | -d) <path>, the converted file, default stdout\n';
    str += '(--dst-type | -dt) type, the converted file type, default UTF8\n';
    str += '(--err      | -e) <path>, the error reporting file, default stderr\n';
    str += '\n';
    str += 'type - the byte stream encoding: may be one of:\n';
    str += 'UTF8\n';
    str += 'UTF16\n';
    str += 'UTF16BE\n';
    str += 'UTF16LE\n';
    str += 'UTF32\n';
    str += 'UTF32BE\n';
    str += 'UTF32LE\n';
    str += 'UINT7    (7-bit bytes)\n';
    str += 'ASCII    (alias for UINT7)\n';
    str += 'UINT8    (8-bit bytes or ISO 8859-1)\n';
    str += 'BINARY   (alias for UINT8)\n';
    str += 'UINT16   (alias for UINT16BE)\n';
    str += 'UINT16BE\n';
    str += 'UINT16LE\n';
    str += 'UINT32   (alias for UINT32BE)\n';
    str += 'UINT32BE\n';
    str += 'UINT32LE\n';
    str += 'ESCAPED\n';
    str += '\n';
    str += 'Type notes:\n';
    str += '- The type names are case insensitive.\n';
    str += '- Source types may be prefixed with BASE64:.\n';
    str += '  The input will be treated as base64 encoded.\n';
    str += '  It will be stripped of white space and control characters (\\t, \\r, \\n),\n';
    str += '  then base 64 decoded as an initial step.\n';
    str += '- Destination types may have a :BASE64 suffix.\n';
    str += '  The output will be base 64 encoded as a final step.\n';
    str += '- Destination types my be prefixed with CRLF:.\n';
    str += '  This will cause a line ending transformation prior to decoding.\n';
    str += '  CRLF(\\r\\n), CR(\\r) or LF(\\n) will be interpreted as line ends and transformed to CRLF.\n';
    str += '  CRLF will be added to the end if the last line end is missing.\n';
    str += '- Destination types my be prefixed with LF:.\n';
    str += '  This will cause a line ending transformation prior to decoding.\n';
    str += '  CRLF(\\r\\n), CR(\\r) or LF(\\n) will be interpreted as line ends and transformed to LF.\n';
    str += '  LF will be added to the end if the last line end is missing.\n';
    str += '- UTF type input data may have an optional Byte Order Mark (BOM)\n';
    str += '  - [Unicode Standard](http://www.unicode.org/versions/Unicode9.0.0/ch03.pdf#G7404).\n';
    str += '- UTF output data will not have a BOM.\n';
    str += '- UTF16 defaults to UTF16BE if there is no BOM.\n';
    str += '- UTF32 defaults to UTF32BE if there is no BOM.\n';
    str += "- An exception is thrown if a BOM is present and doesn't match the specified data type.\n";
    str += '- ASCII is an alias for UINT7, 7-bit unsigned integers.\n';
    str += '- BINARY is an alias for UINT8, 8-bit unsigned integers.\n';
    str += '- UINT16 is an alias for UINT16BE, big-endian, 16-bit unsigned integers.\n';
    str += '- UINT32 is an alias for UINT32BE, big-endian, 32-bit unsigned integers.\n';
    str += '- The ESCAPED format is identical to JavaScript string escaping except that\n';
    str += '  the grave accent (`) is used instead of the backslash (\\).\n';
    str += '  e.g \\xHH -> `xHH, \\uHHHH -> `uHHHH, \\u{HHHHHH} -> `u{HHHHHH}.\n';
    str += '  Its design is specifically for use in HTML <textarea> elements.\n';
    str += '\n';
    str += 'Examples:\n';
    str += '\n';
    str += 'apg-conv -s <inpath> -d <outpath> -st BINARY -dt UTF8\n';
    str += '  Convert a binary (Latin 1 or UINT8) file to UTF8.\n';
    str += '  That is, any characters > 0x7f will get two-byte, UTF8 encoding.\n';
    str += '\n';
    str += 'apg-conv -s <inpath> -d <outpath> -st ASCII -dt CRLF:ASCII\n';
    str += '  Convert all line ends(CRLF, LF or CR) of the ASCII file to CRLF(\\r\\n),\n';
    str += '  including the last even if missing in the input file.\n';
    str += '\n';
    str += 'apg-conv -s <inpath> -d <outpath> -st BASE64:UTF8 -dt UTF32\n';
    str += '  Perform an initial base 64 decoding of the input file,\n';
    str += '  then convert it from UTF8 to UTF32(BE) encoding.\n';
    str += '\n';
    str += 'apg-conv -s <inpath> -d <outpath> -st UTF8 -dt UTF32LE:BASE64\n';
    str += '  The input file is converted from UTF8 to UTF32LE and base 64 encoded as a final step.\n';
    str += '\n';
    str += 'apg-conv -s <inpath> -d <outpath> -st BASE64:UTF8 -dt LF:UTF16:BASE64\n';
    str += '  The input file is base 64 decoded. All line ends(CRLF, LF or CR) are converted to LF(\\n),\n';
    str += '  then converted to wide characters (UTF16) and finally base64 encoded.\n';
    str += '\n';
    return str;
  },
  version: function version() {
    return 'Version 4.0.0\nCopyright (c) 2021 Lowell D. Thomas, all rights reserved';
  },
};
