/*  *************************************************************************************
 *   copyright: Copyright (c) 2021 Lowell D. Thomas, all rights reserved
 *     license: BSD-2-Clause (https://opensource.org/licenses/BSD-2-Clause)
 *   ********************************************************************************* */
// This module acts as a "circular buffer". It is used to keep track
// only the last N records in an array of records. If more than N records
// are saved, each additional record overwrites the previously oldest record.
// This module deals only with the record indexes and does not save
// any actual records. It is used by [`trace.js`](./trace.html) for limiting the number of
// trace records saved.
module.exports = function exportsCircularBuffer() {
  'use strict;';

  const thisFileName = 'circular-buffer.js: ';
  let itemIndex = -1;
  let maxListSize = 0;
  // Initialize buffer.<br>
  // *size* is `maxListSize`, the maximum number of records saved before overwriting begins.
  this.init = function init(size) {
    if (typeof size !== 'number' || size <= 0) {
      throw new Error(`${thisFileName}init: circular buffer size must an integer > 0`);
    }
    maxListSize = Math.ceil(size);
    itemIndex = -1;
  };
  // Call this to increment the number of records collected.<br>
  // Returns the array index number to store the next record in.
  this.increment = function increment() {
    itemIndex += 1;
    return (itemIndex + maxListSize) % maxListSize;
  };
  // Returns `maxListSize` - the maximum number of records to keep in the buffer.
  this.maxSize = function maxSize() {
    return maxListSize;
  };
  // Returns the highest number of items saved.<br>
  // (The number of items is the actual number of records processed
  // even though only `maxListSize` records are actually retained.)
  this.items = function items() {
    return itemIndex + 1;
  };
  // Returns the record number associated with this item index.
  this.getListIndex = function getListIndex(item) {
    if (itemIndex === -1) {
      return -1;
    }
    if (item < 0 || item > itemIndex) {
      return -1;
    }
    if (itemIndex - item >= maxListSize) {
      return -1;
    }
    return (item + maxListSize) % maxListSize;
  };
  // The iterator over the circular buffer.
  // The user's function, `fn`, will be called with arguments `fn(listIndex, itemIndex)`
  // where `listIndex` is the saved record index and `itemIndex` is the actual item index.
  this.forEach = function forEach(fn) {
    if (itemIndex === -1) {
      /* no records have been collected */
      return;
    }
    if (itemIndex < maxListSize) {
      /* fewer than maxListSize records have been collected - number of items = number of records */
      for (let i = 0; i <= itemIndex; i += 1) {
        fn(i, i);
      }
      return;
    }
    /* start with the oldest record saved and finish with the most recent record saved */
    for (let i = itemIndex - maxListSize + 1; i <= itemIndex; i += 1) {
      const listIndex = (i + maxListSize) % maxListSize;
      fn(listIndex, i);
    }
  };
};
