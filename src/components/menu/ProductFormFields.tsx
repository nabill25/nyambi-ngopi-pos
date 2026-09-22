import { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export const PRODUCT_INPUT_CLASS = 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all';

export function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-600 text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}

export function ToggleField({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div
      className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 cursor-pointer hover:border-slate-200 transition-colors"
      onClick={() => onChange(!checked)}
    >
      <div>
        <p className="text-slate-800 text-sm font-medium">{label}</p>
        <p className="text-slate-500 text-xs">{desc}</p>
      </div>
      <div className={cn('w-10 h-5 rounded-full relative transition-colors', checked ? 'bg-emerald-500' : 'bg-slate-50')}>
        <div className={cn('absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </div>
    </div>
  );
}
