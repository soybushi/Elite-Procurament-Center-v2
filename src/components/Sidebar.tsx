
import React, { useState } from 'react';
import { LayoutDashboard, Package, CircleDollarSign, History, ClipboardList, ArrowRightLeft, Users, Bot, Settings, Sun, Moon, Tag } from 'lucide-react';

const NavIcon = ({ id, active }: { id: string, active: boolean }) => {
  const props = { size: 20, strokeWidth: active ? 2.5 : 2, className: active ? 'text-bl' : 'text-t3 group-hover:text-t2 transition-colors' };
  switch (id) {
    case 'dash': return <LayoutDashboard {...props} />;
    case 'codes': return <Tag {...props} />;
    case 'inv': return <Package {...props} />;
    case 'prc': return <CircleDollarSign {...props} />;
    case 'his': return <History {...props} />;
    case 'ord': return <ClipboardList {...props} />;
    case 'trn': return <ArrowRightLeft {...props} />;
    case 'sup': return <Users {...props} />;
    case 'agt': return <Bot {...props} />;
    case 'set': return <Settings {...props} />;
    default: return null;
  }
};

interface Props {
  act: string;
  go: (pg: string) => void;
  trc: number;
  theme: string;
  setTheme: React.Dispatch<React.SetStateAction<string>>;
  isOpen: boolean;
}

const MD = [
  { id: "dash", l: "Dashboard" },
  { id: "codes", l: "Códigos Maestros" },
  { id: "inv", l: "Inventario" },
  { id: "prc", l: "Precios" },
  { id: "his", l: "Historial" },
  { id: "ord", l: "Órdenes de Compra" },
  { id: "trn", l: "Transferencias" },
  { id: "sup", l: "Proveedores" },
  { id: "agt", l: "Agentes IA", sep: true },
  { id: "set", l: "Configuración", sep: true },
];

export default function Nav({ act, go, trc, theme, setTheme, isOpen }: Props) {
  const [h, setH] = useState<string | null>(null);

  return (
    <div className="w-full bg-sf flex flex-col shrink-0 h-full z-20 border-r border-bd/60 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.05)]">
      <div className={`flex items-center h-20 transition-all duration-300 ${isOpen ? 'px-8 gap-4' : 'justify-center px-4'}`}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-bl to-bl/80 text-white flex items-center justify-center text-sm font-black shadow-lg shadow-bl/30 ring-1 ring-white/10 shrink-0">EF</div>
        <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'w-40 opacity-100' : 'w-0 opacity-0'}`}>
          <div className="text-lg font-extrabold text-tx tracking-tight leading-none whitespace-nowrap">Elite Flower</div>
          <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mt-1 whitespace-nowrap">Command Center</div>
        </div>
      </div>
      
      <div className="flex-1 px-3 space-y-1.5 overflow-y-auto custom-scrollbar py-2">
        {MD.map(m => {
          const isA = act === m.id;
          return (
            <div key={m.id}>
              {m.sep && <div className="h-px bg-bd/40 mx-2 my-4" />}
              <button onClick={() => go(m.id)} onMouseEnter={() => setH(m.id)} onMouseLeave={() => setH(null)}
                className={`group w-full py-3 border-none cursor-pointer rounded-xl flex items-center transition-all duration-300 relative outline-none focus-visible:ring-2 focus-visible:ring-bl/20 min-h-[48px] ${isOpen ? 'px-4 gap-3.5' : 'justify-center px-2'} ${isA ? 'bg-bl/5 text-tx' : 'bg-transparent text-t2 hover:bg-s2'}`}
                title={!isOpen ? m.l : ''}>
                
                {isA && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-bl shadow-[0_0_8px_var(--bl)]"></div>}
                
                <div className="shrink-0"><NavIcon id={m.id} active={isA} /></div>
                
                <div className={`overflow-hidden transition-all duration-300 ${isOpen ? 'w-auto opacity-100' : 'w-0 opacity-0'}`}>
                    <span className={`text-sm tracking-tight whitespace-nowrap ${isA ? 'font-bold' : 'font-medium group-hover:text-tx'}`}>{m.l}</span>
                </div>
                
                {m.id === "trn" && trc > 0 && (
                   isOpen ? (
                      <span className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full bg-cy text-white shadow-sm shadow-cy/20 ring-1 ring-white/20 shrink-0">{trc}</span>
                   ) : (
                      <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-cy border border-sf"></span>
                   )
                )}
              </button>
            </div>
          );
        })}
      </div>

      <div className={`bg-s2/20 transition-all duration-300 overflow-hidden ${isOpen ? 'border-t border-bd/40 p-6 max-h-80 opacity-100' : 'max-h-0 opacity-0 p-0 border-t-0'}`}>
        <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} 
          className="w-full py-3 rounded-xl border border-bd/60 cursor-pointer bg-sf flex items-center justify-between px-4 font-inherit text-t2 text-sm font-semibold hover:border-bl/30 hover:shadow-md transition-all shadow-sm mb-4 group"
          title={theme === "dark" ? "Modo Día" : "Modo Noche"}>
          <span className="flex items-center gap-2.5">
             {theme === "dark" ? <Sun size={18} className="text-am shrink-0 group-hover:rotate-90 transition-transform duration-500" /> : <Moon size={18} className="text-vi shrink-0 group-hover:-rotate-12 transition-transform" />}
             <span className="whitespace-nowrap">{theme === "dark" ? "Modo Día" : "Modo Noche"}</span>
          </span>
          <div className={`w-9 h-5 rounded-full relative transition-colors border border-t3/10 ${theme === 'dark' ? 'bg-bl/20' : 'bg-t3/10'}`}>
             <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-current shadow-sm transition-all duration-300 ${theme === 'dark' ? 'left-4.5 bg-bl' : 'left-0.5 bg-sf'}`}></div>
          </div>
        </button>
        
        <div className="flex items-center gap-3 p-3 rounded-xl bg-sf border border-bd/40 hover:border-bl/20 hover:shadow-md transition-all cursor-pointer group">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-tx to-t3 flex items-center justify-center text-xs font-bold text-bg shadow-sm shrink-0">JR</div>
          <div className="flex-1 min-w-0 overflow-hidden">
            <div className="text-sm font-bold text-tx truncate group-hover:text-bl transition-colors">Jose Rodriguez</div>
            <div className="text-[10px] font-medium text-t3 truncate">Category Coord.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
