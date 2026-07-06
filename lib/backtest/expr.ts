// A minimal, SAFE boolean-expression evaluator for the "advanced mode" of
// the rule builder. Deliberately NOT using eval()/new Function() since
// this runs server-side on arbitrary user input — instead this is a
// small hand-rolled tokenizer + recursive-descent parser that only
// understands numbers, identifiers (signal ids), comparisons, and
// boolean logic. There is no way for it to call functions, access
// globals, or execute side effects.
//
// Grammar (highest to lowest precedence):
//   primary    := NUMBER | TRUE | FALSE | IDENT | '(' or ')' | '!' unary
//   product    := primary (('*'|'/') primary)*
//   sum        := product (('+'|'-') product)*
//   comparison := sum (('>'|'>='|'<'|'<='|'=='|'!=') sum)?
//   and        := comparison ('&&' comparison)*
//   or         := and ('||' and)*

export type ExprValue = number | boolean | null;
export type ExprContext = Record<string, ExprValue>;

type TokenType =
  | 'NUM' | 'IDENT' | 'TRUE' | 'FALSE'
  | 'PLUS' | 'MINUS' | 'STAR' | 'SLASH'
  | 'GT' | 'GTE' | 'LT' | 'LTE' | 'EQ' | 'NEQ'
  | 'AND' | 'OR' | 'NOT'
  | 'LPAREN' | 'RPAREN' | 'EOF';

interface Token {
  type: TokenType;
  value?: string;
}

function tokenize(input: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = input.length;

  while (i < n) {
    const c = input[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(input[i + 1] ?? ''))) {
      let j = i;
      while (j < n && /[0-9.]/.test(input[j])) j++;
      tokens.push({ type: 'NUM', value: input.slice(i, j) });
      i = j;
      continue;
    }
    if (/[a-zA-Z_]/.test(c)) {
      let j = i;
      while (j < n && /[a-zA-Z0-9_]/.test(input[j])) j++;
      const word = input.slice(i, j);
      if (word === 'true') tokens.push({ type: 'TRUE' });
      else if (word === 'false') tokens.push({ type: 'FALSE' });
      else tokens.push({ type: 'IDENT', value: word });
      i = j;
      continue;
    }
    if (c === '&' && input[i + 1] === '&') { tokens.push({ type: 'AND' }); i += 2; continue; }
    if (c === '|' && input[i + 1] === '|') { tokens.push({ type: 'OR' }); i += 2; continue; }
    if (c === '>' && input[i + 1] === '=') { tokens.push({ type: 'GTE' }); i += 2; continue; }
    if (c === '<' && input[i + 1] === '=') { tokens.push({ type: 'LTE' }); i += 2; continue; }
    if (c === '=' && input[i + 1] === '=') { tokens.push({ type: 'EQ' }); i += 2; continue; }
    if (c === '!' && input[i + 1] === '=') { tokens.push({ type: 'NEQ' }); i += 2; continue; }
    if (c === '>') { tokens.push({ type: 'GT' }); i++; continue; }
    if (c === '<') { tokens.push({ type: 'LT' }); i++; continue; }
    if (c === '!') { tokens.push({ type: 'NOT' }); i++; continue; }
    if (c === '+') { tokens.push({ type: 'PLUS' }); i++; continue; }
    if (c === '-') { tokens.push({ type: 'MINUS' }); i++; continue; }
    if (c === '*') { tokens.push({ type: 'STAR' }); i++; continue; }
    if (c === '/') { tokens.push({ type: 'SLASH' }); i++; continue; }
    if (c === '(') { tokens.push({ type: 'LPAREN' }); i++; continue; }
    if (c === ')') { tokens.push({ type: 'RPAREN' }); i++; continue; }
    if (c === '[' || c === ']') {
      throw new Error(
        'Lookback/subscript notation (e.g. close[1]) is not supported. ' +
        'Use pre-built indicator signals like sma, ema, or rsi instead.'
      );
    }
    throw new Error(`Unexpected character in expression: "${c}" at position ${i}`);
  }
  tokens.push({ type: 'EOF' });
  return tokens;
}

class Parser {
  private pos = 0;
  private tokens: Token[];
  private ctx: ExprContext;
  constructor(tokens: Token[], ctx: ExprContext) { this.tokens = tokens; this.ctx = ctx; }
  private peek(): Token { return this.tokens[this.pos]; }
  private next(): Token { return this.tokens[this.pos++]; }
  private expect(type: TokenType): Token {
    const t = this.next();
    if (t.type !== type) throw new Error(`Expected ${type} but got ${t.type}`);
    return t;
  }
  parse(): ExprValue { const result = this.parseOr(); this.expect('EOF'); return result; }
  private parseOr(): ExprValue {
    let left = this.parseAnd();
    while (this.peek().type === 'OR') { this.next(); const r = this.parseAnd(); left = toBool(left) || toBool(r); }
    return left;
  }
  private parseAnd(): ExprValue {
    let left = this.parseNot();
    while (this.peek().type === 'AND') { this.next(); const r = this.parseNot(); left = toBool(left) && toBool(r); }
    return left;
  }
  private parseNot(): ExprValue {
    if (this.peek().type === 'NOT') { this.next(); return !toBool(this.parseNot()); }
    return this.parseComparison();
  }
  private parseComparison(): ExprValue {
    const left = this.parseSum();
    const t = this.peek().type;
    if (['GT','GTE','LT','LTE','EQ','NEQ'].includes(t)) {
      this.next();
      const right = this.parseSum();
      if (left === null || right === null) return false;
      switch (t) {
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
  private parseSum(): ExprValue {
    let left = this.parseProduct();
    while (this.peek().type === 'PLUS' || this.peek().type === 'MINUS') {
      const op = this.next().type;
      const r = this.parseProduct();
      if (left === null || r === null) { left = null; continue; }
      left = op === 'PLUS' ? Number(left)+Number(r) : Number(left)-Number(r);
    }
    return left;
  }
  private parseProduct(): ExprValue {
    let left = this.parsePrimary();
    while (this.peek().type === 'STAR' || this.peek().type === 'SLASH') {
      const op = this.next().type;
      const r = this.parsePrimary();
      if (left === null || r === null) { left = null; continue; }
      left = op === 'STAR' ? Number(left)*Number(r) : Number(left)/Number(r);
    }
    return left;
  }
  private parsePrimary(): ExprValue {
    const t = this.peek();
    if (t.type === 'NUM') { this.next(); return parseFloat(t.value!); }
    if (t.type === 'TRUE') { this.next(); return true; }
    if (t.type === 'FALSE') { this.next(); return false; }
    if (t.type === 'IDENT') {
      this.next();
      if (!(t.value! in this.ctx)) throw new Error(`Unknown signal reference: "${t.value}"`);
      return this.ctx[t.value!];
    }
    if (t.type === 'LPAREN') { this.next(); const v = this.parseOr(); this.expect('RPAREN'); return v; }
    if (t.type === 'MINUS') { this.next(); const v = this.parsePrimary(); return v === null ? null : -Number(v); }
    if (t.type === 'NOT') { this.next(); return !toBool(this.parsePrimary()); }
    throw new Error(`Unexpected token: ${t.type}`);
  }
}

function toBool(v: ExprValue): boolean {
  if (v === null) return false;
  if (typeof v === 'boolean') return v;
  return v !== 0;
}

export function validateExpression(expr: string, knownIds: string[]): void {
  const sampleCtx: ExprContext = {};
  for (const id of knownIds) sampleCtx[id] = 0;
  evaluateExpression(expr, sampleCtx);
}

export function evaluateExpression(expr: string, ctx: ExprContext): boolean {
  const tokens = tokenize(expr);
  return toBool(new Parser(tokens, ctx).parse());
}
