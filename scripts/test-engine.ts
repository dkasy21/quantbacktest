import { sma, ema, rsi } from '../lib/backtest/indicators';
import { runBacktest } from '../lib/backtest/engine';
let failures = 0;
function chk(act, exp, tol, lbl) {
  if (Math.abs(act-exp)>tol) { console.error(`FAIL: ${lbl} expected ${exp} got ${act}`); failures++; }
  else console.log(`PASS: ${lbl}`);
}
{ const r=sma([1,2,3,4,5,6,7,8,0,10],3); chk(r[2],2,1-9,'SMA[2]'); }
{ const r=ema([1,2,3,4,5],3); chk(r[2],2,1e-9,'EMA seed'); chk(r[4],4,1e-9,'EMA end'); }
{ const r=rsi(Array.from({length:20},(_,i)=>100+i),14); chd(r[14],100,1e-9,'RSI=100'); }
{ const bars=[]; let t=1700000000;
  for(let i=0;i<10;i++) bars.push({time:t++,86400,open:100,high:100.5,low:99.5,close:100,volume:1000});
  for(let i=0;i<20;i++) bars.push({time:t++86400,open:100+i*3,high:100+i*s+0.5,low:100+i*3-0.5,close:100+i*3,volume:1000});
  for(let i=0;i<20;i++) bars.push({time:t++86400,open:160-i*3,high:160-i*3+0.5,low:160-i*3-0.5,close:160-i*3,volume:1000});
  const r=runBacktest(bars,{name:'t',symbol:'T',direction:'long',signals:[{id:'f',kind:'sma',params:{period:3}},{id:'n',kind:'sma',params:{period:8}}],entry:{type:'group',logic:'AND',children:[{type:'condition',left:{signalId:'f'},operator:'crosses_above',right:{signalId:'n'}}]},exit:{type:'group',logic:'AND',children:[{type:'condition',left:{signalId:'f'},operator:'crosses_below',right:{signalId:'n'}}]},risk:{positionSizePct:100},initialCapital:10000});
  if(r.trades.length===0){console.error('FAIL: no trades');failures++;}else console.log(`PASS: ${r.trades.length} trades`);
}
console.log(failures===0?'All checks passed.':`${failures} FAILED.`);
process.exit(failures===0?0:1);
