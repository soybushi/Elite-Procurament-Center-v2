
import React, { useState, useMemo } from 'react';
import { PriceItem } from '../types';
import { csv, parseCSV } from '../utils/helpers';
import { FS, XB, Th, EC, Dt, Btn, Modal, Inp, IB } from './shared/UI';
import { Plus, Search, DollarSign } from 'lucide-react';

interface Props {
  prc: PriceItem[];
  setPrc: React.Dispatch<React.SetStateAction<PriceItem[]>>;
}

export default function Prices({ prc, setPrc }: Props) {
  const [s, setS] = useState(""); 
  const [sf, setSf] = useState(""); 
  const [ff, setFf] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newPrice, setNewPrice] = useState({ nm: "", sp: "", pr: "", sb: "" });

  // Compute unique suppliers only when data changes (efficient enough for ~50k items)
  const sps = useMemo(() => {
     return Array.from(new Set(prc.map(p => p.sp).filter(Boolean))).sort();
  }, [prc]);

  // Filter Logic: Only process when filters are active
  const fil = useMemo(() => {
    // Optimization: If no filters active, return empty array to avoid rendering massive table
    if (!s && !sf && !ff) return [];

    const lowerS = s.toLowerCase();
    const now = new Date().getTime();

    // 1. Filter first on existing props (which act as in-memory cache)
    return prc.filter(p => {
        // Text Search
        if (s && !p.nm.toLowerCase().includes(lowerS) && !String(p.id).includes(lowerS)) return false;
        // Supplier Filter
        if (sf && p.sp !== sf) return false;
        return true;
    }).map(p => {
        // 2. Calculate Freshness ONLY for filtered items (Lazy Evaluation)
        let d = 999;
        try { 
          if (p.dt) { 
            d = Math.floor((now - new Date(p.dt).getTime()) / 864e5); 
            if (isNaN(d)) d = 999; 
          } 
        } catch { } 
        const fr = d > 90 ? "stale" : d > 60 ? "warning" : "fresh"; 
        return { ...p, da: d, fr };
    }).filter(p => {
        // 3. Freshness Filter
        if (ff && p.fr !== ff) return false;
        return true;
    });
  }, [prc, s, sf, ff]);

  const upP = (item: PriceItem, np: number) => { 
    setPrc(prev => prev.map(p => (p.id === item.id && p.sp === item.sp) ? { ...p, pr: +np.toFixed(2), dt: new Date().toISOString().split("T")[0] } : p)); 
  };

  const handleAdd = () => {
    if (!newPrice.nm || !newPrice.pr) return;
    setPrc(prev => [{
      id: String(Math.floor(Math.random() * 90000)),
      nm: newPrice.nm,
      sp: newPrice.sp || "",
      pr: Number(newPrice.pr),
      dt: new Date().toISOString().split("T")[0],
      sb: newPrice.sb,
      da: 0,
      fr: 'fresh'
    }, ...prev]);
    setModalOpen(false);
    setNewPrice({ nm: "", sp: "", pr: "", sb: "" });
  };
  
  const handleImport = (txt: string) => {
    const data = parseCSV(txt);
    const mapped = data.map((d: any) => ({
        id: d['e code'] || d['id'] || String(Math.floor(Math.random() * 90000)),
        nm: d['producto'] || d['nombre'] || 'Desconocido',
        sp: d['proveedor'] || '',
        pr: parseFloat(d['precio'] || '0'),
        dt: d['actualizado'] || new Date().toISOString().split("T")[0],
        sb: d['subcategoria'] || '',
        da: 0,
        fr: 'fresh'
    })).filter((i: any) => i.nm !== 'Desconocido');
    if(mapped.length > 0) setPrc(prev => [...mapped, ...prev]);
  };

  const doX = () => csv(fil, [{ k: "id", l: "E Code" }, { k: "nm", l: "Producto" }, { k: "sp", l: "Proveedor" }, { k: "pr", l: "Precio" }, { k: "dt", l: "Actualizado" }, { k: "sb", l: "Subcategoria" }], "Precios_EF");

  const hasFilters = s || sf || ff;

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-tx m-0 tracking-tight">Precios</h1>
          <p className="text-sm font-medium text-t2 mt-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tx/20"></span>
            {prc.length.toLocaleString()} registros totales
          </p>
        </div>
        <div className="flex gap-3">
           <IB onImport={handleImport} />
           <Btn variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Nuevo Precio</Btn>
           <XB onClick={doX} />
        </div>
      </div>
      
      {/* Search Panel */}
      <div className="bg-sf p-5 rounded-3xl border border-bd shadow-sm mb-6 shrink-0">
          <div className="flex flex-col md:flex-row gap-5">
            <div className="flex-1 relative group">
                 <label className="text-[10px] font-bold text-t3 uppercase tracking-wider mb-2 block ml-1">Búsqueda</label>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-t3 w-4 h-4 group-focus-within:text-bl transition-colors" />
                    <input 
                        value={s} 
                        onChange={e => setS(e.target.value)} 
                        placeholder="Buscar por código o nombre de producto..."
                        className="w-full py-3 pl-11 pr-4 rounded-2xl bg-s2/50 border border-bd text-tx text-sm outline-none font-medium placeholder-t3/70 transition-all focus:bg-sf focus:border-bl/30 focus:ring-4 focus:ring-bl/5" 
                    />
                 </div>
            </div>
            <div className="w-full md:w-72">
                 <label className="text-[10px] font-bold text-t3 uppercase tracking-wider mb-2 block ml-1">Proveedor</label>
                 <FS value={sf} onChange={setSf} options={sps} label="Todos los proveedores" />
            </div>
            <div className="w-full md:w-56">
                 <label className="text-[10px] font-bold text-t3 uppercase tracking-wider mb-2 block ml-1">Estado</label>
                 <FS value={ff} onChange={setFf} options={["fresh", "warning", "stale"]} label="Cualquiera" />
            </div>
          </div>
      </div>

      <div className="bg-sf rounded-3xl overflow-hidden shadow-sm border border-bd flex-1 flex flex-col min-h-0 relative">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          {!hasFilters ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-t3/50 p-8 select-none">
                  <div className="w-24 h-24 rounded-full bg-s2 flex items-center justify-center mb-6 border border-bd/60">
                      <Search size={40} className="text-bd" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-bold text-t2 mb-2">Búsqueda de Precios</h3>
                  <p className="text-sm max-w-sm text-center font-medium opacity-80">Ingrese un código, nombre de producto o seleccione un proveedor arriba para consultar la matriz de precios.</p>
              </div>
          ) : fil.length === 0 ? (
               <div className="absolute inset-0 flex flex-col items-center justify-center text-t3/50 p-8 select-none">
                  <div className="w-20 h-20 rounded-full bg-rd/5 flex items-center justify-center mb-4">
                      <DollarSign size={32} className="text-rd/40" />
                  </div>
                  <p className="text-base font-bold text-t3">No se encontraron resultados</p>
                  <p className="text-sm mt-1">Intente con otros términos</p>
              </div>
          ) : (
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-s2/80 z-10 shadow-sm backdrop-blur-md">
              <tr>
                <Th w={110}>Cod</Th>
                <Th>Producto</Th>
                <Th w={240}>Proveedor</Th>
                <Th w={130} a="right">Precio</Th>
                <Th w={140}>Actualizado</Th>
                <Th w={140}>Frescura</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd">
              {fil.map((item, i) => (
                <tr key={item.id + "-" + item.sp + i} 
                    className={`transition-colors h-16 group ${item.fr === 'stale' ? 'bg-rd/5 hover:bg-rd/10' : 'hover:bg-ac/30'}`}>
                  <td className="px-5 py-3 align-middle first:pl-8">
                      <span className="font-mono font-bold text-bl text-xs bg-bl/10 px-2.5 py-1 rounded-lg">
                          {item.id}
                      </span>
                  </td>
                  <td className="px-5 py-3 align-middle">
                    <div className="font-bold text-tx text-sm">{item.nm}</div>
                    {item.sb && <div className="text-[10px] text-t3 font-bold mt-0.5 uppercase tracking-wide">{item.sb}</div>}
                  </td>
                  <td className="px-5 py-3 align-middle text-t2 text-xs font-medium truncate max-w-[240px]">{item.sp || "—"}</td>
                  <td className="px-5 py-3 align-middle text-right text-tx">
                    <span className="text-t3 mr-1 font-semibold text-xs">$</span><EC value={item.pr} num onSave={v => upP(item, v)} />
                  </td>
                  <td className="px-5 py-3 align-middle text-t3 text-xs font-mono">{item.dt || "—"}</td>
                  <td className="px-5 py-3 align-middle last:pr-8">
                    <div className="flex items-center gap-2">
                      <Dt c={item.fr === "stale" ? "var(--rd)" : item.fr === "warning" ? "var(--am)" : "var(--gn)"} />
                      <span className="text-[10px] font-black uppercase tracking-wider" style={{ color: item.fr === "stale" ? "var(--rd)" : item.fr === "warning" ? "var(--am)" : "var(--gn)" }}>
                        {item.da !== undefined && item.da < 999 ? item.da + " días" : "—"}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
        {hasFilters && (
            <div className="p-4 border-t border-bd bg-s2/20 text-[10px] text-t3 font-bold uppercase tracking-wider flex justify-between items-center shrink-0">
                <span>Resultados: {fil.length.toLocaleString()}</span>
                <span>Matriz completa: {prc.length.toLocaleString()} items</span>
            </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Nuevo Precio" onSave={handleAdd}>
        <Inp label="Producto" value={newPrice.nm} onChange={(v: string) => setNewPrice({...newPrice, nm: v})} placeholder="Nombre" />
        <div className="grid grid-cols-2 gap-6">
           <Inp label="Proveedor" value={newPrice.sp} onChange={(v: string) => setNewPrice({...newPrice, sp: v})} placeholder="Nombre Proveedor" />
           <Inp label="Precio Unitario" type="number" value={newPrice.pr} onChange={(v: string) => setNewPrice({...newPrice, pr: v})} placeholder="0.00" />
        </div>
        <Inp label="Subcategoría" value={newPrice.sb} onChange={(v: string) => setNewPrice({...newPrice, sb: v})} placeholder="Opcional" />
      </Modal>
    </div>
  );
}
