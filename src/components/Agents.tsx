import React from 'react';

export default function AgM() {
  const AC: Record<string, string> = { FITO: "var(--bl)", RHEA: "var(--vi)", REMO: "var(--am)", VEGA: "var(--gn)", NILO: "var(--cy)", ATLAS: "var(--pk)" };
  const ag = [{ id: "FITO", role: "Centro de Comando" }, { id: "RHEA", role: "Demanda y POs" }, { id: "REMO", role: "Precios" }, { id: "VEGA", role: "Logistica" }, { id: "NILO", role: "Inventario" }, { id: "ATLAS", role: "Reportes" }];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-tx m-0 tracking-tight">Agentes IA</h1>
        <p className="text-sm font-medium text-t2 mt-1.5">6 agentes especializados en operación</p>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {ag.map(a => (
          <div key={a.id} className="p-5 rounded-2xl bg-sf border border-bd/40 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg shadow-sm group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 opacity-5 rounded-bl-full transition-opacity group-hover:opacity-10" style={{ backgroundColor: AC[a.id] }}></div>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black mb-3 transition-transform group-hover:scale-110"
                 style={{ backgroundColor: AC[a.id] + "15", color: AC[a.id] }}>
              {a.id[0]}
            </div>
            <div className="text-sm font-extrabold text-tx tracking-tight">{a.id}</div>
            <div className="text-xs text-t2 font-medium mt-1">{a.role}</div>
            <div className="mt-4 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: AC[a.id] }}>
               <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: AC[a.id] }}></span>
               Activo
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}