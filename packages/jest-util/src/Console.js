/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 */
/* global stream$Writable */
/* global tty$WriteStream */

import type {LogType, LogMessage} from 'types/Console';

import {format} from 'util';
import {Console} from 'console';
import clearLine from './clear_line';

type Formatter = (type: LogType, message: LogMessage) => string;

class CustomConsole extends Console {
  _stdout: stream$Writable;
  _formatBuffer: Formatter;
  _groupLevel: number;
  _counts: Object;
  _outWidth: number;

  constructor(
    stdout: stream$Writable,
    stderr: stream$Writable,
    formatBuffer: ?Formatter,
  ) {
    super(stdout, stderr);
    this._formatBuffer = formatBuffer || ((type, message) => message);
    this._groupLevel = 0;
    this._counts = {};

    // If we can find the width of the console, do so. Default to 80. This
    // value is used to calculate the table width.
    this._outWidth = 80;
    if (stdout instanceof tty$WriteStream) {
      this._outWidth = (stdout: tty$WriteStream).columns;
    }
  }

  _generateIndentation() {
    return '> '.repeat(this._groupLevel);
  }

  _log(type: LogType, message: string) {
    clearLine(this._stdout);
    super.log(
      `${this._generateIndentation()}${this._formatBuffer(type, message)}`,
    );
  }

  assert(assertion: mixed, ...args: Array<mixed>) {
    if (!assertion) {
      this.log(...args);
    }
  }

  clear() {}

  count(label: string = '<no label>') {
    if (!this._counts[label]) {
      this._counts[label] = 0;
    }
    this._counts[label]++;
    this._log('log', `${label}: ${this._counts[label]}`);
  }

  error(...args: Array<mixed>) {
    this._log('error', format.apply(null, arguments));
  }

  exception(...args: Array<mixed>) {
    this.error(...args);
  }

  group(label: ?string) {
    this._groupLevel++;
    if (label) {
      this.log(label);
    }
  }

  groupCollapsed() {
    this.group();
  }

  groupEnd() {
    this._groupLevel--;
  }

  info(...args: Array<mixed>) {
    this._log('info', format.apply(null, arguments));
  }

  log(...args: Array<mixed>) {
    this._log('log', format.apply(null, arguments));
  }

  table(data: ?any, columns: ?Array<mixed>) {
    if (!data || typeof data !== 'object') {
      return;
    }

    // Right pad a string to match the given width or truncate it if it is too
    // long.
    const pad = (str: string, width: number) => {
      if (str.length > width) {
        return str.substring(0, width);
      }
      return str + ' '.repeat(width - str.toString().length);
    };

    // Find the maximum value of an array using the given evaluator.
    const max = (arr: Array<any>, evaluator: (el: any) => number): number => {
      let maxEval = -Infinity;
      for (const el of arr) {
        const evaluatedValue = evaluator(el);
        maxEval = maxEval === null
          ? evaluatedValue
          : Math.max(maxEval, evaluatedValue);
      }
      return maxEval;
    };

    // Converts any data to a readable string
    const stringify = (value): string =>
      JSON.stringify(value).replace(/\n/g, '');

    // Determine the maximum length of the keys and values on the object
    const keys: Array<string> = Object.keys(data) || [];
    const maxKeyLen = max(keys, el => el.toString().length);
    const maxValueWidth = max(Object.values(data), el => stringify(el).length);

    let keyWidth = Math.max(maxKeyLen, '(index)'.length);
    let valueWidth = Math.max(maxValueWidth, 'Value'.length);
    let totalTableWidth = keyWidth + valueWidth + 7;

    // Make the table fit in the width of the window
    while (totalTableWidth > this._outWidth) {
      if (valueWidth > keyWidth) {
        valueWidth--;
      } else {
        keyWidth--;
      }
      totalTableWidth = keyWidth + valueWidth + 7;
    }

    const keyHeader = pad('(index)', keyWidth);
    const valueHeader = pad('Value', valueWidth);

    // Draw the actual table
    this.log('_'.repeat(totalTableWidth));
    this.log(`| ${keyHeader} | ${valueHeader} |`);
    this.log(`|${'-'.repeat(keyWidth + 2)}|${'-'.repeat(valueWidth + 2)}|`);
    for (const key: string of keys) {
      const value = stringify(data[key]);
      this.log(
        `| ${pad(key.toString(), keyWidth)} | ${pad(value, valueWidth)} |`,
      );
    }
    this.log('‾'.repeat(totalTableWidth));
  }

  warn(...args: Array<mixed>) {
    this._log('warn', format.apply(null, arguments));
  }

  getBuffer() {
    return null;
  }
}

module.exports = CustomConsole;
