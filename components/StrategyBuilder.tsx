'use client';

import { useState } from 'react';
import type { ReactNode } from 'react';
import { SIGNAL_CATALOG, catalogEntry, OPERATOR_LABELS } from '@/lib/backtest/catalog';
import type { BacktestResult, Bar, Operator, SignalKind, SignalSpec } from '@/lib/backtest/types';

interface RowCondition {
  rowId: string;
  leftSignalId: string;
  operator: Operator;
  rightType: 'signal' | 'number';
  rightSignalId: string;
  rightNumber: number;
}

const NUMERIC_OPERATORS: Operator[] = ['gt', 'gte', 'lt', 'lte', 'eq', 'neq', 'crosses_above', 'crosses_below'];
const BOOLEAN_OPERATORS: Operator[] = ['is_true', 'is_false'];

let nextId = 1;
function uid(prefix: string) {
  return prefix + '_' + (nextId++).toString();
}

function defaultSignal(kind: SignalKind): SignalSpec {
  const entry = catalogEntry(kind);
  const params: Record<string, number> = {};
  for (const p of entry.params) params[p.key] = p.default;
  return { id: uid(kind), kind, params };
}

interface FieldProps {
  label: string;
  children: ReactNode;
}

function Field({ label, children }: FieldProps) {
  return (
    <label className="block text-sm">
      <span className="block text-gray-400 mb-1">{label}</span>
      {children}
    </label>
  );
}

interface ConditionEditorProps {
  title: string;
  rows: RowCondition[];
  logic: 'AND' | 'OR';
  onLogicChange: (l: 'AND' | 'OR') => void;
  onAdd: () => void;
  onUpdate: (rowId: string, patch: Partial<RowCondition>) => void;
  onRemove: (rowId: string) => void;
  signals: SignalSpec[];
  isBooleanSignal: (id: string) => boolean;
}

function ConditionEditor({
  title,
  rows,
  logic,
  onLogicChange,
  onAdd,
  onUpdate,
  onRemove,
  signals,
  isBooleanSignal,
}: ConditionEditorProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex items-center gap-2">
          <select className="input text-sm" value={logic} onChange={(e) => onLogicChange(e.target.value as 'AND' | 'OR')}>
            <option value="AND">Match ALL (AND)</option>
            <option value="OR">Match ANY (OR)</option>
          </select>
          <button onClick={onAdd} className="text-sm text-brand-500 hover:underline">+ Add condition</button>
        </div>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <p className="text-xs text-gray-500">No conditions yet.</p>}
        {rows.map((row) => {
          const operators = isBooleanSignal(row.leftSignalId) ? BOOLEAN_OPERATORS : NUMERIC_OPERATORS;
          const needsRight = row.operator !== 'is_true' && row.operator !== 'is_false';
          return (
            <div key={row.rowId} className="flex flex-wrap items-center gap-2 bg-black/20 p-2 rounded-lg">
              <select className="input" value={row.leftSignalId} onChange={(e) => onUpdate(row.rowId, { leftSignalId: e.target.value })}>
                <option value="close">close</option>
                <option value="open">open</option>
                <option value="high">high</option>
                <option value="low">low</option>
                <option value="volume">volume</option>
                {signals.map((s) => (
                  <option key={s.id} value={s.id}>{s.id}</option>
                ))}
              </select>
              <select className="input" value={row.operator} onChange={(e) => onUpdate(row.rowId, { operator: e.target.value as Operator })}>
                {operators.map((op) => (
                  <option key={op} value={op}>{OPERATOR_LABELS[op]}</option>
                ))}
              </select>
              {needsRight && (
                <>
                  <select
                    className="input"
                    value={row.rightType}
                    onChange={(e) => onUpdate(row.rowId, { rightType: e.target.value as 'signal' | 'number' })}
                  >
                    <option value="number">number</option>
                    <option value="signal">signal</option>
                  </select>
                  {row.rightType === 'number' ? (
                    <input
                      type="number"
                      className="input w-24"
                      value={row.rightNumber}
                      onChange={(e) => onUpdate(row.rowId, { rightNumber: Number(e.target.value) })}
                    />
                  ) : (
                    <select className="input" value={row.rightSignalId} onChange={(e) => onUpdate(row.rowId, { rightSignalId: e.target.value })}>
                      <option value="close">close</option>
                      {signals.map((s) => (
                        <option key={s.id} value={s.id}>{s.id}</option>
                      ))}
                    </select>
                  )}
                </>
              )}
              <button onClick={() => onRemove(row.rowId)} className="text-xs text-red-400 ml-auto hover:underline">
                Remove
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface StrategyBuilderProps {
  onResult: (result: BacktestResult, bars: Bar[], symbol: string) => void;
}

export default function StrategyBuilder({ onResult }: StrategyBuilderProps) {
  const [symbol, setSymbol] = useState('AAPL');
  const [startDate, setStartDate] = useState('2022-01-01');
  const [endDate, setEndDate] = useState(new Date().toISOString().slice(0, 10));
  const [interval, setIntervalValue] = useState<'1d' | '1h' | '30m' | '15m' | '5m'>('1d');
  const [initialCapital, setInitialCapital] = useState(10000);
  const [direction, setDirection] = useState<'long' | 'short'>('long');
  const [positionSizePct, setPositionSizePct] = useState(100);
  const [stopLossPct, setStopLossPct] = useState<number | ''>('');
  const [takeProfitPct, setTakeProfitPct] = useState<number | ''>('');

  const [signals, setSignals] = useState<SignalSpec[]>([defaultSignal('sma'), defaultSignal('rsi')]);
  const [entryRows, setEntryRows] = useState<RowCondition[]>([]);
  const [entryLogic, setEntryLogic] = useState<'AND' | 'OR'>('AND');
  const [exitRows, setExitRows] = useState<RowCondition[]>([]);
  const [exitLogic, setExitLogic] = useState<'AND' | 'OR'>('AND');

  const [advancedMode, setAdvancedMode] = useState(false);
  const [advancedEntry, setAdvancedEntry] = useState('rsi_1 < 30');
  const [advancedExit, setAdvancedExit] = useState('rsi_1 > 70');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addSignal() {
    setSignals((s) => [...s, defaultSignal('sma')]);
  }
  function updateSignalKind(index: number, kind: SignalKind) {
    setSignals((s) => s.map((sig, i) => (i === index ? defaultSignal(kind) : sig)));
  }
  function updateSignalParam(index: number, key: string, value: number) {
    setSignals((s) =>
      s.map((sig, i) => (i === index ? { ...sig, params: { ...sig.params, [key]: value } } : sig))
    );
  }
  function removeSignal(index: number) {
    setSignals((s) => s.filter((_, i) => i !== index));
  }

  function blankRow(): RowCondition {
    const firstId = signals[0]?.id ?? 'close';
    return {
      rowId: uid('row'),
      leftSignalId: firstId,
      operator: 'gt',
      rightType: 'number',
      rightSignalId: firstId,
      rightNumber: 0,
    };
  }

  function addRow(side: 'entry' | 'exit') {
    if (side === 'entry') setEntryRows((r) => [...r, blankRow()]);
    else setExitRows((r) => [...r, blankRow()]);
  }
  function updateRow(side: 'entry' | 'exit', rowId: string, patch: Partial<RowCondition>) {
    const updater = (rows: RowCondition[]) => rows.map((r) => (r.rowId === rowId ? { ...r, ...patch } : r));
    if (side === 'entry') setEntryRows(updater);
    else setExitRows(updater);
  }
  function removeRow(side: 'entry' | 'exit', rowId: string) {
    if (side === 'entry') setEntryRows((r) => r.filter((x) => x.rowId !== rowId));
    else setExitRows((r) => r.filter((x) => x.rowId !== rowId));
  }

  function signalKindOf(signalId: string): SignalKind | null {
    return signals.find((s) => s.id === signalId)?.kind ?? (signalId === 'close' ? 'close' : null);
  }

  function isBooleanSignal(signalId: string): boolean {
    const kind = signalKindOf(signalId);
    if (!kind) return false;
    return catalogEntry(kind).isBoolean;
  }

  function rowsToGroup(rows: RowCondition[], logic: 'AND' | 'OR') {
    return {
      type: 'group' as const,
      logic,
      children: rows.map((r) => ({
        type: 'condition' as const,
        left: { signalId: r.leftSignalId },
        operator: r.operator,
        ...(r.operator === 'is_true' || r.operator === 'is_false'
          ? {}
          : { right: r.rightType === 'signal' ? { signalId: r.rightSignalId } : r.rightNumber }),
      })),
    };
  }

  async function runBacktest() {
    setError(null);
    setLoading(true);
    try {
      const risk = {
        positionSizePct,
        ...(stopLossPct !== '' ? { stopLossPct: Number(stopLossPct) } : {}),
        ...(takeProfitPct !== '' ? { takeProfitPct: Number(takeProfitPct) } : {}),
      };

      const strategy = {
        name: symbol + ' strategy',
        symbol,
        direction,
        signals,
        entry: advancedMode ? { type: 'group' as const, logic: 'AND' as const, children: [] } : rowsToGroup(entryRows, entryLogic),
        exit: advancedMode ? { type: 'group' as const, logic: 'AND' as const, children: [] } : rowsToGroup(exitRows, exitLogic),
        ...(advancedMode ? { advancedExpression: { entry: advancedEntry, exit: advancedExit } } : {}),
        risk,
        initialCapital,
      };

      const res = await fetch('/api/backtest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ strategy, startDate, endDate, interval }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Backtest failed.');
        return;
      }
      onResult(data.result, data.bars, symbol);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">Instrument &amp; range</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Symbol">
            <input className="input w-full" value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} />
          </Field>
          <Field label="Interval">
            <select className="input w-full" value={interval} onChange={(e) => setIntervalValue(e.target.value as typeof interval)}>
              <option value="1d">Daily</option>
              <option value="1h">1 hour</option>
              <option value="30m">30 min</option>
              <option value="15m">15 min</option>
              <option value="5m">5 min</option>
            </select>
          </Field>
          <Field label="Start date">
            <input type="date" className="input w-full" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </Field>
          <Field label="End date">
            <input type="date" className="input w-full" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </Field>
        </div>
        {(interval !== '1d') && (
          <p className="text-xs text-amber-400 mt-2">
            Intraday intervals are only available for roughly the last 60 days on Yahoo Finance.
          </p>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">Risk &amp; sizing</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Field label="Direction">
            <select className="input w-full" value={direction} onChange={(e) => setDirection(e.target.value as 'long' | 'short')}>
              <option value="long">Long only</option>
              <option value="short">Short only</option>
            </select>
          </Field>
          <Field label="Initial capital">
            <input type="number" className="input w-full" value={initialCapital} onChange={(e) => setInitialCapital(Number(e.target.value))} />
          </Field>
          <Field label="Position size %">
            <input type="number" className="input w-full" value={positionSizePct} onChange={(e) => setPositionSizePct(Number(e.target.value))} />
          </Field>
          <Field label="Stop loss % (optional)">
            <input type="number" className="input w-full" value={stopLossPct} onChange={(e) => setStopLossPct(e.target.value === '' ? '' : Number(e.target.value))} />
          </Field>
          <Field label="Take profit % (optional)">
            <input type="number" className="input w-full" value={takeProfitPct} onChange={(e) => setTakeProfitPct(e.target.value === '' ? '' : Number(e.target.value))} />
          </Field>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Signals</h2>
          <button onClick={addSignal} className="text-sm text-brand-500 hover:underline">+ Add signal</button>
        </div>
        <div className="space-y-2">
          {signals.map((sig, i) => {
            const entry = catalogEntry(sig.kind);
            return (
              <div key={sig.id} className="flex flex-wrap items-end gap-2 bg-black/20 p-2 rounded-lg">
                <span className="text-xs text-gray-500 w-20 truncate">{sig.id}</span>
                <select
                  className="input"
                  value={sig.kind}
                  onChange={(e) => updateSignalKind(i, e.target.value as SignalKind)}
                >
                  {Object.entries(
                    SIGNAL_CATALOG.reduce<Record<string, typeof SIGNAL_CATALOG>>((acc, e) => {
                      (acc[e.category] ??= []).push(e);
                      return acc;
                    }, {})
                  ).map(([category, entries]) => (
                    <optgroup key={category} label={category}>
                      {entries.map((e) => (
                        <option key={e.kind} value={e.kind}>{e.label}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
                {entry.params.map((p) => (
                  <label key={p.key} className="text-xs text-gray-400 flex items-center gap-1">
                    {p.label}
                    <input
                      type="number"
                      step={p.step ?? 1}
                      className="input w-20"
                      value={sig.params?.[p.key] as number}
                      onChange={(e) => updateSignalParam(i, p.key, Number(e.target.value))}
                    />
                  </label>
                ))}
                <button onClick={() => removeSignal(i)} className="text-xs text-red-400 ml-auto hover:underline">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="advanced-mode"
          type="checkbox"
          checked={advancedMode}
          onChange={(e) => setAdvancedMode(e.target.checked)}
        />
        <label htmlFor="advanced-mode" className="text-sm">
          Advanced mode - write entry/exit as a free-form expression instead of dropdown rules
        </label>
      </div>

      {advancedMode ? (
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Entry expression">
            <textarea
              className="input w-full font-mono text-sm"
              rows={3}
              value={advancedEntry}
              onChange={(e) => setAdvancedEntry(e.target.value)}
              placeholder="e.g. rsi_1 &lt; 30 &amp;&amp; fvg_bullish"
            />
          </Field>
          <Field label="Exit expression">
            <textarea
              className="input w-full font-mono text-sm"
              rows={3}
              value={advancedExit}
              onChange={(e) => setAdvancedExit(e.target.value)}
              placeholder="e.g. rsi_1 &gt; 70"
            />
          </Field>
          <p className="text-xs text-gray-500 md:col-span-2">
            Reference any signal id from the Signals list above, plus the always-available{' '}
            <code>open</code>, <code>high</code>, <code>low</code>, <code>close</code>, <code>volume</code>.
            Operators: {'>'} {'>='} {'<'} {'<='} {'=='} {'!='} {'&&'} {'||'} {'!'}.
          </p>
        </div>
      ) : (
        <>
          <ConditionEditor
            title="Entry rule"
            rows={entryRows}
            logic={entryLogic}
            onLogicChange={setEntryLogic}
            onAdd={() => addRow('entry')}
            onUpdate={(rowId, patch) => updateRow('entry', rowId, patch)}
            onRemove={(rowId) => removeRow('entry', rowId)}
            signals={signals}
            isBooleanSignal={isBooleanSignal}
          />
          <ConditionEditor
            title="Exit rule"
            rows={exitRows}
            logic={exitLogic}
            onLogicChange={setExitLogic}
            onAdd={() => addRow('exit')}
            onUpdate={(rowId, patch) => updateRow('exit', rowId, patch)}
            onRemove={(rowId) => removeRow('exit', rowId)}
            signals={signals}
            isBooleanSignal={isBooleanSignal}
          />
        </>
      )}

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button onClick={runBacktest} disabled={loading} className="btn-primary w-full">
        {loading ? 'Running backtest...' : 'Run backtest'}
      </button>
    </div>
  );
}
