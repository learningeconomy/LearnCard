const test = require('tape');
const { stdio } = require('stdio-mock');
const { PassThrough } = require('stream');
const repl = require('..');
const memoizeStringTransformerMethod = require('../lib/memoize-string-transformer');

test('does not apply colors when not TTY', t => {
  t.plan(1);
  process.stdout.isTTY = undefined;
  const { stdin, stdout } = stdio();
  const prettyRepl = repl.start({
    prompt: 'test-prompt > ',
    input: stdin,
    output: stdout,
    colorize: str => str.replace(/const/, '<color>const</color>')
  });
  let out = '';
  stdout.on('data', data => {
    out += data;
    if (out.endsWith('\n')) {
      t.equal(out, 'test-prompt > const foo = 12\n', 'output is not colored');
    }
  });
  prettyRepl._writeToOutput('test-prompt > const foo = 12\n');
});

test('applies colors when necesssary', t => {
  t.plan(1);
  process.stdout.isTTY = true;
  const { stdin, stdout } = stdio();
  const prettyRepl = repl.start({
    prompt: 'test-prompt > ',
    input: stdin,
    output: stdout,
    colorize: str => str.replace(/const/, '<color>const</color>'),
    terminal: true
  });
  let out = '';
  stdout.on('data', data => {
    out += data;
    if (out.endsWith('\n')) {
      return t.equal(out, 'test-prompt > <color>const</color> foo = 12\n', 'output is colored');
    }
  });
  prettyRepl._writeToOutput('test-prompt > const foo = 12\n');
});

test('does not apply colors when not necesssary', t => {
  t.plan(1);
  process.stdout.isTTY = true;
  const { stdin, stdout } = stdio();
  const prettyRepl = repl.start({
    prompt: 'test-prompt > ',
    input: stdin,
    output: stdout,
    colorize: str => str.replace(/const/, '<color>const</color>')
  });
  let out = '';
  stdout.on('data', data => {
    out += data;
    if (out.endsWith('\n')) {
      t.equal(out, 'test-prompt > let foo = 12\n', 'output is not colored');
    }
  });
  prettyRepl._writeToOutput('test-prompt > let foo = 12\n');
});

test('picks colors independently of stdio', t => {
  t.plan(1);
  process.stdout.isTTY = undefined;
  const { stdin } = stdio();
  const output = new PassThrough();
  output.isTTY = true;
  output.getColorDepth = () => 8;
  const prettyRepl = repl.start({
    prompt: 'test-prompt > ',
    input: stdin,
    output: output
  });
  let out = '';
  output.setEncoding('utf8').on('data', data => {
    out += data;
    if (out.endsWith('\n')) {
      t.match(out, /(\x1b\[.*m)+let(\x1b\[.*m)+ foo = (\x1b\[.*m)+12(\x1b\[.*m)+/, 'output is colored');
    }
  });
  prettyRepl._writeToOutput('test-prompt > let foo = 12\n');
});

test('memoizeStringTransformerMethod', t => {
  t.plan(6);
  let i = 0;
  const cachedFn = memoizeStringTransformerMethod(3, (str) => {
    // Intentionally use something that depends on external state to test
    // the caching functionality.
    return `${i++}: ${str}`;
  });
  t.equal(cachedFn('foo'), '0: foo');
  t.equal(cachedFn('foo'), '0: foo');
  t.equal(cachedFn('bar'), '1: bar');
  t.equal(cachedFn('baz'), '2: baz');
  t.equal(cachedFn('qux'), '3: qux');
  t.equal(cachedFn('foo'), '4: foo');
});

test('stripCompleteJSStructures', t => {
  t.plan(11);
  const { stdin } = stdio();
  const output = new PassThrough();
  output.isTTY = true;
  output.getColorDepth = () => 8;
  const prettyRepl = repl.start({
    input: stdin,
    output: output
  });
  t.equal(prettyRepl._stripCompleteJSStructures('{a: (x) => x.y = 1}'), '');
  t.equal(prettyRepl._stripCompleteJSStructures('{x} `${unfinished'), ' `${unfinished');
  t.equal(prettyRepl._stripCompleteJSStructures('{(x}'), '{(x}');
  t.equal(prettyRepl._stripCompleteJSStructures(String.raw `"abc\"def"`), '');
  t.equal(prettyRepl._stripCompleteJSStructures(String.raw `"abc\\"def"`), 'def"');
  t.equal(prettyRepl._stripCompleteJSStructures(String.raw `"a\\\\bc\\"def"`), 'def"');
  t.equal(prettyRepl._stripCompleteJSStructures('(function {}'), '(function ');
  t.equal(prettyRepl._stripCompleteJSStructures('(function() {'), '(function() {');
  t.equal(prettyRepl._stripCompleteJSStructures('(function() => {'), '(function() => {');
  t.equal(prettyRepl._stripCompleteJSStructures('(function() => {}'), '(function => ');
  t.equal(prettyRepl._stripCompleteJSStructures('a.b([{x:{y: {z:[0, 10]}}}, {p:"$x"},{q'), 'a.b([, ,{q');
});

test('findMatchingBracket', t => {
  t.plan(10);
  const { stdin } = stdio();
  const output = new PassThrough();
  output.isTTY = true;
  output.getColorDepth = () => 8;
  const prettyRepl = repl.start({
    input: stdin,
    output: output
  });
  t.equal(prettyRepl._findMatchingBracket('abc { def }', 4), 10);
  t.equal(prettyRepl._findMatchingBracket('abc { def }', 10), 4);
  t.equal(prettyRepl._findMatchingBracket('abc {( def }', 4), 11);
  t.equal(prettyRepl._findMatchingBracket('abc {( def }', 5), -1);
  t.equal(prettyRepl._findMatchingBracket('abc {( def }', 0), -1);
  t.equal(prettyRepl._findMatchingBracket('abc {( def }', 11), 4);
  t.equal(prettyRepl._findMatchingBracket('"(")', 0), 2);
  t.equal(prettyRepl._findMatchingBracket('"(")', 1), -1);
  t.equal(prettyRepl._findMatchingBracket('`${foo}`', 1), 6);
  t.equal(prettyRepl._findMatchingBracket('(`${")"}`', 0), -1);
});

test('full pass-through test', t => {
  t.plan(1);
  process.stdout.isTTY = undefined;
  const input = new PassThrough();
  const output = new PassThrough();
  output.isTTY = true;
  output.getColorDepth = () => 8;
  const prettyRepl = repl.start({
    prompt: 'test-prompt > ',
    input: input,
    output: output,
    terminal: true
  });
  let out = '';
  output.setEncoding('utf8').on('data', data => {
    out += data;
    if (out.endsWith('\n') && !out.startsWith('<done>')) {
      t.equal(out, '\x1b[1G\x1b[0Jtest-prompt > \x1b[15Gle\b\b\x1b[36mlet\x1b[39m foo = \x1b[33m1\x1b[39m\x1b[33m2\x1b[39m\r\n');
      out = '<done>';
    }
  });
  input.write('let foo = 12\n');
});
