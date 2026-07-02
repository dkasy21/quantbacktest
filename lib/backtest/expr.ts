// A minimal, SAFE boolean-expression evaluator for the "advanced mode".
// NOT using eval()/new Function() -- instead a small tokenizer +
// recursive-descent parser that only understands numbers, identifiers,
// comparisons, and boolean logic. No way to call functions or access globals.

export type ExprValue = number | boolean | null;
export type ExprContext = Record<string, ExprValue>;

type TokenType = 'NUM' | 'IDENT' | 'TRUE' | 'FALSE' | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH' | 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ' | 'NEQ' | 'AND' | 'OR' | 'NOT' | 'LPAREN' | 'RPAREN' | 'EOF';
interface Token { type: TokenType; value?: string; }

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;
  while (i < n) {
    const c = input[i];
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(input[i+1]??''))) {
      let j = i;
      while (j < n && /[0-9.]/.test(input[j])) j++;
      tokens.push({ type: 'NUM', value: input.slice(i, j) }); i = j; continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_]/.test(input[j])) j++;
      const word = input.slice(i, j);
      if (word === 'true') tokens.push({ type: 'TRUE' });
      else if (word === 'false') tokens.push({ type: 'FALSE' });
      else tokens.push({ type: 'IDENT', value: word });
      i = j; continue;
    }
    if (c === '&' && input[i+1] === '&') { tokens.push({ type: 'AND' }); i+=2; continue; }
    if (c === '|' && input[i+1] === '|') { tokens.push({ type: 'OR' }); i+=2; continue; }
    if (c === '>' && input[i+1] === '=') { tokens.push({ type: 'GTE' }); i+=2; continue; }
    if (c === '<' && input[i+1] === '=') { tokens.push({ type: 'LTE' }); i+=2; continue; }
    if (c === '=' && input[i+1] === '=') { tokens.push({ type: 'EQ' }); i+=2; continue; }
    if (c === '!' && input[i+1] === '=') { tokens.push({ type: 'NEQ' }); i+=2; continue; }
    if (c === '>') { tokens.push({ type: 'GT' }); i++; continue; }
    if (c === '<') { tokens.push({ type: 'LT' }); i++; continue; }
    if (c === '!') { tokens.push({ type: 'NOT' }); i++; continue; }
    if (c === '+') { tokens.push({ type: 'PLUS' }); i++; continue; }
    if (c === '-') { tokens.push({ type: 'MINUS' }); i++; continue; }
    if (c === '*') { tokens.push({ type: 'STAR' }); i++; continue; }
    if (c === '/') { tokens.push({ type: 'SLASH' }); i++; continue; }
    if (c === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (c === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }
    throw new Error(`Unexpected character in expression: "${c}" at position ${i}`);
  }
  tokens.push({ type: 'EOF' });
  return tokens;
}

class Parser {
  private pos = 0;
  private tokens: Token[];
  private ctx: ExprContext;
  constructor(tokens: Token[], ctx: ExprContext) {
    this.tokens = tokens;
    this.ctx = ctx;
  }
  private peek(): Token { return this.tokens[this.pos]; }
  private consume(): Token { return this.tokens[this.pos++]; }
  private expect(type: TokenType): Token {
    const t = this.consume();
    if (t.type !== type) throw new Error(`Expected ${type} but got ${t.type}`);
    return t;
  }
  private or(): ExprValue {
    let left = this.and();
    while (this.peek().type === 'OR') {
      this.consume();
      const right = this.and();
      left = left === null || right === null ? null : !!left || !!right;
    }
    return left;
  }
  private and(): ExprValue {
    let left = this.comparison();
    while (this.peek().type === 'AND') {
      this.consume();
      const right = this.comparison();
      left = left === null || right === null ? null : !!left && !!right;
    }
    return left;
  }
  private comparison(): ExprValue {
    const left = this.sum();
    const op = this.peek().type;
    if (op === 'GT' || op === 'GTE' || op === 'LT' || op === 'LTE' || op === 'EQ' || op === 'NEQ') {
      this.consume();
      const right = this.sum();
      if (left === null || right === null) return null;
      switch (op) {
        case 'GT': return Number(left) > Number(right);
        case 'GTE': return Number(left) >= Number(right);
        case 'LT': return Number(left) < Number(right);
        case 'LTE': return Number(left) <= Number(right);
        case 'EQ': return left === right;
        case 'NEQ': return left !== right;
      }
    }
    return left;
  }
  private sum(): ExprValue {
    let left = this.product();
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const op = this.consume().type;
      const right = this.product();
      if (left === null || right === null) { left = null; continue; }
      left = op === 'PLUS' ? Number(left) + Number(right) : Number(left) - Number(right);
    }
    return left;
  }
  private product(): ExprValue {
    let left = this.primary();
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      const op = this.consume().type;
      const right = this.primary();
      if (left === null || right === null) { left = null; continue; }
      if (op === 'SLASH' && Number(right) === 0) { left = null; continue; }
      left = op === 'STAR' ? Number(left) * Number(right) : Number(left) / Number(right);
    }
    return left;
  }
  private primary(): ExprValue {
    const t = this.peek();
    if (t.type === 'NUM') { this.consume(); return parseFloat(t.value!); }
    if (t.type === 'TRUE') { this.consume(); return true; }
    if (t.type === 'FALSE') { this.consume(); return false; }
    if (t.type === 'IDENT') {
      this.consume();
      const val = this.ctx[t.value!];
      return val !== undefined ? val : null;
    }
    if (t.type === 'NOT') {
      this.consume();
      const v = this.primary();
      return v === null ? null : !v;
    }
    if (t.type === 'MINUS') {
      this.consume();
      const v = this.primary();
      return v === null ? null : -Number(v);
    }
    if (t.type === 'LPAREN') {
      this.consume();
      const v = this.or();
      this.expect('RPAREN');
      return v;
    }
    throw new Error(`Unexpected token: ${t.type}`);
  }
  parse(): ExprValue {
    const result = this.or();
    if (this.peek().type !== 'EOF') throw new Error('Unexpected tokens after expression.');
    return result;
  }
}

export function evalExpr(expr: string, ctx: ExprContext): ExprValue {
  if (!expr.trim()) return null;
  return new Parser(tokenize(expr), ctx).parse();
}
