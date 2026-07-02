import { isGroup } from './types';
function resolveOperand(operand, table, index) {
  if (operand === undefined) return null;
  if (typeof operand === 'number') return operand;
  const series = table[operand.signalId];
  if (!series) throw new Error(`Unknown signal: "${operand.signalId}"`);
  return series[index] ?? null;
}
function evalCondition(cond, table, index) {
  const left = resolveOperand(cond.left, table, index);
  if (cond.operator === 'is_true') return left === true;
  if (cond.operator === 'is_false') return left === false;
  const right = resolveOperand(cond.right, table, index);
  if (cond.operator === 'crosses_above' || cond.operator === 'crosses_below') {
    if (index === 0) return false;
    const pL = resolveOperand(cond.left,table,index-1), pR = resolveOperand(cond.right,table,index-1);
    if (left===null||right===null||pL===null||pR===null) return false;
    return cond.operator==='crosses_above' ? Number(pL)<=Number(pR)&&Number(left)>Number(right) : Number(pL)>=Number(pR)&&Number(left)<Number(right);
  }
  if (left===null||right===null) return false;
  switch (cond.operator) {
    case 'gt': return Number(left)>Number(right);
    case 'gte': return Number(left)>=Number(right);
    case 'lt': return Number(left)<Number(right);
    case 'lte': return Number(left)<=Number(right);
    case 'eq': return left===right;
    case 'neq': return left!==right;
    default: throw new Error(`Unknown operator: ${cond.operator}`);
  }
}
export function evalGroup(group, table, index) {
  if (group.children.length===0) return false;
  if (group.logic==='AND') return group.children.every(c => isGroup(c)?evalGroup(c,table,index):evalCondition(c,table,index));
  return group.children.some(c => isGroup(c)?evalGroup(c,table,index):evalCondition(c,table,index));
}
export function collectSignalIds(group, out=new Set()) {
  for (const c of group.children) {
    if (isGroup(c)) collectSignalIds(c,out);
    else { out.add(c.left.signalId); if (c.right && typeof c.right!=='number') out.add(c.right.signalId); }
  }
  return out;
}
