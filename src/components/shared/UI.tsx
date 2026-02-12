
import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Plus, Upload } from 'lucide-react';

/* --- ATOMS --- */

export const Btn = ({ children, onClick, variant = 'primary', className = '', icon: Icon, disabled }: any) => {
  const base = "px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-200 flex items-center gap-2 active:scale-95 tracking-wide disabled:opacity-50 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-bg shadow-sm";
  const styles = {
    primary: "bg-bl text-white hover:bg-bl/90 shadow-bl/20 hover:shadow-lg hover:shadow-bl/30 border border-transparent focus:ring-bl",
    secondary: "bg-sf text-tx border border-bd hover:border-bd/80 hover:bg-s2 shadow-sm hover:shadow-md focus:ring-t3",
    danger: "bg-rd/10 text-rd border border-transparent hover:bg-rd/20 focus:ring-rd",
    ghost: "bg-transparent text-t2 hover:text-tx hover:bg-hv/50 focus:ring-t3 shadow-none hover:shadow-none"
  };
  
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${styles[variant as keyof typeof styles]} ${className}`}>
      {Icon && <Icon size={16} strokeWidth={2.5} />}
      {children}
    </button>
  );
};

export const Inp = ({ value, onChange, placeholder, type = "text", label, className = "" }: any) => (
  <div className={`flex flex-col gap-2 ${className}`}>
    {label && <label className="text-xs font-bold text-t3 uppercase tracking-wider ml-1 mb-0.5">{label}</label>}
    <input 
      value={value} 
      onChange={e => onChange(e.target.value)} 
      placeholder={placeholder}
      type={type}
      className="w-full px-4 py-3 rounded-2xl bg-sf border border-bd text-sm text-tx outline-none focus:bg-sf focus:ring-2 focus:ring-bl/10 focus:border-bl transition-all placeholder-t3/50 font-medium shadow-sm"
    />
  </div>
);

export const IB = ({ onImport }: { onImport: (txt: string) => void }) => {
  const ref = useRef<HTMLInputElement>(null);
  const handle = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert("Formato no válido. Solo se aceptan archivos CSV (.csv) con codificación UTF-8.");
        if (ref.current) ref.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) onImport(ev.target.result as string);
      };
      reader.readAsText(file, "UTF-8");
    }
    if (ref.current) ref.current.value = "";
  };
  return (
    <>
      <input type="file" ref={ref} onChange={handle} accept=".csv" className="hidden" />
      <Btn variant="secondary" onClick={() => ref.current?.click()} icon={Upload}>Importar</Btn>
    </>
  );
};

export const Modal = ({ isOpen, onClose, title, children, onSave, saveLabel = "Guardar" }: any) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-bg/80 backdrop-blur-md transition-opacity duration-300" onClick={onClose} />
      <div className="relative bg-sf border border-bd rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up ring-1 ring-black/5 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-bd/40 bg-sf shrink-0">
          <h3 className="text-lg font-black text-tx tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-t3 hover:text-tx transition-colors p-2 hover:bg-hv rounded-xl"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-sf flex-1">
          {children}
        </div>
        <div className="p-6 border-t border-bd/40 bg-s2/30 flex justify-end gap-3 shrink-0">
          <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
          <Btn variant="primary" onClick={onSave}>{saveLabel}</Btn>
        </div>
      </div>
    </div>
  );
};

/* --- EXISTING COMPONENTS (Refined) --- */

export const EC = ({ value, onSave, num }: { value: string | number, onSave: (v: any) => void, num?: boolean }) => {
  const [ed, setEd] = useState(false);
  const [d, setD] = useState(value);
  const ref = useRef<HTMLInputElement>(null);
  
  useEffect(() => { if (ed && ref.current) ref.current.focus(); }, [ed]);
  useEffect(() => { setD(value); }, [value]);
  
  const save = () => { onSave(num ? (parseFloat(d as string) || 0) : d); setEd(false); };
  
  if (ed) return (
    <input ref={ref} value={d} onChange={e => setD(e.target.value)} onBlur={save}
      onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") { setD(value); setEd(false); } }}
      type={num ? "number" : "text"} step="0.01"
      className={`bg-sf border-2 border-bl/20 rounded-lg text-tx outline-none font-bold px-2 py-1 shadow-sm w-full text-sm ${num ? 'tabular-nums' : ''} ring-2 ring-bl/10`} />
  );
  return (
    <span onClick={() => setEd(true)} className={`cursor-pointer hover:text-bl hover:bg-bl/5 px-2 py-1 rounded-lg transition-all font-bold text-sm ${num ? 'tabular-nums' : ''}`}>
      {num && typeof value === "number" ? value.toLocaleString(undefined, { maximumFractionDigits: 2 }) : value}
    </span>
  );
};

export const St = ({ l, v, s, c, icon }: { l: string, v: string | number, s?: string, c?: string, icon?: any }) => {
  return (
    <div className="bg-sf rounded-3xl p-6 flex-1 min-w-[140px] border border-bd shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
      {c && <div className="absolute -top-8 -right-8 w-32 h-32 bg-current opacity-[0.03] rounded-full group-hover:scale-125 transition-transform duration-700 pointer-events-none" style={{ color: c }}></div>}
      <div className="relative z-10">
        <div className="text-[10px] font-bold text-t3 mb-2 uppercase tracking-widest flex items-center gap-2">
           {c && <span className="w-1.5 h-1.5 rounded-full ring-2 ring-current ring-opacity-30" style={{ backgroundColor: c, color: c }}></span>}
           {l}
        </div>
        <div className="text-3xl font-black tracking-tight text-tx mt-1 mb-1 tabular-nums">{v}</div>
        {s && <div className="text-xs font-semibold opacity-70 flex items-center gap-1" style={{ color: c || 'var(--t2)' }}>
          {s}
        </div>}
      </div>
    </div>
  );
};

export const Bg = ({ x, c }: { x: string, c: string }) => (
  <span className="inline-flex items-center px-3 py-1 rounded-lg text-[10px] font-black border border-transparent tracking-wider uppercase shadow-sm" style={{ backgroundColor: c + '15', color: c, border: `1px solid ${c}25` }}>
    {x}
  </span>
);

export const Dt = ({ c }: { c: string }) => <div className="w-2.5 h-2.5 rounded-full shrink-0 ring-4 ring-opacity-20" style={{ backgroundColor: c, '--tw-ring-color': c } as React.CSSProperties} />;

export const SI = ({ value, onChange, ph }: { value: string, onChange: (v: string) => void, ph?: string }) => {
  return (
    <div className="relative flex-1 max-w-[360px] group">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-t3 w-4 h-4 group-focus-within:text-bl transition-colors" />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={ph || "Buscar..."}
        className="w-full py-3 pl-11 pr-4 rounded-2xl bg-sf border border-bd text-tx text-sm outline-none font-medium placeholder-t3/50 transition-all focus:border-bl focus:ring-4 focus:ring-bl/5 shadow-sm group-hover:border-bd/80" />
    </div>
  );
};

export const FS = ({ value, onChange, options, label }: { value: string, onChange: (v: string) => void, options: string[], label: string }) => {
  return (
    <div className="relative min-w-[180px]">
      <select value={value} onChange={e => onChange(e.target.value)}
        className={`w-full appearance-none py-3 pl-4 pr-10 rounded-2xl bg-sf border border-bd text-sm outline-none font-bold cursor-pointer hover:bg-s2 transition-all focus:border-bl focus:ring-4 focus:ring-bl/5 shadow-sm ${value ? 'text-tx' : 'text-t3'}`}>
        <option value="">{label}</option>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50 text-tx">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 1L5 5L9 1"/></svg>
      </div>
    </div>
  );
};

export const Th = ({ children, w, a }: { children?: React.ReactNode, w?: number | string, a?: 'left' | 'right' | 'center' }) => {
  const [width, setWidth] = useState<number | string | undefined>(w);
  const startX = useRef(0);
  const startW = useRef(0);

  useEffect(() => { setWidth(w); }, [w]);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startX.current = e.pageX;
    const headerEl = (e.target as HTMLElement).closest('th');
    startW.current = headerEl ? headerEl.offsetWidth : (typeof width === 'number' ? width : 100);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const diff = moveEvent.pageX - startX.current;
      setWidth(Math.max(40, startW.current + diff));
    };

    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      document.body.style.cursor = 'default';
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  return (
    <th className="px-5 py-4 text-t3 font-bold text-[10px] border-b border-bd whitespace-nowrap tracking-widest uppercase bg-s2 backdrop-blur-md sticky top-0 z-10 select-none first:rounded-tl-2xl last:rounded-tr-2xl"
        style={{ width: width, minWidth: width, textAlign: a || 'left' }}>
      {children}
      <div onMouseDown={onMouseDown} className="absolute right-0 top-1/4 bottom-1/4 w-1 cursor-col-resize hover:bg-bl/20 active:bg-bl transition-colors z-20 rounded-full" />
    </th>
  );
};

export const XB = ({ onClick }: { onClick: () => void }) => (
  <Btn variant="secondary" onClick={onClick} className="ml-auto bg-sf border-bd hover:bg-s2 hover:border-bd/80 text-xs">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-gn mr-2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
    Exportar
  </Btn>
);
