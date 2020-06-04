/* Copyright 2020 The TensorFlow Authors. All Rights Reserved.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
==============================================================================*/
/**
 * Utility functions for the NgRx store of Debugger V2.
 */

import {SourceFileSpec} from './debugger_types';

/**
 * Find the index of a file spec among an array of file specs.
 * @param fileList
 * @param fileSpec
 * @returns The index of `fileSpec` in `fileList`. If not found, `-1`.
 */
export function findFileIndex(
  fileList: SourceFileSpec[],
  fileSpec: SourceFileSpec
): number {
  return fileList.findIndex(
    (item: SourceFileSpec) =>
      item.host_name === fileSpec.host_name &&
      item.file_path === fileSpec.file_path
  );
}

/**
 * Find the first range (with begin and end properties) in an array of ranges
 * that equals `[begin, end)`.
 *
 * @param ranges The ranges to search in.
 * @param begin The begin of the range to search for (inclusive).
 * @param end The end of the range to search for (exclusive).
 * @returns Index (>=0) if found. -1 if not found.
 */
export function findBeginEndRangeIndex(
  ranges: Array<{begin: number; end: number}>,
  begin: number,
  end: number
): number {
  if (begin >= end) {
    throw new Error(
      `Expected begin to be less than end, ` +
        `but got begin=${begin}, end=${end}`
    );
  }
  return ranges.findIndex(
    (range) => range.begin === begin && range.end === end
  );
}

/**
 * Determines if an array of ranges contains a range that strictly includes
 * `[begin, end)`.
 *
 * @param ranges The ranges to search in.
 * @param begin The begin of the range to search for (inclusive).
 * @param end The end of the range to search for (exclusive).
 * @returns `True` if and only if one of the ranges of `ranges` strictly
 *   includes `[begin, end)`.
 */
export function beginEndRangesInclude(
  ranges: Array<{begin: number; end: number}>,
  begin: number,
  end: number
): boolean {
  if (begin >= end) {
    throw new Error(
      `Expected begin to be less than end, ` +
        `but got begin=${begin}, end=${end}`
    );
  }
  return (
    ranges.findIndex((range) => range.begin >= begin && range.end <= end) !== -1
  );
}
