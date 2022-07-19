/* eslint-disable prefer-destructuring */
/* eslint-disable no-plusplus */
/* eslint-disable no-bitwise */
/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module contains the actual encoding and decoding algorithms.
// Throws "RangeError" exceptions on characters or bytes out of range for the given encoding.

'use strict;';

const thisThis = this;

/* decoding error codes */
const NON_SHORTEST = 0xfffffffc;
const TRAILING = 0xfffffffd;
const RANGE = 0xfffffffe;
const ILL_FORMED = 0xffffffff;

/* mask[n] = 2**n - 1, ie. mask[n] = n bits on. e.g. mask[6] = %b111111 */
const mask = [0, 1, 3, 7, 15, 31, 63, 127, 255, 511, 1023];

/* ascii[n] = 'HH', where 0xHH = n, eg. ascii[254] = 'FE' */
const ascii = [
  '00',
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '0A',
  '0B',
  '0C',
  '0D',
  '0E',
  '0F',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '1A',
  '1B',
  '1C',
  '1D',
  '1E',
  '1F',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '2A',
  '2B',
  '2C',
  '2D',
  '2E',
  '2F',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
  '39',
  '3A',
  '3B',
  '3C',
  '3D',
  '3E',
  '3F',
  '40',
  '41',
  '42',
  '43',
  '44',
  '45',
  '46',
  '47',
  '48',
  '49',
  '4A',
  '4B',
  '4C',
  '4D',
  '4E',
  '4F',
  '50',
  '51',
  '52',
  '53',
  '54',
  '55',
  '56',
  '57',
  '58',
  '59',
  '5A',
  '5B',
  '5C',
  '5D',
  '5E',
  '5F',
  '60',
  '61',
  '62',
  '63',
  '64',
  '65',
  '66',
  '67',
  '68',
  '69',
  '6A',
  '6B',
  '6C',
  '6D',
  '6E',
  '6F',
  '70',
  '71',
  '72',
  '73',
  '74',
  '75',
  '76',
  '77',
  '78',
  '79',
  '7A',
  '7B',
  '7C',
  '7D',
  '7E',
  '7F',
  '80',
  '81',
  '82',
  '83',
  '84',
  '85',
  '86',
  '87',
  '88',
  '89',
  '8A',
  '8B',
  '8C',
  '8D',
  '8E',
  '8F',
  '90',
  '91',
  '92',
  '93',
  '94',
  '95',
  '96',
  '97',
  '98',
  '99',
  '9A',
  '9B',
  '9C',
  '9D',
  '9E',
  '9F',
  'A0',
  'A1',
  'A2',
  'A3',
  'A4',
  'A5',
  'A6',
  'A7',
  'A8',
  'A9',
  'AA',
  'AB',
  'AC',
  'AD',
  'AE',
  'AF',
  'B0',
  'B1',
  'B2',
  'B3',
  'B4',
  'B5',
  'B6',
  'B7',
  'B8',
  'B9',
  'BA',
  'BB',
  'BC',
  'BD',
  'BE',
  'BF',
  'C0',
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
  'CA',
  'CB',
  'CC',
  'CD',
  'CE',
  'CF',
  'D0',
  'D1',
  'D2',
  'D3',
  'D4',
  'D5',
  'D6',
  'D7',
  'D8',
  'D9',
  'DA',
  'DB',
  'DC',
  'DD',
  'DE',
  'DF',
  'E0',
  'E1',
  'E2',
  'E3',
  'E4',
  'E5',
  'E6',
  'E7',
  'E8',
  'E9',
  'EA',
  'EB',
  'EC',
  'ED',
  'EE',
  'EF',
  'F0',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'F6',
  'F7',
  'F8',
  'F9',
  'FA',
  'FB',
  'FC',
  'FD',
  'FE',
  'FF',
];

/* vector of base 64 characters */
const base64chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='.split('');

/* vector of base 64 character codes */
const base64codes = [];
base64chars.forEach((char) => {
  base64codes.push(char.charCodeAt(0));
});

// The UTF8 algorithms.
exports.utf8 = {
  encode(chars) {
    const bytes = [];
    chars.forEach((char) => {
      if (char >= 0 && char <= 0x7f) {
        bytes.push(char);
      } else if (char <= 0x7ff) {
        bytes.push(0xc0 + ((char >> 6) & mask[5]));
        bytes.push(0x80 + (char & mask[6]));
      } else if (char < 0xd800 || (char > 0xdfff && char <= 0xffff)) {
        bytes.push(0xe0 + ((char >> 12) & mask[4]));
        bytes.push(0x80 + ((char >> 6) & mask[6]));
        bytes.push(0x80 + (char & mask[6]));
      } else if (char >= 0x10000 && char <= 0x10ffff) {
        const u = (char >> 16) & mask[5];
        bytes.push(0xf0 + (u >> 2));
        bytes.push(0x80 + ((u & mask[2]) << 4) + ((char >> 12) & mask[4]));
        bytes.push(0x80 + ((char >> 6) & mask[6]));
        bytes.push(0x80 + (char & mask[6]));
      } else {
        throw new RangeError(`utf8.encode: character out of range: char: ${char}`);
      }
    });
    return Buffer.from(bytes);
  },
  decode(buf, bom) {
    /* bytes functions return error for non-shortest forms & values out of range */
    function bytes2(b1, b2) {
      /* U+0080..U+07FF */
      /* 00000000 00000yyy yyxxxxxx | 110yyyyy 10xxxxxx */
      if ((b2 & 0xc0) !== 0x80) {
        return TRAILING;
      }
      const x = ((b1 & mask[5]) << 6) + (b2 & mask[6]);
      if (x < 0x80) {
        return NON_SHORTEST;
      }
      return x;
    }
    function bytes3(b1, b2, b3) {
      /* U+0800..U+FFFF */
      /* 00000000 zzzzyyyy yyxxxxxx | 1110zzzz 10yyyyyy 10xxxxxx */
      if ((b3 & 0xc0) !== 0x80 || (b2 & 0xc0) !== 0x80) {
        return TRAILING;
      }
      const x = ((b1 & mask[4]) << 12) + ((b2 & mask[6]) << 6) + (b3 & mask[6]);
      if (x < 0x800) {
        return NON_SHORTEST;
      }
      if (x >= 0xd800 && x <= 0xdfff) {
        return RANGE;
      }
      return x;
    }
    function bytes4(b1, b2, b3, b4) {
      /* U+10000..U+10FFFF */
      /* 000uuuuu zzzzyyyy yyxxxxxx | 11110uuu 10uuzzzz 10yyyyyy 10xxxxxx */
      if ((b4 & 0xc0) !== 0x80 || (b3 & 0xc0) !== 0x80 || (b2 & 0xc0) !== 0x80) {
        return TRAILING;
      }
      const x =
        ((((b1 & mask[3]) << 2) + ((b2 >> 4) & mask[2])) << 16) +
        ((b2 & mask[4]) << 12) +
        ((b3 & mask[6]) << 6) +
        (b4 & mask[6]);
      if (x < 0x10000) {
        return NON_SHORTEST;
      }
      if (x > 0x10ffff) {
        return RANGE;
      }
      return x;
    }
    let c;
    let b1;
    let i1;
    let i2;
    let i3;
    let inc;
    const len = buf.length;
    let i = bom ? 3 : 0;
    const chars = [];
    while (i < len) {
      b1 = buf[i];
      c = ILL_FORMED;
      const TRUE = true;
      while (TRUE) {
        if (b1 >= 0 && b1 <= 0x7f) {
          /* U+0000..U+007F 00..7F */
          c = b1;
          inc = 1;
          break;
        }
        i1 = i + 1;
        if (i1 < len && b1 >= 0xc2 && b1 <= 0xdf) {
          /* U+0080..U+07FF C2..DF 80..BF */
          c = bytes2(b1, buf[i1]);
          inc = 2;
          break;
        }
        i2 = i + 2;
        if (i2 < len && b1 >= 0xe0 && b1 <= 0xef) {
          /* U+0800..U+FFFF */
          c = bytes3(b1, buf[i1], buf[i2]);
          inc = 3;
          break;
        }
        i3 = i + 3;
        if (i3 < len && b1 >= 0xf0 && b1 <= 0xf4) {
          /* U+10000..U+10FFFF */
          c = bytes4(b1, buf[i1], buf[i2], buf[i3]);
          inc = 4;
          break;
        }
        /* if we fall through to here, it is an ill-formed sequence */
        break;
      }
      if (c > 0x10ffff) {
        const at = `byte[${i}]`;
        if (c === ILL_FORMED) {
          throw new RangeError(`utf8.decode: ill-formed UTF8 byte sequence found at: ${at}`);
        }
        if (c === TRAILING) {
          throw new RangeError(`utf8.decode: illegal trailing byte found at: ${at}`);
        }
        if (c === RANGE) {
          throw new RangeError(`utf8.decode: code point out of range found at: ${at}`);
        }
        if (c === NON_SHORTEST) {
          throw new RangeError(`utf8.decode: non-shortest form found at: ${at}`);
        }
        throw new RangeError(`utf8.decode: unrecognized error found at: ${at}`);
      }
      chars.push(c);
      i += inc;
    }
    return chars;
  },
};

// The UTF16BE algorithms.
exports.utf16be = {
  encode(chars) {
    const bytes = [];
    let char;
    let h;
    let l;
    for (let i = 0; i < chars.length; i += 1) {
      char = chars[i];
      if ((char >= 0 && char <= 0xd7ff) || (char >= 0xe000 && char <= 0xffff)) {
        bytes.push((char >> 8) & mask[8]);
        bytes.push(char & mask[8]);
      } else if (char >= 0x10000 && char <= 0x10ffff) {
        l = char - 0x10000;
        h = 0xd800 + (l >> 10);
        l = 0xdc00 + (l & mask[10]);
        bytes.push((h >> 8) & mask[8]);
        bytes.push(h & mask[8]);
        bytes.push((l >> 8) & mask[8]);
        bytes.push(l & mask[8]);
      } else {
        throw new RangeError(`utf16be.encode: UTF16BE value out of range: char[${i}]: ${char}`);
      }
    }
    return Buffer.from(bytes);
  },
  decode(buf, bom) {
    /* assumes caller has insured that buf is a Buffer of bytes */
    if (buf.length % 2 > 0) {
      throw new RangeError(`utf16be.decode: data length must be even multiple of 2: length: ${buf.length}`);
    }
    const chars = [];
    const len = buf.length;
    let i = bom ? 2 : 0;
    let j = 0;
    let c;
    let inc;
    let i1;
    let i3;
    let high;
    let low;
    while (i < len) {
      const TRUE = true;
      while (TRUE) {
        i1 = i + 1;
        if (i1 < len) {
          high = (buf[i] << 8) + buf[i1];
          if (high < 0xd800 || high > 0xdfff) {
            c = high;
            inc = 2;
            break;
          }
          i3 = i + 3;
          if (i3 < len) {
            low = (buf[i + 2] << 8) + buf[i3];
            if (high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff) {
              c = 0x10000 + ((high - 0xd800) << 10) + (low - 0xdc00);
              inc = 4;
              break;
            }
          }
        }
        /* if we fall through to here, it is an ill-formed sequence */
        throw new RangeError(`utf16be.decode: ill-formed UTF16BE byte sequence found: byte[${i}]`);
      }
      chars[j++] = c;
      i += inc;
    }
    return chars;
  },
};

// The UTF16LE algorithms.
exports.utf16le = {
  encode(chars) {
    const bytes = [];
    let char;
    let h;
    let l;
    for (let i = 0; i < chars.length; i += 1) {
      char = chars[i];
      if ((char >= 0 && char <= 0xd7ff) || (char >= 0xe000 && char <= 0xffff)) {
        bytes.push(char & mask[8]);
        bytes.push((char >> 8) & mask[8]);
      } else if (char >= 0x10000 && char <= 0x10ffff) {
        l = char - 0x10000;
        h = 0xd800 + (l >> 10);
        l = 0xdc00 + (l & mask[10]);
        bytes.push(h & mask[8]);
        bytes.push((h >> 8) & mask[8]);
        bytes.push(l & mask[8]);
        bytes.push((l >> 8) & mask[8]);
      } else {
        throw new RangeError(`utf16le.encode: UTF16LE value out of range: char[${i}]: ${char}`);
      }
    }
    return Buffer.from(bytes);
  },
  decode(buf, bom) {
    /* assumes caller has insured that buf is a Buffer of bytes */
    if (buf.length % 2 > 0) {
      throw new RangeError(`utf16le.decode: data length must be even multiple of 2: length: ${buf.length}`);
    }
    const chars = [];
    const len = buf.length;
    let i = bom ? 2 : 0;
    let j = 0;
    let c;
    let inc;
    let i1;
    let i3;
    let high;
    let low;
    while (i < len) {
      const TRUE = true;
      while (TRUE) {
        i1 = i + 1;
        if (i1 < len) {
          high = (buf[i1] << 8) + buf[i];
          if (high < 0xd800 || high > 0xdfff) {
            c = high;
            inc = 2;
            break;
          }
          i3 = i + 3;
          if (i3 < len) {
            low = (buf[i3] << 8) + buf[i + 2];
            if (high <= 0xdbff && low >= 0xdc00 && low <= 0xdfff) {
              c = 0x10000 + ((high - 0xd800) << 10) + (low - 0xdc00);
              inc = 4;
              break;
            }
          }
        }
        /* if we fall through to here, it is an ill-formed sequence */
        throw new RangeError(`utf16le.decode: ill-formed UTF16LE byte sequence found: byte[${i}]`);
      }
      chars[j++] = c;
      i += inc;
    }
    return chars;
  },
};

// The UTF32BE algorithms.
exports.utf32be = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length * 4);
    let i = 0;
    chars.forEach((char) => {
      if ((char >= 0xd800 && char <= 0xdfff) || char > 0x10ffff) {
        throw new RangeError(`utf32be.encode: UTF32BE character code out of range: char[${i / 4}]: ${char}`);
      }
      buf[i++] = (char >> 24) & mask[8];
      buf[i++] = (char >> 16) & mask[8];
      buf[i++] = (char >> 8) & mask[8];
      buf[i++] = char & mask[8];
    });
    return buf;
  },
  decode(buf, bom) {
    /* caller to insure buf is a Buffer of bytes */
    if (buf.length % 4 > 0) {
      throw new RangeError(`utf32be.decode: UTF32BE byte length must be even multiple of 4: length: ${buf.length}`);
    }
    const chars = [];
    let i = bom ? 4 : 0;
    for (; i < buf.length; i += 4) {
      const char = (buf[i] << 24) + (buf[i + 1] << 16) + (buf[i + 2] << 8) + buf[i + 3];
      if ((char >= 0xd800 && char <= 0xdfff) || char > 0x10ffff) {
        throw new RangeError(`utf32be.decode: UTF32BE character code out of range: char[${i / 4}]: ${char}`);
      }
      chars.push(char);
    }
    return chars;
  },
};

// The UTF32LE algorithms.
exports.utf32le = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length * 4);
    let i = 0;
    chars.forEach((char) => {
      if ((char >= 0xd800 && char <= 0xdfff) || char > 0x10ffff) {
        throw new RangeError(`utf32le.encode: UTF32LE character code out of range: char[${i / 4}]: ${char}`);
      }
      buf[i++] = char & mask[8];
      buf[i++] = (char >> 8) & mask[8];
      buf[i++] = (char >> 16) & mask[8];
      buf[i++] = (char >> 24) & mask[8];
    });
    return buf;
  },
  decode(buf, bom) {
    /* caller to insure buf is a Buffer of bytes */
    if (buf.length % 4 > 0) {
      throw new RangeError(`utf32be.decode: UTF32LE byte length must be even multiple of 4: length: ${buf.length}`);
    }
    const chars = [];
    let i = bom ? 4 : 0;
    for (; i < buf.length; i += 4) {
      const char = (buf[i + 3] << 24) + (buf[i + 2] << 16) + (buf[i + 1] << 8) + buf[i];
      if ((char >= 0xd800 && char <= 0xdfff) || char > 0x10ffff) {
        throw new RangeError(`utf32le.encode: UTF32LE character code out of range: char[${i / 4}]: ${char}`);
      }
      chars.push(char);
    }
    return chars;
  },
};

// The UINT7 algorithms. ASCII or 7-bit unsigned integers.
exports.uint7 = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length);
    for (let i = 0; i < chars.length; i += 1) {
      if (chars[i] > 0x7f) {
        throw new RangeError(`uint7.encode: UINT7 character code out of range: char[${i}]: ${chars[i]}`);
      }
      buf[i] = chars[i];
    }
    return buf;
  },
  decode(buf) {
    const chars = [];
    for (let i = 0; i < buf.length; i += 1) {
      if (buf[i] > 0x7f) {
        throw new RangeError(`uint7.decode: UINT7 character code out of range: byte[${i}]: ${buf[i]}`);
      }
      chars[i] = buf[i];
    }
    return chars;
  },
};

// The UINT8 algorithms. BINARY, Latin 1 or 8-bit unsigned integers.
exports.uint8 = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length);
    for (let i = 0; i < chars.length; i += 1) {
      if (chars[i] > 0xff) {
        throw new RangeError(`uint8.encode: UINT8 character code out of range: char[${i}]: ${chars[i]}`);
      }
      buf[i] = chars[i];
    }
    return buf;
  },
  decode(buf) {
    const chars = [];
    for (let i = 0; i < buf.length; i += 1) {
      chars[i] = buf[i];
    }
    return chars;
  },
};

// The UINT16BE algorithms. Big-endian 16-bit unsigned integers.
exports.uint16be = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length * 2);
    let i = 0;
    chars.forEach((char) => {
      if (char > 0xffff) {
        throw new RangeError(`uint16be.encode: UINT16BE character code out of range: char[${i / 2}]: ${char}`);
      }
      buf[i++] = (char >> 8) & mask[8];
      buf[i++] = char & mask[8];
    });
    return buf;
  },
  decode(buf) {
    if (buf.length % 2 > 0) {
      throw new RangeError(`uint16be.decode: UINT16BE byte length must be even multiple of 2: length: ${buf.length}`);
    }
    const chars = [];
    for (let i = 0; i < buf.length; i += 2) {
      chars.push((buf[i] << 8) + buf[i + 1]);
    }
    return chars;
  },
};

// The UINT16LE algorithms. Little-endian 16-bit unsigned integers.
exports.uint16le = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length * 2);
    let i = 0;
    chars.forEach((char) => {
      if (char > 0xffff) {
        throw new RangeError(`uint16le.encode: UINT16LE character code out of range: char[${i / 2}]: ${char}`);
      }
      buf[i++] = char & mask[8];
      buf[i++] = (char >> 8) & mask[8];
    });
    return buf;
  },
  decode(buf) {
    if (buf.length % 2 > 0) {
      throw new RangeError(`uint16le.decode: UINT16LE byte length must be even multiple of 2: length: ${buf.length}`);
    }
    const chars = [];
    for (let i = 0; i < buf.length; i += 2) {
      chars.push((buf[i + 1] << 8) + buf[i]);
    }
    return chars;
  },
};

// The UINT32BE algorithms. Big-endian 32-bit unsigned integers.
exports.uint32be = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length * 4);
    let i = 0;
    chars.forEach((char) => {
      buf[i++] = (char >> 24) & mask[8];
      buf[i++] = (char >> 16) & mask[8];
      buf[i++] = (char >> 8) & mask[8];
      buf[i++] = char & mask[8];
    });
    return buf;
  },
  decode(buf) {
    if (buf.length % 4 > 0) {
      throw new RangeError(`uint32be.decode: UINT32BE byte length must be even multiple of 4: length: ${buf.length}`);
    }
    const chars = [];
    for (let i = 0; i < buf.length; i += 4) {
      chars.push((buf[i] << 24) + (buf[i + 1] << 16) + (buf[i + 2] << 8) + buf[i + 3]);
    }
    return chars;
  },
};

// The UINT32LE algorithms. Little-endian 32-bit unsigned integers.
exports.uint32le = {
  encode(chars) {
    const buf = Buffer.alloc(chars.length * 4);
    let i = 0;
    chars.forEach((char) => {
      buf[i++] = char & mask[8];
      buf[i++] = (char >> 8) & mask[8];
      buf[i++] = (char >> 16) & mask[8];
      buf[i++] = (char >> 24) & mask[8];
    });
    return buf;
  },
  decode(buf) {
    /* caller to insure buf is a Buffer of bytes */
    if (buf.length % 4 > 0) {
      throw new RangeError(`uint32le.decode: UINT32LE byte length must be even multiple of 4: length: ${buf.length}`);
    }
    const chars = [];
    for (let i = 0; i < buf.length; i += 4) {
      chars.push((buf[i + 3] << 24) + (buf[i + 2] << 16) + (buf[i + 1] << 8) + buf[i]);
    }
    return chars;
  },
};

// The STRING algorithms. Converts JavaScript strings to Array of 32-bit integers and vice versa.
// Uses the node.js Buffer's native "utf16le" capabilites.
exports.string = {
  encode(chars) {
    return thisThis.utf16le.encode(chars).toString('utf16le');
  },
  decode(str) {
    return thisThis.utf16le.decode(Buffer.from(str, 'utf16le'), 0);
  },
};

// The ESCAPED algorithms.
// Note that ESCAPED format contains only ASCII characters.
// The characters are always in the form of a Buffer of bytes.
exports.escaped = {
  // Encodes an Array of 32-bit integers into ESCAPED format.
  encode(chars) {
    const bytes = [];
    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i];
      if (char === 96) {
        bytes.push(char);
        bytes.push(char);
      } else if (char === 10) {
        bytes.push(char);
      } else if (char >= 32 && char <= 126) {
        bytes.push(char);
      } else {
        let str = '';
        if (char >= 0 && char <= 31) {
          str += `\`x${ascii[char]}`;
        } else if (char >= 127 && char <= 255) {
          str += `\`x${ascii[char]}`;
        } else if (char >= 0x100 && char <= 0xffff) {
          str += `\`u${ascii[(char >> 8) & mask[8]]}${ascii[char & mask[8]]}`;
        } else if (char >= 0x10000 && char <= 0xffffffff) {
          str += '`u{';
          const digit = (char >> 24) & mask[8];
          if (digit > 0) {
            str += ascii[digit];
          }
          str += `${ascii[(char >> 16) & mask[8]] + ascii[(char >> 8) & mask[8]] + ascii[char & mask[8]]}}`;
        } else {
          throw new Error('escape.encode(char): char > 0xffffffff not allowed');
        }
        const buf = Buffer.from(str);
        buf.forEach((b) => {
          bytes.push(b);
        });
      }
    }
    return Buffer.from(bytes);
  },
  // Decodes ESCAPED format from a Buffer of bytes to an Array of 32-bit integers.
  decode(buf) {
    function isHex(hex) {
      if ((hex >= 48 && hex <= 57) || (hex >= 65 && hex <= 70) || (hex >= 97 && hex <= 102)) {
        return true;
      }
      return false;
    }
    function getx(i, len, bufArg) {
      const ret = { char: null, nexti: i + 2, error: true };
      if (i + 1 < len) {
        if (isHex(bufArg[i]) && isHex(bufArg[i + 1])) {
          const str = String.fromCodePoint(bufArg[i], bufArg[i + 1]);
          ret.char = parseInt(str, 16);
          if (!Number.isNaN(ret.char)) {
            ret.error = false;
          }
        }
      }
      return ret;
    }
    function getu(i, len, bufArg) {
      const ret = { char: null, nexti: i + 4, error: true };
      if (i + 3 < len) {
        if (isHex(bufArg[i]) && isHex(bufArg[i + 1]) && isHex(bufArg[i + 2]) && isHex(bufArg[i + 3])) {
          const str = String.fromCodePoint(bufArg[i], bufArg[i + 1], bufArg[i + 2], bufArg[i + 3]);
          ret.char = parseInt(str, 16);
          if (!Number.isNaN(ret.char)) {
            ret.error = false;
          }
        }
      }
      return ret;
    }
    function getU(i, len, bufArg) {
      const ret = { char: null, nexti: i + 4, error: true };
      let str = '';
      while (i < len && isHex(bufArg[i])) {
        str += String.fromCodePoint(bufArg[i]);
        // eslint-disable-next-line no-param-reassign
        i += 1;
      }
      ret.char = parseInt(str, 16);
      if (bufArg[i] === 125 && !Number.isNaN(ret.char)) {
        ret.error = false;
      }
      ret.nexti = i + 1;
      return ret;
    }
    const chars = [];
    const len = buf.length;
    let i1;
    let ret;
    let error;
    let i = 0;
    while (i < len) {
      const TRUE = true;
      while (TRUE) {
        error = true;
        if (buf[i] !== 96) {
          /* unescaped character */
          chars.push(buf[i]);
          i += 1;
          error = false;
          break;
        }
        i1 = i + 1;
        if (i1 >= len) {
          break;
        }
        if (buf[i1] === 96) {
          /* escaped grave accent */
          chars.push(96);
          i += 2;
          error = false;
          break;
        }
        if (buf[i1] === 120) {
          ret = getx(i1 + 1, len, buf);
          if (ret.error) {
            break;
          }
          /* escaped hex */
          chars.push(ret.char);
          i = ret.nexti;
          error = false;
          break;
        }
        if (buf[i1] === 117) {
          if (buf[i1 + 1] === 123) {
            ret = getU(i1 + 2, len, buf);
            if (ret.error) {
              break;
            }
            /* escaped utf-32 */
            chars.push(ret.char);
            i = ret.nexti;
            error = false;
            break;
          }
          ret = getu(i1 + 1, len, buf);
          if (ret.error) {
            break;
          }
          /* escaped utf-16 */
          chars.push(ret.char);
          i = ret.nexti;
          error = false;
          break;
        }
        break;
      }
      if (error) {
        throw new Error(`escaped.decode: ill-formed escape sequence at buf[${i}]`);
      }
    }
    return chars;
  },
};

// The line end conversion algorigthms.
const CR = 13;
const LF = 10;
exports.lineEnds = {
  crlf(chars) {
    const lfchars = [];
    let i = 0;
    while (i < chars.length) {
      switch (chars[i]) {
        case CR:
          if (i + 1 < chars.length && chars[i + 1] === LF) {
            i += 2;
          } else {
            i += 1;
          }
          lfchars.push(CR);
          lfchars.push(LF);
          break;
        case LF:
          lfchars.push(CR);
          lfchars.push(LF);
          i += 1;
          break;
        default:
          lfchars.push(chars[i]);
          i += 1;
          break;
      }
    }
    if (lfchars.length > 0 && lfchars[lfchars.length - 1] !== LF) {
      lfchars.push(CR);
      lfchars.push(LF);
    }
    return lfchars;
  },
  lf(chars) {
    const lfchars = [];
    let i = 0;
    while (i < chars.length) {
      switch (chars[i]) {
        case CR:
          if (i + 1 < chars.length && chars[i + 1] === LF) {
            i += 2;
          } else {
            i += 1;
          }
          lfchars.push(LF);
          break;
        case LF:
          lfchars.push(LF);
          i += 1;
          break;
        default:
          lfchars.push(chars[i]);
          i += 1;
          break;
      }
    }
    if (lfchars.length > 0 && lfchars[lfchars.length - 1] !== LF) {
      lfchars.push(LF);
    }
    return lfchars;
  },
};

// The base 64 algorithms.
exports.base64 = {
  encode(buf) {
    if (buf.length === 0) {
      return Buffer.alloc(0);
    }
    let i;
    let j;
    let n;
    let tail = buf.length % 3;
    tail = tail > 0 ? 3 - tail : 0;
    let units = (buf.length + tail) / 3;
    const base64 = Buffer.alloc(units * 4);
    if (tail > 0) {
      units -= 1;
    }
    i = 0;
    j = 0;
    for (let u = 0; u < units; u += 1) {
      n = buf[i++] << 16;
      n += buf[i++] << 8;
      n += buf[i++];
      base64[j++] = base64codes[(n >> 18) & mask[6]];
      base64[j++] = base64codes[(n >> 12) & mask[6]];
      base64[j++] = base64codes[(n >> 6) & mask[6]];
      base64[j++] = base64codes[n & mask[6]];
    }
    if (tail === 0) {
      return base64;
    }
    if (tail === 1) {
      n = buf[i++] << 16;
      n += buf[i] << 8;
      base64[j++] = base64codes[(n >> 18) & mask[6]];
      base64[j++] = base64codes[(n >> 12) & mask[6]];
      base64[j++] = base64codes[(n >> 6) & mask[6]];
      base64[j] = base64codes[64];
      return base64;
    }
    if (tail === 2) {
      n = buf[i] << 16;
      base64[j++] = base64codes[(n >> 18) & mask[6]];
      base64[j++] = base64codes[(n >> 12) & mask[6]];
      base64[j++] = base64codes[64];
      base64[j] = base64codes[64];
      return base64;
    }
    return undefined;
  },
  decode(codes) {
    /* remove white space and ctrl characters, validate & translate characters */
    function validate(buf) {
      const chars = [];
      let tail = 0;
      for (let i = 0; i < buf.length; i += 1) {
        const char = buf[i];
        const TRUE = true;
        while (TRUE) {
          if (char === 32 || char === 9 || char === 10 || char === 13) {
            break;
          }
          if (char >= 65 && char <= 90) {
            chars.push(char - 65);
            break;
          }
          if (char >= 97 && char <= 122) {
            chars.push(char - 71);
            break;
          }
          if (char >= 48 && char <= 57) {
            chars.push(char + 4);
            break;
          }
          if (char === 43) {
            chars.push(62);
            break;
          }
          if (char === 47) {
            chars.push(63);
            break;
          }
          if (char === 61) {
            chars.push(64);
            tail += 1;
            break;
          }
          /* invalid character */
          throw new RangeError(`base64.decode: invalid character buf[${i}]: ${char}`);
        }
      }
      /* validate length */
      if (chars.length % 4 > 0) {
        throw new RangeError(`base64.decode: string length not integral multiple of 4: ${chars.length}`);
      }
      /* validate tail */
      switch (tail) {
        case 0:
          break;
        case 1:
          if (chars[chars.length - 1] !== 64) {
            throw new RangeError('base64.decode: one tail character found: not last character');
          }
          break;
        case 2:
          if (chars[chars.length - 1] !== 64 || chars[chars.length - 2] !== 64) {
            throw new RangeError('base64.decode: two tail characters found: not last characters');
          }
          break;
        default:
          throw new RangeError(`base64.decode: more than two tail characters found: ${tail}`);
      }
      return { tail, buf: Buffer.from(chars) };
    }

    if (codes.length === 0) {
      return Buffer.alloc(0);
    }
    const val = validate(codes);
    const { tail } = val;
    const base64 = val.buf;
    let i;
    let j;
    let n;
    let units = base64.length / 4;
    const buf = Buffer.alloc(units * 3 - tail);
    if (tail > 0) {
      units -= 1;
    }
    j = 0;
    i = 0;
    for (let u = 0; u < units; u += 1) {
      n = base64[i++] << 18;
      n += base64[i++] << 12;
      n += base64[i++] << 6;
      n += base64[i++];
      buf[j++] = (n >> 16) & mask[8];
      buf[j++] = (n >> 8) & mask[8];
      buf[j++] = n & mask[8];
    }
    if (tail === 1) {
      n = base64[i++] << 18;
      n += base64[i++] << 12;
      n += base64[i] << 6;
      buf[j++] = (n >> 16) & mask[8];
      buf[j] = (n >> 8) & mask[8];
    }
    if (tail === 2) {
      n = base64[i++] << 18;
      n += base64[i++] << 12;
      buf[j] = (n >> 16) & mask[8];
    }
    return buf;
  },
  // Converts a base 64 Buffer of bytes to a JavaScript string with line breaks.
  toString(buf) {
    if (buf.length % 4 > 0) {
      throw new RangeError(`base64.toString: input buffer length not multiple of 4: ${buf.length}`);
    }
    let str = '';
    let lineLen = 0;
    function buildLine(c1, c2, c3, c4) {
      switch (lineLen) {
        case 76:
          str += `\r\n${c1}${c2}${c3}${c4}`;
          lineLen = 4;
          break;
        case 75:
          str += `${c1}\r\n${c2}${c3}${c4}`;
          lineLen = 3;
          break;
        case 74:
          str += `${c1 + c2}\r\n${c3}${c4}`;
          lineLen = 2;
          break;
        case 73:
          str += `${c1 + c2 + c3}\r\n${c4}`;
          lineLen = 1;
          break;
        default:
          str += c1 + c2 + c3 + c4;
          lineLen += 4;
          break;
      }
    }
    function validate(c) {
      if (c >= 65 && c <= 90) {
        return true;
      }
      if (c >= 97 && c <= 122) {
        return true;
      }
      if (c >= 48 && c <= 57) {
        return true;
      }
      if (c === 43) {
        return true;
      }
      if (c === 47) {
        return true;
      }
      if (c === 61) {
        return true;
      }
      return false;
    }
    for (let i = 0; i < buf.length; i += 4) {
      for (let j = i; j < i + 4; j += 1) {
        if (!validate(buf[j])) {
          throw new RangeError(`base64.toString: buf[${j}]: ${buf[j]} : not valid base64 character code`);
        }
      }
      buildLine(
        String.fromCharCode(buf[i]),
        String.fromCharCode(buf[i + 1]),
        String.fromCharCode(buf[i + 2]),
        String.fromCharCode(buf[i + 3])
      );
    }
    return str;
  },
};
