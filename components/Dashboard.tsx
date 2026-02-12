
import React, { useMemo, useState } from 'react';
import { AreaChart, Area, BarChart, Bar, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis } from "recharts";
import { InventoryItem, TransferItem, PriceItem, HistoryItem, OrderItem } from '../types';
import { St } from './shared/UI';
import { Store, ChevronDown, Activity, Map as MapIcon, TrendingUp, AlertCircle, Building2, Globe, CheckCircle2, ArrowRight } from 'lucide-react';

interface Props {
  inv: InventoryItem[];
  tr: TransferItem[];
  prc: PriceItem[];
  hist: HistoryItem[];
  ord: OrderItem[];
  whs: string[];
}

// Map Warehouse to State Code
const WH_TO_STATE: Record<string, string> = {
  "ELITE WASHINGTON": "WA",
  "ELITE CALIFORNIA": "CA",
  "ELITE TEXAS": "TX",
  "ELITE USA BQT IL": "IL",
  "ELITE LEBANON, TN": "TN",
  "ELITE NEW JERSEY": "NJ",
  "ELITE MIAMI": "FL",
  "ELITE MIAMI -  SNB": "FL",
  "Elite Hardgoods Miami": "FL",
  "BAY STATE": "MA",
  "ELITE MIAMI 120": "FL",
  "ELITE MIAMI 250": "FL",
  "ELITE MIAMI 280": "FL",
  "ELITE MIAMI 290": "FL",
  "ELITE MIAMI 340": "FL",
  "ELITE MIAMI 725": "FL",
  "ELITE MIAMI SHIPPING": "FL",
  "ELITE MIAMI SISTER CO.": "FL",
  "ELITE MIAMI CAFETERÍA": "FL",
  "USA BQT MIAMI": "FL",
  "ELITE HARDGOODS 290": "FL",
  "ELITE LEBANON TN": "TN"
};

const STATE_NAMES: Record<string, string> = {
  "WA": "Washington",
  "CA": "California",
  "TX": "Texas",
  "IL": "Illinois",
  "TN": "Tennessee",
  "NJ": "New Jersey",
  "FL": "Florida",
  "MA": "Massachusetts"
};

const CustomTooltip = ({ active, payload, label, prefix = "" }: any) => {
  if (active && payload && payload.length && payload[0].value != null) {
    return (
      <div className="bg-sf/95 border border-bd p-3 rounded-xl shadow-xl backdrop-blur-md z-50">
        <p className="text-xs text-t3 font-bold mb-1 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-bold text-tx tabular-nums">
          {prefix}{Number(payload[0].value).toLocaleString()}
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard({ inv, tr, prc, hist, ord, whs }: Props) {
  const [selWh, setSelWh] = useState("");
  const isGlobal = selWh === "";
  const wk = Math.ceil((new Date().getTime() - new Date(2026, 0, 1).getTime()) / 604800000);

  // Calculate Operational Pressure Index (IPO)
  // Logic: % of items in Critical state (DOH < 7)
  const getPressure = (w: string) => {
     const i = inv.filter(x => x.wh.toLowerCase() === w.toLowerCase());
     if (!i.length) return 0;
     const crit = i.filter(x => x.wd > 0 && (x.q / (x.wd / 7)) < 7).length;
     return Math.round((crit / i.length) * 100);
  };

  const getRiskLevel = (p: number) => {
    if (p > 20) return { l: "Crítico", c: "var(--rd)", i: AlertCircle };
    if (p > 10) return { l: "Riesgo Medio", c: "var(--am)", i: Activity };
    return { l: "Estable", c: "var(--gn)", i: CheckCircle2 };
  };

  // Filter Data
  const fInv = useMemo(() => !isGlobal ? inv.filter(i => i.wh.toLowerCase() === selWh.toLowerCase()) : inv, [inv, selWh, isGlobal]);
  const fOrd = useMemo(() => !isGlobal ? ord.filter(o => o.wh.toLowerCase() === selWh.toLowerCase()) : ord, [ord, selWh, isGlobal]);
  const fHist = useMemo(() => !isGlobal ? hist.filter(h => h.wh.toLowerCase() === selWh.toLowerCase()) : hist, [hist, selWh, isGlobal]);
  const fTr = useMemo(() => !isGlobal ? tr.filter(t => t.fr.toLowerCase() === selWh.toLowerCase() || t.to.toLowerCase() === selWh.toLowerCase()) : tr, [tr, selWh, isGlobal]);

  // KPIs
  const crit = fInv.filter(i => i.wd > 0 && (i.q / (i.wd / 7)) < 7).length;
  const exc = fInv.filter(i => i.wd > 0 && (i.q / (i.wd / 7)) > 45).length;
  const opt = fInv.filter(i => i.wd > 0 && (i.q / (i.wd / 7)) >= 7 && (i.q / (i.wd / 7)) <= 45).length;
  
  // Stale price logic: Must have a valid date to be considered stale. If no date, ignore.
  const stale = prc.filter(p => { 
      if (!p.dt) return false; 
      try { return (new Date().getTime() - new Date(p.dt).getTime()) / 864e5 > 90; } catch { return false; } 
  }).length;
  
  const totS = fInv.reduce((a, i) => a + i.q, 0);
  const pU = fOrd.reduce((a, o) => a + o.pn, 0);
  
  // Spend Trend
  const ys = useMemo(() => {
    const dataSource = isGlobal ? hist : fHist;
    const map: Record<string, number> = {};
    const currentYear = new Date().getFullYear().toString();
    map[currentYear] = 0;
    dataSource.forEach(h => {
          let y = currentYear;
          try {
            const d = new Date(h.dt);
            if (!isNaN(d.getTime())) y = d.getFullYear().toString();
          } catch(e) {}
          map[y] = (map[y] || 0) + h.tt;
    });
    const res = Object.entries(map)
        .map(([y, v]) => ({ year: y, spend: Math.round(v) }))
        .sort((a, b) => parseInt(a.year) - parseInt(b.year));
    if (res.length > 1) return res.filter(r => r.spend > 0 || r.year === currentYear);
    return res;
  }, [isGlobal, hist, fHist]);

  // Comparative Logic
  const whS = useMemo(() => { 
    if (isGlobal) {
        const m: Record<string, number> = {}; 
        inv.forEach(i => { 
            const key = i.wh.toUpperCase(); // Normalize key
            m[key] = (m[key] || 0) + i.q; 
        });
        return Object.entries(m)
          .map(([n, q]) => ({ name: n.replace("ELITE ", "").replace(" - ", " "), qty: q }))
          .sort((a, b) => b.qty - a.qty)
          .slice(0, 8);
    }
    return []; 
  }, [inv, isGlobal]);

  const invRisk = useMemo(() => [
    { name: 'Crítico', value: crit, color: 'var(--rd)' },
    { name: 'Advertencia', value: fInv.length - (crit + opt + exc), color: 'var(--am)' },
    { name: 'Saludable', value: opt, color: 'var(--gn)' },
    { name: 'Exceso', value: exc, color: 'var(--bl)' }
  ].filter(x => x.value > 0), [crit, exc, opt, fInv.length]);

  return (
    <div className="animate-fade-in-up">
      <div className="mb-8 flex flex-col xl:flex-row xl:justify-between xl:items-end gap-6">
        <div>
          <h1 className="text-2xl font-black text-tx tracking-tight">Dashboard General</h1>
          <p className="text-sm font-medium text-t2 mt-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gn shadow-[0_0_8px_var(--gn)]"></span>
            Semana {String(wk).padStart(2, "0")} • {isGlobal ? "Operación Global" : "Vista Detallada"}
          </p>
        </div>
        
        <div className="flex items-center gap-4 bg-sf p-1.5 pr-6 rounded-2xl border border-bd/60 shadow-sm relative group hover:border-bl/30 transition-colors">
           <div className="bg-bl/10 w-10 h-10 rounded-xl flex items-center justify-center text-bl shadow-inner">
              <Store size={20} strokeWidth={2.5} />
           </div>
           <div className="flex flex-col relative z-10">
              <label className="text-[10px] font-black text-t3 uppercase tracking-widest mb-0.5">Contexto Operativo</label>
              <div className="relative">
                <select 
                    value={selWh} 
                    onChange={e => setSelWh(e.target.value)}
                    className="appearance-none bg-transparent text-sm font-bold text-tx outline-none pr-8 cursor-pointer w-48 truncate"
                >
                    <option value="">Global (Todas)</option>
                    {whs.map(w => <option key={w} value={w}>{w}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-tx pointer-events-none" />
              </div>
           </div>
           {!isGlobal && (
             <button onClick={() => setSelWh("")} className="absolute -right-2 -top-2 bg-t3 text-white rounded-full p-0.5 hover:bg-rd transition-colors shadow-sm ring-2 ring-sf">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
             </button>
           )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        <St l="Stock Crítico" v={crit} s="DOH < 7 días" c={crit > 0 ? 'var(--rd)' : 'var(--gn)'} />
        <St l="Ordenes Pendientes" v={fOrd.length} s={(pU || 0).toLocaleString() + " uds"} c="var(--cy)" />
        <St l="Exceso Stock" v={exc} s="DOH > 45 días" c={exc > 0 ? 'var(--am)' : 'var(--gn)'} />
        <St l="Total Inventario" v={(totS || 0).toLocaleString()} s={fInv.length + " SKUs"} c="var(--t2)" icon="box" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Alert Center */}
        <div className="bg-sf rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-bd/60 lg:col-span-2 relative overflow-hidden flex flex-col">
          <div className="flex justify-between items-center mb-6">
             <div>
               <h3 className="text-base font-bold text-tx tracking-tight">Centro de Alertas</h3>
               <p className="text-xs text-t2 mt-1 font-medium">Acciones requeridas hoy</p>
             </div>
             {crit > 0 && <span className="text-[10px] font-black text-white bg-rd px-3 py-1.5 rounded-full shadow-lg shadow-rd/30 animate-pulse uppercase tracking-wider">Requieren Acción</span>}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
            {crit > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-rd/20 bg-rd/5 hover:bg-rd/10 transition-all cursor-pointer group hover:-translate-y-0.5">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-rd shadow-[0_0_12px_var(--rd)] group-hover:scale-125 transition-transform"></div>
                <div>
                  <div className="text-sm font-bold text-tx">{crit} Productos Críticos</div>
                  <div className="text-xs text-t3 mt-1 font-medium">Stock peligroso por debajo de 7 días</div>
                </div>
              </div>
            )}
            {(isGlobal || stale > 0) && stale > 0 && (
              <div className="flex items-start gap-4 p-4 rounded-xl border border-am/20 bg-am/5 hover:bg-am/10 transition-all cursor-pointer group hover:-translate-y-0.5">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-am shadow-[0_0_12px_var(--am)] group-hover:scale-125 transition-transform"></div>
                <div>
                  <div className="text-sm font-bold text-tx">{stale} Precios Desactualizados</div>
                  <div className="text-xs text-t3 mt-1 font-medium">Sin cambios registrados en +90 días</div>
                </div>
              </div>
            )}
            {fTr.filter(x => x.st !== "received").map(r => (
              <div key={r.id} className="flex items-start gap-4 p-4 rounded-xl border border-bd/60 bg-s2/30 hover:bg-sf hover:shadow-md transition-all cursor-pointer group">
                 <div className="mt-1.5 w-2 h-2 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: r.st === 'preparing' ? 'var(--am)' : 'var(--bl)' }}></div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-tx">{r.id}</span>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sf border border-bd/50" style={{ color: r.st === 'preparing' ? 'var(--am)' : 'var(--bl)' }}>{r.st.replace('_', ' ')}</span>
                    </div>
                    <div className="text-xs text-t2 mt-1 truncate font-medium">{r.fr.replace('ELITE', '')} → {r.to.replace('ELITE', '')}</div>
                 </div>
              </div>
            ))}
            {crit === 0 && (!stale || !isGlobal) && fTr.filter(x => x.st !== "received").length === 0 && (
               <div className="col-span-2 text-center py-8 opacity-50">
                  <span className="text-2xl mb-2 block grayscale">✨</span>
                  <span className="text-sm font-bold text-t3">Todo en orden</span>
               </div>
            )}
          </div>
        </div>

        {/* Comparative Warehouse Cards (New) */}
        <div className="bg-sf rounded-2xl p-5 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-bd/60 flex flex-col h-full max-h-[500px] overflow-hidden">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-bd/40 shrink-0">
               <div>
                   <h3 className="text-base font-bold text-tx">Bodegas Operativas</h3>
                   <p className="text-xs text-t3 font-medium">Seleccione para filtrar vista</p>
               </div>
               <button 
                  onClick={() => setSelWh("")}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border flex items-center gap-1.5 ${
                      isGlobal 
                      ? "bg-bl text-white border-bl shadow-md shadow-bl/20" 
                      : "bg-sf text-t3 border-bd hover:bg-hv hover:text-tx"
                  }`}
               >
                  <Globe size={12} />
                  Global
               </button>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 -mr-2 pr-2 space-y-3">
               {whs.map(w => {
                  const active = selWh === w;
                  const pressure = getPressure(w);
                  const { l, c, i: Icon } = getRiskLevel(pressure);
                  const stCode = WH_TO_STATE[w] || "US";
                  const stName = STATE_NAMES[stCode] || stCode;
                  const dimmed = !isGlobal && !active;

                  return (
                      <button 
                          key={w}
                          onClick={() => setSelWh(active ? "" : w)}
                          className={`w-full relative group transition-all duration-300 rounded-xl border text-left p-4 overflow-hidden
                            ${active 
                               ? "bg-sf border-bl/50 shadow-lg shadow-bl/5 ring-1 ring-bl/20 translate-x-1" 
                               : "bg-s2/30 border-bd/60 hover:bg-sf hover:border-bd hover:shadow-sm"
                            }
                            ${dimmed ? "opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0" : "opacity-100"}
                          `}
                      >
                          {/* Active Marker */}
                          {active && <div className="absolute left-0 top-0 bottom-0 w-1 bg-bl"></div>}
                          
                          <div className="flex justify-between items-start mb-2">
                              <div>
                                  <div className="text-[10px] font-bold text-t3 uppercase tracking-widest mb-1 flex items-center gap-1">
                                    <MapIcon size={12} />
                                    {stName}
                                  </div>
                                  <div className={`text-sm font-extrabold leading-tight ${active ? "text-tx" : "text-t2"}`}>
                                      {w.replace("ELITE ", "").replace(" - ", " ")}
                                  </div>
                              </div>
                              {active && <div className="text-bl"><CheckCircle2 size={16} /></div>}
                          </div>
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-bd/30 border-dashed">
                              <div className="flex items-center gap-1.5">
                                  <Icon size={12} style={{ color: c }} />
                                  <span className="text-[11px] font-bold" style={{ color: c }}>{l}</span>
                              </div>
                              <div className="text-[10px] font-medium text-t3 tabular-nums">
                                 IPO: <span className={pressure > 20 ? "text-rd font-bold" : "text-tx"}>{pressure}%</span>
                              </div>
                          </div>
                      </button>
                  );
               })}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Spend Trend Chart */}
        <div className="bg-sf rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-bd/60 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-tx">Tendencia de Gasto {isGlobal ? "(Global)" : "(Local)"}</h3>
            {!isGlobal && <span className="text-[10px] font-bold text-bl px-2 py-1 bg-bl/5 rounded border border-bl/10 uppercase tracking-wide">Datos Filtrados</span>}
          </div>
          <div className="h-[240px] w-full relative flex-1">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={ys} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                 <defs>
                   <linearGradient id="colorSpend" x1="0" y1="0" x2="0" y2="1">
                     <stop offset="5%" stopColor="var(--bl)" stopOpacity={0.25}/>
                     <stop offset="95%" stopColor="var(--bl)" stopOpacity={0}/>
                   </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--gl)" strokeOpacity={0.5} />
                 <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--t3)', fontWeight: 600 }} dy={10} />
                 <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'var(--t3)', fontWeight: 600 }} tickFormatter={v => "$" + v} />
                 <Tooltip content={<CustomTooltip prefix="$" />} cursor={{ stroke: 'var(--bl)', strokeWidth: 1, strokeDasharray: '4 4' }} />
                 <Area type="monotone" dataKey="spend" stroke="var(--bl)" strokeWidth={3} fillOpacity={1} fill="url(#colorSpend)" activeDot={{ r: 6, strokeWidth: 4, stroke: 'var(--sf)', fill: 'var(--bl)' }} />
               </AreaChart>
             </ResponsiveContainer>
          </div>
        </div>

        {/* Comparative Metric / Risk Level */}
        <div className="bg-sf rounded-2xl p-6 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-bd/60 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-base font-bold text-tx">
              {!isGlobal ? "Nivel de Servicio & Riesgo" : "Volumen por Bodega"}
            </h3>
            {!isGlobal && <div className="flex items-center gap-1.5 px-2 py-1 bg-rd/5 rounded border border-rd/10 text-[10px] font-bold text-rd uppercase"><Activity size={12} />Presión Operativa</div>}
          </div>
          <div className="h-[240px] w-full relative flex-1">
            {!isGlobal ? (
                <div className="h-full flex flex-col justify-center">
                    <div className="space-y-4">
                      {invRisk.map((item, idx) => (
                        <div key={idx}>
                           <div className="flex justify-between text-xs font-bold mb-1.5 uppercase tracking-wide">
                              <span style={{ color: item.color }}>{item.name}</span>
                              <span className="text-tx tabular-nums">{Math.round((item.value / fInv.length) * 100)}% <span className="text-t3 font-medium ml-1 normal-case">({item.value})</span></span>
                           </div>
                           <div className="h-2.5 w-full bg-s2 rounded-full overflow-hidden shadow-inner">
                              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${(item.value / fInv.length) * 100}%`, backgroundColor: item.color }}></div>
                           </div>
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 pt-4 border-t border-bd/40 text-center">
                        <div className="text-[10px] text-t3 uppercase font-bold tracking-widest mb-1">Stock Total</div>
                        <div className="text-2xl font-black text-tx tabular-nums tracking-tight">{(totS || 0).toLocaleString()} <span className="text-xs text-t2 font-semibold">unidades</span></div>
                    </div>
                </div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={whS} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }} barSize={12}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="var(--gl)" strokeOpacity={0.5} />
                    <XAxis type="number" hide />
                    <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: 'var(--t2)', fontWeight: 600 }} width={110} />
                    <Tooltip content={<CustomTooltip />} cursor={{fill: 'var(--hv)', opacity: 0.4, radius: 4}} />
                    <Bar dataKey="qty" fill="var(--gn)" radius={[0, 4, 4, 0] as [number, number, number, number]} background={{ fill: 'var(--s2)', radius: 4 }} />
                  </BarChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="bg-sf rounded-2xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] border border-bd/60 overflow-hidden">
        <div className="p-5 border-b border-bd/40 bg-s2/20 flex justify-between items-center backdrop-blur-sm">
          <h3 className="text-base font-bold text-tx">Últimos Movimientos {!isGlobal && "(Filtrado)"}</h3>
          <button className="text-[10px] font-black text-bl hover:text-bl/80 transition-colors uppercase tracking-widest flex items-center gap-1 hover:gap-2 duration-300">Ver Todo <ArrowRight size={10} /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-s2/30 text-t3 border-b border-bd/40">
                {["PO", "Fecha", "Proveedor", "Producto", "Cant", "$/ud", "Total", "Bodega"].map(h => 
                  <th key={h} className="p-4 py-3 text-left font-bold text-[10px] tracking-widest uppercase text-t3">{h}</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-bd/30">
              {fHist.length === 0 ? (
                 <tr>
                    <td colSpan={8} className="p-12 text-center">
                        <div className="flex flex-col items-center justify-center opacity-50">
                            <AlertCircle size={24} className="mb-2 text-t3" />
                            <span className="text-t3 font-medium">No hay movimientos recientes para esta selección.</span>
                        </div>
                    </td>
                 </tr>
              ) : (
                fHist.slice(0, 5).map((r, i) => (
                  <tr key={i} className="hover:bg-hv/40 transition-colors group">
                    <td className="py-4 px-4 font-bold text-bl text-xs tabular-nums font-mono bg-s2/10 group-hover:bg-transparent">{r.po}</td>
                    <td className="py-4 px-4 text-t3 font-medium text-xs">{r.dt}</td>
                    <td className="py-4 px-4 text-tx font-bold text-xs tracking-tight">{r.sp}</td>
                    <td className="py-4 px-4 text-t2 font-medium max-w-[200px] truncate text-xs">{r.pr}</td>
                    <td className="py-4 px-4 text-right font-bold text-tx text-xs tabular-nums">{(r.qt || 0).toLocaleString()}</td>
                    <td className="py-4 px-4 text-right font-medium text-t3 text-xs tabular-nums">${r.up}</td>
                    <td className="py-4 px-4 text-right">
                        <span className="bg-gn/10 text-gn font-bold px-2 py-1 rounded-md text-xs tabular-nums border border-gn/10">${(r.tt || 0).toLocaleString()}</span>
                    </td>
                    <td className="py-4 px-4 text-t3 font-medium text-[10px] uppercase tracking-wide">{r.wh}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
