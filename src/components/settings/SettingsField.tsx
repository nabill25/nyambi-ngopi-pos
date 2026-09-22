import { ReactNode } from 'react';

export const SETTINGS_INPUT_CLASS = 'w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all';

export function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-slate-800 font-semibold text-sm border-b border-slate-100 pb-3">{children}</h3>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-slate-500 text-xs font-medium">{label}</label>
      {children}
    </div>
  );
}
