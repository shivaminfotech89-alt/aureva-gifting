import React, { useEffect, useRef, useState } from 'react';
import { Check, X, Loader2 } from 'lucide-react';

/**
 * A number in a table that can be edited where it sits.
 *
 * Changing one product's stock meant opening the edit dialog, scrolling to the
 * field, saving and waiting for the list to reload. For a stock count that is
 * corrected several times a day, the dialog is the whole cost of the task.
 *
 * Enter or the tick saves, Escape or the cross cancels, and clicking away
 * saves too — a blur that loses a typed number reads as the app eating it.
 * The value shown updates immediately and rolls back if the write fails.
 */
export function InlineNumber({
  value,
  onSave,
  format = (n: number) => String(n),
  min = 0,
  step = 1,
  ariaLabel,
  className = '',
  disabled = false,
}: {
  value: number;
  onSave: (next: number) => Promise<void>;
  format?: (n: number) => string;
  min?: number;
  step?: number;
  ariaLabel: string;
  /** Styling for the resting state, so a cell keeps its own look. */
  className?: string;
  disabled?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Set while committing so the blur that focus loss triggers cannot start a
  // second save of the same edit.
  const committing = useRef(false);

  useEffect(() => { if (!editing) setDraft(String(value)); }, [value, editing]);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const cancel = () => { committing.current = true; setDraft(String(value)); setEditing(false); };

  const commit = async () => {
    if (committing.current) return;
    const next = Number(draft);
    if (!Number.isFinite(next) || next < min) { cancel(); return; }
    if (next === value) { cancel(); return; }

    committing.current = true;
    setBusy(true);
    try {
      await onSave(next);
      setEditing(false);
    } catch {
      // onSave reports the reason; put the field back to the stored value.
      setDraft(String(value));
      setEditing(false);
    } finally {
      setBusy(false);
    }
  };

  if (busy) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving
      </span>
    );
  }

  if (editing) {
    return (
      <span className="inline-flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          inputMode="numeric"
          min={min}
          step={step}
          aria-label={ariaLabel}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onFocus={() => { committing.current = false; }}
          onKeyDown={e => {
            if (e.key === 'Enter') { e.preventDefault(); void commit(); }
            if (e.key === 'Escape') { e.preventDefault(); cancel(); }
          }}
          onBlur={() => void commit()}
          className="w-24 rounded-md border border-[#d4af37] bg-white px-2 py-1 text-sm font-semibold text-[#0F172A] outline-none ring-2 ring-[#d4af37]/30"
        />
        {/* onMouseDown, because a click would blur the input first. */}
        <button
          type="button"
          aria-label="Save"
          onMouseDown={e => { e.preventDefault(); void commit(); }}
          className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
        >
          <Check className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Cancel"
          onMouseDown={e => { e.preventDefault(); cancel(); }}
          className="rounded p-1 text-slate-400 hover:bg-slate-100"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      aria-label={`${ariaLabel} (currently ${format(value)}). Click to edit.`}
      onClick={() => { committing.current = false; setEditing(true); }}
      className={`rounded-md border border-transparent px-2 py-1 text-left transition-colors hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
      title="Click to edit"
    >
      {format(value)}
    </button>
  );
}
