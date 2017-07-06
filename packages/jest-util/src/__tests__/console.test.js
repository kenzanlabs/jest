/**
 * Copyright (c) 2014-present, Facebook, Inc. All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @emails oncall+jsinfra
 */
'use strict';

const CustomConsole = require('../Console');

describe('CustomConsole', () => {
  let _console;
  let consoleOutput = '';

  beforeEach(() => {
    // Initialise the console and override the console.log function to keep
    // track of the output.
    _console = new CustomConsole(process.stdout, process.stderr);

    _console._log = (type, ...args) => {
      const typeChar = {
        error: 'E',
        info: 'I',
        log: 'L',
        warn: 'W',
      };
      const indentation = _console._generateIndentation();
      consoleOutput += `${typeChar[type]}: ${indentation}${args.join(', ')}\n`;
    };
    consoleOutput = '';
  });

  describe('inherited functions', () => {
    // These functions should be inherited from Console. Make sure they do
    // exist.
    it('should exist', () => {
      expect(typeof _console.dir).toBe('function');
      expect(typeof _console.time).toBe('function');
      expect(typeof _console.timeEnd).toBe('function');
      expect(typeof _console.trace).toBe('function');
    });
  });

  describe('assert', () => {
    it('should log the given text if the assertion is false', () => {
      _console.assert(false, '1');
      _console.assert(1 < 0, '2');
      expect(consoleOutput).toBe('L: 1\nL: 2\n');
    });

    it('should not log the given text if the assertion is true', () => {
      _console.assert(true, '1');
      _console.assert(1 > 0, '2');
      expect(consoleOutput).toBe('');
    });
  });

  describe('count', () => {
    it('should output the number of times count has been called', () => {
      _console.count();
      _console.count();
      expect(consoleOutput).toBe('L: <no label>: 1\nL: <no label>: 2\n');
    });

    it('should output the number of times count() has been called with a certain label', () => {
      _console.count();
      _console.count('label1');
      _console.count('label1');
      _console.count();
      _console.count('label1');
      _console.count('label2');
      _console.count('label2');
      _console.count('label1');
      expect(consoleOutput).toBe(
        [
          'L: <no label>: 1',
          'L: label1: 1',
          'L: label1: 2',
          'L: <no label>: 2',
          'L: label1: 3',
          'L: label2: 1',
          'L: label2: 2',
          'L: label1: 4',
        ].join('\n') + '\n',
      );
    });
  });

  describe('error/exception', () => {
    it('should output the error', () => {
      _console.error('bad things happened');
      _console.exception('bad things happened');
      expect(consoleOutput).toBe(
        ['E: bad things happened', 'E: bad things happened'].join('\n') + '\n',
      );
    });

    it('should output all of the arguments passed in', () => {
      _console.error('bad things happened', 'more bad things');
      _console.error({error: 'this is', very: 'bad'}, '~ Yoda', 1);
      expect(consoleOutput).toBe(
        [
          'E: bad things happened more bad things',
          "E: { error: 'this is', very: 'bad' } '~ Yoda' 1",
        ].join('\n') + '\n',
      );
    });
  });

  describe('group/groupCollapsed/groupEnd', () => {
    it('should indent the logs one level', () => {
      _console.log('This is the outer level');
      _console.group();
      _console.log('Level 2');
      _console.group();
      _console.log('Level 3');
      _console.warn('More of level 3');
      _console.groupEnd();
      _console.log('Back to level 2');
      _console.groupCollapsed();
      _console.log('Inside collapsed');
      _console.groupEnd();
      _console.groupEnd();
      _console.log('Back to the outer level');

      expect(consoleOutput).toBe(
        [
          'L: This is the outer level',
          'L: > Level 2',
          'L: > > Level 3',
          'W: > > More of level 3',
          'L: > Back to level 2',
          'L: > > Inside collapsed',
          'L: Back to the outer level',
        ].join('\n') + '\n',
      );
    });

    it('should print the label, if given', () => {
      _console.log('This is the outer level');
      _console.group('Group 1');
      _console.log('Level 2');
      _console.group('Group 2');
      _console.log('Level 3');
      _console.warn('More of level 3');
      _console.groupEnd();
      _console.log('Back to level 2');
      _console.groupEnd();
      _console.log('Back to the outer level');

      expect(consoleOutput).toBe(
        [
          'L: This is the outer level',
          'L: > Group 1',
          'L: > Level 2',
          'L: > > Group 2',
          'L: > > Level 3',
          'W: > > More of level 3',
          'L: > Back to level 2',
          'L: Back to the outer level',
        ].join('\n') + '\n',
      );
    });
  });

  describe('info', () => {
    it('should output the given text', () => {
      _console.info(1);
      _console.info('info');
      expect(consoleOutput).toBe('I: 1\nI: info\n');
    });

    it('should output all of the arguments passed in', () => {
      _console.info('something happened', 'more things');
      _console.info({interesting: 'this is'}, '~ Yoda', 1);
      expect(consoleOutput).toBe(
        [
          'I: something happened more things',
          "I: { interesting: 'this is' } '~ Yoda' 1",
        ].join('\n') + '\n',
      );
    });
  });

  describe('log', () => {
    it('should output the given object', () => {
      _console.log(1);
      _console.log('log');
      _console.log({a: 10});
      expect(consoleOutput).toBe('L: 1\nL: log\nL: { a: 10 }\n');
    });

    it('should output all of the arguments passed in', () => {
      _console.log('something happened', 'more things');
      _console.log({interesting: 'this is'}, '~ Yoda', 1);
      expect(consoleOutput).toBe(
        [
          'L: something happened more things',
          "L: { interesting: 'this is' } '~ Yoda' 1",
        ].join('\n') + '\n',
      );
    });
  });

  describe('table', () => {
    it('should output nothing if an object or array is not passed in', () => {
      _console.table();
      _console.table('hello');
      _console.table(3);
      expect(consoleOutput).toBe('');
    });

    it('should print an empty table if there are no elements in the object or array', () => {
      _console.table([]);
      _console.table({});
      expect(consoleOutput).toBe(
        [
          'L: ___________________',
          'L: | (index) | Value |',
          'L: |---------|-------|',
          'L: ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾',
          'L: ___________________',
          'L: | (index) | Value |',
          'L: |---------|-------|',
          'L: ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾',
        ].join('\n') + '\n',
      );
    });

    it('should print each of the elements of an array on its own line', () => {
      _console.table([{a: 1, b: 2, c: 3}, 4, 3, 2, 1]);
      expect(consoleOutput).toBe(
        [
          'L: _________________________________',
          'L: | (index) | Value               |',
          'L: |---------|---------------------|',
          'L: | 0       | {"a":1,"b":2,"c":3} |',
          'L: | 1       | 4                   |',
          'L: | 2       | 3                   |',
          'L: | 3       | 2                   |',
          'L: | 4       | 1                   |',
          'L: ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾',
        ].join('\n') + '\n',
      );
    });

    it('should print each of the key-value pairs of an object on its own line', () => {
      _console.table({a: 1, c: [3, 4, 3, 2, 1], reallyLongKey: 2});
      expect(consoleOutput).toBe(
        [
          'L: _______________________________',
          'L: | (index)       | Value       |',
          'L: |---------------|-------------|',
          'L: | a             | 1           |',
          'L: | c             | [3,4,3,2,1] |',
          'L: | reallyLongKey | 2           |',
          'L: ‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾‾',
        ].join('\n') + '\n',
      );
    });
  });

  describe('warn', () => {
    it('should output the given object', () => {
      _console.warn(1);
      _console.warn('warn');
      _console.warn({a: 10});
      expect(consoleOutput).toBe('W: 1\nW: warn\nW: { a: 10 }\n');
    });

    it('should output all of the arguments passed in', () => {
      _console.warn('something happened', 'more things');
      _console.warn({warning: 'this is'}, '~ Yoda', 1);
      expect(consoleOutput).toBe(
        [
          'W: something happened more things',
          "W: { warning: 'this is' } '~ Yoda' 1",
        ].join('\n') + '\n',
      );
    });
  });
});
