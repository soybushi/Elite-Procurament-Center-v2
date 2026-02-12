import React, { useState } from 'react';
import { Dt } from './shared/UI';

interface Props {
  whs: string[];
  setWhs: React.Dispatch<React.SetStateAction<string[]>>;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
}

export default function SetM({ whs, setWhs, theme, setTheme }: Props) {
  const [nw, setNw] = useState("");
  const addW = () => { if (nw.trim() && !whs.includes(nw.trim())) { setWhs(p => [...p, nw.trim()].sort()); setNw(""); } };
  
  const [delC, setDelC] = useState<string | null>(null);
  const rmW = (w: string) => { if (delC === w) { setWhs(p => p.filter(x => x !== w)); setDelC(null); } else { setDelC(w); } };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx m-0 tracking-tight">Configuración</h1>
      </div>
      
      <div className="bg-sf rounded-2xl p-6 mb-6 shadow-sm border border-bd/40">
        <div className="text-lg font-semibold text-tx mb-4 flex items-center gap-2">
            <span className="w-1 h-5 bg-bl rounded-full"></span>
            Apariencia
        </div>
        <div className="flex gap-3">
          {["light", "dark"].map(m => (
            <button key={m} onClick={() => setTheme(m)} 
              className={`py-3 px-6 rounded-xl border cursor-pointer text-sm font-bold font-inherit transition-all ${theme === m ? 'bg-bl text-white border-bl shadow-md shadow-bl/20' : 'bg-s2 text-t2 border-bd/50 hover:bg-hv'}`}>
              {m === "light" ? "Modo Claro" : "Modo Oscuro"}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-sf rounded-2xl p-6 shadow-sm border border-bd/40">
        <div className="flex justify-between items-center mb-4">
            <div className="text-lg font-semibold text-tx flex items-center gap-2">
                <span className="w-1 h-5 bg-gn rounded-full"></span>
                Bodegas ({whs.length})
            </div>
        </div>
        
        <div className="flex gap-3 mb-5">
          <input value={nw} onChange={e => setNw(e.target.value)} placeholder="Nombre nueva bodega" onKeyDown={e => { if (e.key === "Enter") addW(); }}
            className="py-2.5 px-4 rounded-xl bg-s2 border border-bd/50 text-tx text-sm flex-1 max-w-[320px] outline-none font-inherit focus:ring-2 focus:ring-gn/20 focus:border-gn/30 transition-all" />
          <button onClick={addW} className="py-2.5 px-5 rounded-xl border-none cursor-pointer bg-gn text-white text-sm font-bold font-inherit hover:bg-gn/90 shadow-sm transition-all">Agregar</button>
        </div>
        
        <div className="flex flex-wrap gap-2.5">
          {whs.map(w => (
            <div key={w} className={`flex items-center gap-2 py-2 px-3.5 rounded-lg bg-s2/50 border transition-all hover:shadow-sm ${delC === w ? 'border-rd/50 bg-rd/5' : 'border-bd/40'}`}>
              <Dt c={delC === w ? "var(--rd)" : "var(--gn)"} />
              <span className="text-sm font-medium text-tx">{w}</span>
              <button onClick={() => rmW(w)} 
                className={`bg-none border-none cursor-pointer text-sm ml-1 font-bold transition-colors ${delC === w ? 'text-rd' : 'text-t3 hover:text-rd'}`}
                title={delC === w ? "Click de nuevo para confirmar" : "Eliminar"}>
                {delC === w ? "Confirmar" : "×"}
              </button>
            </div>
          ))}
        </div>
        {delC && <p className="text-xs font-medium text-rd mt-3 animate-pulse">Click "Confirmar" de nuevo para eliminar permanentemente.</p>}
      </div>
    </div>
  );
}