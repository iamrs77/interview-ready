/*
 * "Run" on a block that continues an earlier one ("Step 2" uses the class from "Step 1") would fail alone with
 * "X is not defined". So before running a block, we put in front of it the earlier blocks on the page it needs:
 *   - for each name it uses but doesn't declare, the nearest earlier block that declares that name,
 *   - the blocks in between that carry on with that name (`cache.put(1, 1)`, `Stack.prototype.peek = ...`),
 *   - and, in turn, whatever those blocks need.
 * A block that needs nothing runs as it is. This only reads the code (a small tokenizer), it never runs it.
 */

type Token = {
  kind: 'name' | 'punct' | 'value';
  text: string;
  line: number;
  depth: number;
};

type BlockInfo = {
  // Names declared at the top level of the block (what later blocks can use).
  topLevel: Set<string>;
  // Names the block uses but does not declare: they must come from an earlier block.
  needs: Set<string>;
  // Names the block works with when it runs, like `cache.put(1, 1)` or `list.forEach((item) => ...)`.
  // Uses inside a function or class that the block only declares don't count.
  touched: Set<string>;
  // import/export cannot run in the playground, so such a block is never added.
  isModule: boolean;
};

const OPENERS = new Set(['(', '[', '{', '${']);
const CLOSERS = new Set([')', ']', '}']);

// After these keywords a "/" starts a regex, not a division.
const BEFORE_REGEX = new Set([
  'return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof',
  'yield', 'await',
]);

// "name(...) {" is a method or function, except after these.
const NOT_A_METHOD = new Set(['if', 'for', 'while', 'switch', 'with', 'return', 'await', 'typeof']);

// Words that are never the name of a variable.
const KEYWORDS = new Set([
  'async', 'await', 'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger', 'default', 'delete', 'do',
  'else', 'export', 'extends', 'false', 'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof', 'let',
  'new', 'null', 'of', 'return', 'super', 'switch', 'this', 'throw', 'true', 'try', 'typeof', 'undefined', 'var',
  'void', 'while', 'with', 'yield',
]);

function isNameStart(char: string): boolean {
  // "#" starts a private field name: #menu.
  return /[A-Za-z_$#]/.test(char);
}

function isNameChar(char: string): boolean {
  return /[\w$]/.test(char);
}

/** Splits code into names, punctuation and values. Comments and the text of strings are dropped. */
function tokenize(code: string): Token[] {
  const tokens: Token[] = [];
  // What each open "{" is: a normal brace, or the "${" of a template string.
  const braces: string[] = [];
  let index = 0;
  let line = 1;

  function push(kind: Token['kind'], text: string) {
    tokens.push({ kind, text, line, depth: 0 });
  }

  function skipPast(end: string) {
    while (index < code.length && !code.startsWith(end, index)) {
      if (code[index] === '\n') {
        line += 1;
      }
      index += 1;
    }
    index += end.length;
  }

  // Reads a template string up to its closing backtick, or up to a "${".
  function readTemplate() {
    while (index < code.length) {
      const char = code[index];
      if (char === '\\') {
        index += 2;
        continue;
      }
      if (char === '`') {
        index += 1;
        return;
      }
      if (char === '$' && code[index + 1] === '{') {
        index += 2;
        braces.push('${');
        push('punct', '${');
        return;
      }
      if (char === '\n') {
        line += 1;
      }
      index += 1;
    }
  }

  function regexCanStartHere(): boolean {
    const previous = tokens[tokens.length - 1];
    if (!previous) {
      return true;
    }
    if (previous.kind === 'name') {
      return BEFORE_REGEX.has(previous.text);
    }
    if (previous.kind === 'value') {
      return false;
    }
    return previous.text !== ')' && previous.text !== ']';
  }

  while (index < code.length) {
    const char = code[index];

    if (char === '\n') {
      line += 1;
      index += 1;
    } else if (/\s/.test(char)) {
      index += 1;
    } else if (code.startsWith('//', index)) {
      skipPast('\n');
      line += 1;
    } else if (code.startsWith('/*', index)) {
      skipPast('*/');
    } else if (char === '"' || char === "'") {
      index += 1;
      while (index < code.length && code[index] !== char && code[index] !== '\n') {
        index += code[index] === '\\' ? 2 : 1;
      }
      index += 1;
      push('value', 'string');
    } else if (char === '`') {
      index += 1;
      push('value', 'template');
      readTemplate();
    } else if (char === '/' && regexCanStartHere()) {
      index += 1;
      let inClass = false;
      while (index < code.length && code[index] !== '\n') {
        const regexChar = code[index];
        if (regexChar === '\\') {
          index += 2;
          continue;
        }
        if (regexChar === '[') {
          inClass = true;
        } else if (regexChar === ']') {
          inClass = false;
        } else if (regexChar === '/' && !inClass) {
          break;
        }
        index += 1;
      }
      index += 1;
      while (index < code.length && isNameChar(code[index])) {
        index += 1;
      }
      push('value', 'regex');
    } else if (isNameStart(char)) {
      const start = index;
      // Step past the first character: it may be "#", which isn't a name character.
      index += 1;
      while (index < code.length && isNameChar(code[index])) {
        index += 1;
      }
      push('name', code.slice(start, index));
    } else if (/[0-9]/.test(char) || (char === '.' && /[0-9]/.test(code[index + 1] ?? ''))) {
      while (index < code.length && /[\w.]/.test(code[index])) {
        index += 1;
      }
      push('value', 'number');
    } else if (code.startsWith('?.', index) && !/[0-9]/.test(code[index + 2] ?? '')) {
      index += 2;
      push('punct', '?.');
    } else if (code.startsWith('=>', index) || code.startsWith('...', index)) {
      const text = code.startsWith('=>', index) ? '=>' : '...';
      index += text.length;
      push('punct', text);
    } else if (char === '}' && braces[braces.length - 1] === '${') {
      // The end of a "${...}" inside a template string: carry on reading the string.
      braces.pop();
      index += 1;
      push('punct', '}');
      readTemplate();
    } else {
      if (char === '{') {
        braces.push('{');
      } else if (char === '}') {
        braces.pop();
      }
      index += 1;
      push('punct', char);
    }
  }

  // How deep in brackets each token is. A bracket pair gets the depth of the code around it.
  let depth = 0;
  for (const token of tokens) {
    if (token.kind === 'punct' && CLOSERS.has(token.text)) {
      depth = Math.max(0, depth - 1);
    }
    token.depth = depth;
    if (token.kind === 'punct' && OPENERS.has(token.text)) {
      depth += 1;
    }
  }
  return tokens;
}

/** For each opening bracket, the index of its closing bracket. */
function matchBrackets(tokens: Token[]): Map<number, number> {
  const matches = new Map<number, number>();
  const open: number[] = [];
  tokens.forEach((token, index) => {
    if (token.kind !== 'punct') {
      return;
    }
    if (OPENERS.has(token.text)) {
      open.push(index);
    } else if (CLOSERS.has(token.text) && open.length > 0) {
      matches.set(open.pop() as number, index);
    }
  });
  return matches;
}

function analyze(code: string): BlockInfo {
  const tokens = tokenize(code);
  const matches = matchBrackets(tokens);

  // Which "{" open the body of a function, method or class. Code in there runs later, not when the block runs.
  const bodyStarts = new Set<number>();
  const classBodies = new Set<number>();
  tokens.forEach((token, index) => {
    if (token.text !== '{') {
      return;
    }
    const previous = tokens[index - 1];
    if (previous?.text === '=>') {
      bodyStarts.add(index);
    } else if (previous?.text === ')') {
      for (const [openIndex, closeIndex] of matches) {
        const beforeParen = tokens[openIndex - 1]?.text ?? '';
        if (closeIndex === index - 1 && !NOT_A_METHOD.has(beforeParen) && beforeParen !== 'catch') {
          bodyStarts.add(index);
        }
      }
    } else {
      // `class Name {` or `class Name extends Base {`
      const recent = tokens.slice(Math.max(0, index - 4), index).map((recentToken) => recentToken.text);
      if (recent.includes('class')) {
        bodyStarts.add(index);
        classBodies.add(index);
      }
    }
  });

  // The body of an arrow function with no braces, like `(error) => console.log(error)`, also runs later.
  const inArrowBody = new Set<number>();
  tokens.forEach((token, index) => {
    if (token.text !== '=>' || tokens[index + 1]?.text === '{') {
      return;
    }
    for (let i = index + 1; i < tokens.length; i++) {
      const current = tokens[i];
      const ended = current.depth < token.depth
        || (current.depth === token.depth && (current.text === ',' || current.text === ';'))
        || (token.depth === 0 && i > index + 1 && current.line > tokens[i - 1].line);
      if (ended) {
        break;
      }
      inArrowBody.add(i);
    }
  });

  // For each token: is it inside a function or class body, and which bracket holds it.
  const inBody: boolean[] = [];
  // Inside the body of a function, method or class (not an arrow function passed along as a callback).
  const inDeclaredBody: boolean[] = [];
  const holder: number[] = [];
  const openBrackets: number[] = [];
  tokens.forEach((token, index) => {
    if (token.kind === 'punct' && CLOSERS.has(token.text)) {
      openBrackets.pop();
    }
    inBody[index] = inArrowBody.has(index) || openBrackets.some((openIndex) => bodyStarts.has(openIndex));
    inDeclaredBody[index] = openBrackets.some((openIndex) => {
      return bodyStarts.has(openIndex) && tokens[openIndex - 1]?.text !== '=>';
    });
    holder[index] = openBrackets[openBrackets.length - 1] ?? -1;
    if (token.kind === 'punct' && OPENERS.has(token.text)) {
      openBrackets.push(index);
    }
  });

  const topLevel = new Set<string>();
  // Every name declared anywhere, and those declared outside any function (in a top-level loop, `catch`, ...).
  const declared = new Set<string>();
  const declaredOutsideFunctions = new Set<string>();
  // Tokens that declare a name, or name a method: not uses.
  const notUses = new Set<number>();

  function declare(index: number, atTop: boolean, isParameter: boolean) {
    const name = tokens[index].text;
    declared.add(name);
    if (!isParameter && !inBody[index]) {
      declaredOutsideFunctions.add(name);
    }
    if (atTop) {
      topLevel.add(name);
    }
    notUses.add(index);
  }

  // Declares every name inside brackets: parameters, or a destructuring pattern like { a, b } or [x, y].
  function declareInside(openIndex: number, isParameter: boolean) {
    const closeIndex = matches.get(openIndex) ?? openIndex;
    // Only a pattern (`const { a, b }`) can declare top-level names. Parameters and `catch (error)` cannot.
    const atTop = tokens[openIndex].depth === 0 && tokens[openIndex].text !== '(';
    const innerDepth = tokens[openIndex].depth + 1;
    // In `rule = new ExactFinishRule()` only `rule` is declared. The default value after "=" is code that runs.
    let inDefault = false;
    for (let i = openIndex + 1; i < closeIndex; i++) {
      const token = tokens[i];
      if (token.depth === innerDepth && token.text === '=') {
        inDefault = true;
      } else if (token.depth === innerDepth && token.text === ',') {
        inDefault = false;
      }
      // In { key: value } the binding is "value"; "key" is only a property name.
      const isKey = tokens[i + 1]?.text === ':';
      if (token.kind === 'name' && !isKey && !inDefault) {
        declare(i, atTop, isParameter);
      }
    }
  }

  // Declares the name or pattern at this index, as with `const name` or `const { a, b }`.
  function declareBinding(index: number, atTop: boolean): number {
    const token = tokens[index];
    if (!token) {
      return index;
    }
    if (token.kind === 'name') {
      declare(index, atTop, false);
      return index + 1;
    }
    if (token.text === '{' || token.text === '[') {
      declareInside(index, false);
      return (matches.get(index) ?? index) + 1;
    }
    return index + 1;
  }

  // A declaration starts a statement when nothing (or only `export`/`async`) is in front of it.
  function startsStatement(index: number): boolean {
    let before = index - 1;
    while (before >= 0 && ['async', 'export', 'default'].includes(tokens[before].text)) {
      before -= 1;
    }
    if (before < 0) {
      return true;
    }
    const previous = tokens[before];
    return previous.text === ';' || previous.text === '}' || previous.text === '{' || previous.line < tokens[index].line;
  }

  tokens.forEach((token, index) => {
    const previous = tokens[index - 1];
    const atTop = token.depth === 0;

    if (token.kind === 'name' && ['const', 'let', 'var'].includes(token.text)) {
      // `const a = 1, b = 2;` declares both. Stop at ";" or at the end of the line.
      let cursor = declareBinding(index + 1, atTop);
      while (cursor < tokens.length) {
        const current = tokens[cursor];
        if (current.depth < token.depth || (current.depth === token.depth && current.text === ';')) {
          break;
        }
        const newLine = current.line > tokens[cursor - 1].line && tokens[cursor - 1].text !== ',';
        if (current.depth === token.depth && newLine) {
          break;
        }
        if (current.depth === token.depth && current.text === ',') {
          cursor = declareBinding(cursor + 1, atTop);
          continue;
        }
        cursor += 1;
      }
      return;
    }

    if (token.kind === 'name' && (token.text === 'function' || token.text === 'class')) {
      let nameIndex = index + 1;
      if (tokens[nameIndex]?.text === '*') {
        nameIndex += 1;
      }
      const nameToken = tokens[nameIndex];
      if (nameToken?.kind === 'name' && nameToken.text !== 'extends') {
        declare(nameIndex, atTop && startsStatement(index), false);
      }
      return;
    }

    if (token.text === '=>') {
      if (previous?.kind === 'name') {
        declare(index - 1, false, true);
      } else if (previous?.text === ')') {
        for (const [openIndex, closeIndex] of matches) {
          if (closeIndex === index - 1) {
            declareInside(openIndex, true);
          }
        }
      }
      return;
    }

    // "name(params) {": a method, a function or `catch (error) {`. The parameters are declarations.
    if (token.text === '(' && tokens[(matches.get(index) ?? index) + 1]?.text === '{') {
      if (previous?.kind === 'name' && !NOT_A_METHOD.has(previous.text)) {
        declareInside(index, previous.text !== 'catch');
        notUses.add(index - 1);
      }
    }
  });

  const usedNow = new Set<string>();
  const usedLater = new Set<string>();
  const touched = new Set<string>();
  tokens.forEach((token, index) => {
    if (token.kind !== 'name' || notUses.has(index) || KEYWORDS.has(token.text)) {
      return;
    }
    // A field or method name written straight inside a class: `count = 0;`, `get size()`.
    // The value after "=" is still a use: `#inventory = new Inventory();`.
    if (classBodies.has(holder[index])) {
      const before = tokens[index - 1];
      const memberStarts = ['{', ';', '}', 'static', 'get', 'set', 'async', '*'];
      if (!before || before.line < token.line || memberStarts.includes(before.text)) {
        return;
      }
    }
    const previous = tokens[index - 1];
    const next = tokens[index + 1];
    const isProperty = previous?.text === '.' || previous?.text === '?.';
    const isObjectKey = next?.text === ':' && (previous?.text === '{' || previous?.text === ',');
    if (isProperty || isObjectKey) {
      return;
    }
    if (!inDeclaredBody[index]) {
      touched.add(token.text);
    }
    if (inBody[index]) {
      usedLater.add(token.text);
    } else {
      usedNow.add(token.text);
    }
  });

  // A name used right away comes from earlier unless the block declares it in its own top-level code.
  // A name used inside a function comes from earlier unless the block declares it anywhere.
  const needs = new Set<string>();
  for (const name of usedNow) {
    if (!topLevel.has(name) && !declaredOutsideFunctions.has(name)) {
      needs.add(name);
    }
  }
  for (const name of usedLater) {
    if (!declared.has(name)) {
      needs.add(name);
    }
  }

  return { topLevel, needs, touched, isModule: /^\s*(import|export)\s/m.test(code) };
}

/** How many more "{" than "}" the code has. A class split over several blocks opens in one and closes in another. */
function openBraces(code: string): number {
  let count = 0;
  for (const token of tokenize(code)) {
    if (token.text === '{' || token.text === '${') {
      count += 1;
    } else if (token.text === '}') {
      count -= 1;
    }
  }
  return count;
}

type Unit = { first: number; last: number; code: string };

/**
 * Joins the blocks of a class (or function) that is split over several blocks ("The class goes on over the next
 * three blocks"), so they are always run together. Every other block is a unit of its own.
 */
function groupIntoUnits(blocks: string[]): Unit[] {
  const units: Unit[] = [];
  let index = 0;
  while (index < blocks.length) {
    let last = index;
    let open = openBraces(blocks[index]);
    while (open > 0 && last + 1 < blocks.length) {
      last += 1;
      open += openBraces(blocks[last]);
    }
    // The braces never close: the block is broken on purpose, so keep it on its own.
    if (open !== 0) {
      last = index;
    }
    units.push({ first: index, last, code: blocks.slice(index, last + 1).join('\n') });
    index = last + 1;
  }
  return units;
}

/**
 * The code to run when Run is clicked on blocks[index]: the block itself, with the earlier blocks it needs put
 * in front (in page order). Returns the block unchanged when it needs nothing from earlier.
 */
export function codeWithEarlierSteps(blocks: string[], index: number): string {
  const units = groupIntoUnits(blocks);
  const target = units.findIndex((unit) => unit.first <= index && index <= unit.last);
  const infos = units.slice(0, target + 1).map((unit) => analyze(unit.code));
  const included = new Set<number>();
  // Which picked unit declares each name. A unit that declares one of them again is never added,
  // because two `const x` in one run is a SyntaxError.
  const declaredBy = new Map<string, number>();
  // Names already checked for units that carry on with them.
  const followed = new Set<string>();
  const queue: number[] = [];

  function add(unitIndex: number) {
    for (const name of infos[unitIndex].topLevel) {
      declaredBy.set(name, unitIndex);
    }
    included.add(unitIndex);
    queue.push(unitIndex);
  }

  function canAdd(unitIndex: number): boolean {
    if (included.has(unitIndex) || infos[unitIndex].isModule) {
      return false;
    }
    for (const name of infos[unitIndex].topLevel) {
      if (declaredBy.has(name)) {
        return false;
      }
    }
    return true;
  }

  add(target);

  /**
   * The unit that declares `name` for `user`: the nearest one before it. If there is none, a later one that still
   * comes before the clicked block (a class can use, inside a method, a class written further down the page).
   */
  function findSource(name: string, user: number): number {
    for (let unitIndex = user - 1; unitIndex >= 0; unitIndex--) {
      if (infos[unitIndex].topLevel.has(name)) {
        return unitIndex;
      }
    }
    for (let unitIndex = user + 1; unitIndex < target; unitIndex++) {
      if (infos[unitIndex].topLevel.has(name)) {
        return unitIndex;
      }
    }
    return -1;
  }

  while (queue.length > 0) {
    const current = queue.shift() as number;
    const info = infos[current];

    for (const name of info.needs) {
      let source = declaredBy.get(name);
      if (source === undefined) {
        source = findSource(name, current);
        if (source < 0 || !canAdd(source)) {
          continue;
        }
        add(source);
      }
      if (source === target || followed.has(name)) {
        continue;
      }
      followed.add(name);

      // The units between the source and the clicked block that carry on with this name.
      for (let between = source + 1; between < target; between++) {
        if (infos[between].touched.has(name) && canAdd(between)) {
          add(between);
        }
      }
    }
  }

  const unit = units[target];
  const isSplit = unit.first !== unit.last;
  if (included.size === 1 && !isSplit) {
    return blocks[index];
  }

  const lines: string[] = [];
  if (included.size > 1) {
    const earlier = [...included]
      .filter((unitIndex) => unitIndex !== target)
      .sort((a, b) => a - b)
      .map((unitIndex) => units[unitIndex].code.trim());
    lines.push('// Earlier code on this page that this block needs:', '', earlier.join('\n\n'), '');
  }
  if (isSplit) {
    lines.push('// The block you ran, joined with the other blocks it was split into:');
  } else {
    lines.push('// The block you ran:');
  }
  lines.push('', unit.code);
  return lines.join('\n');
}
