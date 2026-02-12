import React, { useState } from 'react';
import { TransferItem } from '../types';
import { FS, Dt, Btn, Modal, Inp } from './shared/UI';
import { Plus } from 'lucide-react';

interface Props {
  tr: TransferItem[];
  setTr: React.Dispatch<React.SetStateAction<TransferItem[]>>;
  whs: string[];
}

export default function TrM({ tr, setTr, whs }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [nf, setNf] = useState({ fr: "", to: "", it: "", qt: "", nt: "" });
  
  const stF = ["preparing", "in_transit", "received"];
  const stL: Record<string, string> = { preparing: "En preparacion", in_transit: "En transito", received: "Recibido" };
  const stC: Record<string, string> = { preparing: "var(--am)", in_transit: "var(--bl)", received: "var(--gn)" };
  
  const adv = (id: string) => { 
    setTr(p => p.map(x => { 
      if (x.id !== id) return x; 
      const ci = stF.indexOf(x.st); 
      if (ci >= stF.length - 1) return x; 
      const ns = stF[ci + 1]; 
      const now = new Date().toISOString().replace("T", " ").slice(0, 16); 
      return { ...x, st: ns, dp: ns === "in_transit" ? now : x.dp, rv: ns === "received" ? now : x.rv }; 
    })); 
  };
  
  const add = () => { 
    if (!nf.fr || !nf.to || !nf.it || !nf.qt) return; 
    const now = new Date().toISOString().replace("T", " ").slice(0, 16); 
    setTr(p => [{ id: "TR-" + String(p.length + 1).padStart(3, "0"), fr: nf.fr, to: nf.to, it: [{ nm: nf.it, qt: parseInt(nf.qt) || 0 }], st: "preparing", cr: now, dp: null, rv: null, nt: nf.nt }, ...p]); 
    setNf({ fr: "", to: "", it: "", qt: "", nt: "" }); 
    setModalOpen(false); 
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-6 mb-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tx m-0 tracking-tight">Transferencias</h1>
          <p className="text-sm font-medium text-t2 mt-1.5">Logística interna</p>
        </div>
        <Btn variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Nueva Transferencia</Btn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-160px)]">
        {stF.map(st => { 
          const items = tr.filter(x => x.st === st); 
          return (
            <div key={st} className="bg-sf rounded-2xl flex flex-col h-full shadow-sm border border-bd/40 overflow-hidden">
              <div className="px-5 py-4 border-b border-bd/40 flex items-center justify-between bg-s2/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-offset-0 ${st === 'preparing' ? 'animate-pulse' : ''}`} style={{ backgroundColor: stC[st], '--tw-ring-color': stC[st] + '20' } as React.CSSProperties}></div>
                  <span className="text-xs font-black text-tx uppercase tracking-wider">{stL[st]}</span>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 rounded-md" style={{ backgroundColor: stC[st] + "15", color: stC[st] }}>
                  {items.length}
                </span>
              </div>
              <div className="p-4 flex flex-col gap-3 overflow-y-auto custom-scrollbar flex-1 bg-s2/10">
                {items.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 text-t3 text-sm font-medium">
                     <span className="text-2xl mb-2 grayscale">📦</span>
                     Sin items
                  </div>
                ) : (
                  items.map(r => (
                    <div key={r.id} className="p-5 rounded-xl bg-sf border border-bd/50 hover:border-bl/30 hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-sm group">
                      <div className="flex justify-between mb-3">
                        <span className="text-xs font-black px-1.5 py-0.5 rounded" style={{ color: stC[st], backgroundColor: stC[st] + '10' }}>{r.id}</span>
                        <span className="text-xs text-t3 font-mono">{r.cr.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-tx mb-3 bg-s2/50 p-2 rounded-lg border border-bd/20">
                        <span className="truncate flex-1 text-center">{r.fr.replace('ELITE ', '')}</span>
                        <span className="text-t3">→</span>
                        <span className="truncate flex-1 text-center">{r.to.replace('ELITE ', '')}</span>
                      </div>
                      <div className="mb-3 px-1">
                         {r.it.map((i, idx) => (
                           <div key={idx} className="flex justify-between text-xs text-t2 font-medium mb-1">
                             <span>{i.nm}</span>
                             <span className="font-mono text-tx">x{i.qt}</span>
                           </div>
                         ))}
                      </div>
                      {r.nt && <div className="text-xs text-t3 italic mb-3 px-2 py-1 bg-am/5 text-am rounded border border-am/10">{r.nt}</div>}
                      
                      {st !== "received" && (
                        <button onClick={() => adv(r.id)} 
                          className="w-full py-2 rounded-lg border-none cursor-pointer text-xs font-bold font-inherit text-white shadow-md shadow-bl/10 transition-all hover:scale-[1.02] active:scale-95"
                          style={{ backgroundColor: st === "preparing" ? 'var(--bl)' : 'var(--gn)' }}>
                          {st === "preparing" ? "Despachar →" : "Recibir ✓"}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ); 
        })}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Transferencia" onSave={add} saveLabel="Crear Transferencia">
        <div className="grid grid-cols-2 gap-4">
           <div>
              <label className="text-xs font-bold text-t2 uppercase tracking-wider ml-1 mb-2 block">Origen</label>
              <FS value={nf.fr} onChange={v => setNf({...nf, fr: v})} options={whs} label="Seleccionar" />
           </div>
           <div>
              <label className="text-xs font-bold text-t2 uppercase tracking-wider ml-1 mb-2 block">Destino</label>
              <FS value={nf.to} onChange={v => setNf({...nf, to: v})} options={whs} label="Seleccionar" />
           </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
                <Inp label="Producto" value={nf.it} onChange={(v: string) => setNf({...nf, it: v})} />
            </div>
            <Inp label="Cantidad" type="number" value={nf.qt} onChange={(v: string) => setNf({...nf, qt: v})} />
        </div>
        <Inp label="Notas" value={nf.nt} onChange={(v: string) => setNf({...nf, nt: v})} placeholder="Opcional" />
      </Modal>
    </div>
  );
}