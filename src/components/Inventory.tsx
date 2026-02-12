
import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { InventoryItem, PriceItem, HistoryItem } from '../types';
import { csv, parseCSV } from '../utils/helpers';
import { getProductByCode } from '../utils/data';
import { SI, FS, Th, EC, Inp, Btn, Modal } from './shared/UI';
import { Info, Box, BarChart3, PieChart as PieChartIcon, Package, ArrowUp, ArrowDown, ArrowUpDown, Warehouse, Percent, Hash, Upload, Download, Trash2, X, AlertTriangle, ArrowRightLeft, Plus, CheckCircle2, AlertCircle, Maximize2, Minimize2, ArrowRight, Activity, Eraser, RotateCcw, Check } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// Animation Helper Component
const CountUp = ({ value, duration = 800, formatter }: { value: number, duration?: number, formatter?: (v: number) => string }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = null;
    let rafId: number;

    const animate = (time: number) => {
      if (startTimeRef.current === null) startTimeRef.current = time;
      const timeElapsed = time - startTimeRef.current;
      const progress = Math.min(timeElapsed / duration, 1);
      
      // Ease-in-out cubic
      const ease = progress < 0.5 
          ? 4 * progress * progress * progress 
          : 1 - Math.pow(-2 * progress + 2, 3) / 2;
      
      const current = startRef.current + (value - startRef.current) * ease;
      setDisplay(current);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };
    
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]); 

  const fmt = formatter || ((v) => Math.round(v).toLocaleString());
  return <>{fmt(display)}</>;
};

interface Props {
  inv: InventoryItem[];
  setInv: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  whs: string[];
  prc: PriceItem[];
  setHist: React.Dispatch<React.SetStateAction<HistoryItem[]>>;
}

export default function Inventory({ inv, setInv, whs, prc, setHist }: Props) {
  const [s, setS] = useState(""); 
  const [wf, setWf] = useState(""); 
  const [showAnalytics, setShowAnalytics] = useState(true);
  
  // Movements State (Replaces Stock Out & New Item)
  const [moveModalOpen, setMoveModalOpen] = useState(false);
  const [moveModalFullscreen, setMoveModalFullscreen] = useState(false);
  const [moveType, setMoveType] = useState<'IN' | 'OUT'>('OUT'); // Default to OUT to keep flow
  const [moveWh, setMoveWh] = useState("");
  // Added cost field for IN movements
  const [moveRows, setMoveRows] = useState([{ id: Date.now(), code: "", desc: "", q: "", cost: "" }]);
  const [focusIdx, setFocusIdx] = useState(0); // Track focused row for side panel
  const [clearFeedback, setClearFeedback] = useState(false);
  
  // Confirmation Modal State
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);
  
  // Analytics Visual State
  const [blockOpacity, setBlockOpacity] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const invRef = useRef(inv);

  useEffect(() => {
    invRef.current = inv;
  }, [inv]);
  
  // Sorting State
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | 'none' }>({ key: 'none', direction: 'none' });

  // Calculate Total Volume (Quantity) per Warehouse for % calculation
  const whVolume = useMemo(() => {
    const map: Record<string, number> = {};
    inv.forEach(i => {
        const q = i.q || 0;
        if (q > 0) {
            map[i.wh] = (map[i.wh] || 0) + q;
        }
    });
    return map;
  }, [inv]);

  // Filter Logic
  const fil = useMemo(() => inv.filter((i: any) => 
    (!s || i.nm.toLowerCase().includes(s.toLowerCase()) || String(i.id).includes(s)) && 
    (!wf || i.wh.toLowerCase() === wf.toLowerCase())
  ), [inv, s, wf]);

  // Sorting Logic
  const sortedFil = useMemo(() => {
    let data = [...fil];
    if (sortConfig.direction !== 'none') {
       data.sort((a: any, b: any) => {
         let valA: any = a[sortConfig.key];
         let valB: any = b[sortConfig.key];

         // Special handling for calculated fields
         if (sortConfig.key === 'pct') {
            const volA = whVolume[a.wh] || 1;
            const volB = whVolume[b.wh] || 1;
            valA = (a.q || 0) / volA;
            valB = (b.q || 0) / volB;
         } else {
             // Null safety
             if (valA === undefined || valA === null) valA = '';
             if (valB === undefined || valB === null) valB = '';
             
             // Case insensitive for strings
             if (typeof valA === 'string' && typeof valB === 'string') {
                 return sortConfig.direction === 'asc' 
                    ? valA.localeCompare(valB, undefined, { numeric: true }) 
                    : valB.localeCompare(valA, undefined, { numeric: true });
             }
         }

         if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
         if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
         return 0;
       });
    }
    return data;
  }, [fil, sortConfig, whVolume]);

  // --- ANALYTICS LOGIC ---
  const stats = useMemo(() => {
    if (fil.length === 0) return null;

    const totalQty = fil.reduce((acc, i) => acc + (i.q || 0), 0);
    const uniqueCodes = new Set(fil.map(i => i.id)).size;
    const uniqueWhs = new Set(fil.map(i => i.wh)).size;

    // Top 3 by Volume (Items)
    const sortedByQty = [...fil].sort((a, b) => (b.q || 0) - (a.q || 0));
    const top3 = sortedByQty.slice(0, 3);
    // Pad to 3 if fewer items to maintain layout stability
    while (top3.length < 3) {
        top3.push({ id: '', nm: '', q: 0, wh: '' } as any);
    }

    // Distribution by Category (Local View)
    const catMap = new Map<string, number>();
    fil.forEach(i => {
        const c = i.cat ? i.cat.toUpperCase() : "SIN CATEGORÍA";
        catMap.set(c, (catMap.get(c) || 0) + (i.q || 0));
    });
    const dist = Array.from(catMap.entries())
        .map(([name, qty]) => ({ name, qty, pct: totalQty ? (qty / totalQty) * 100 : 0 }))
        .sort((a, b) => b.qty - a.qty);
    while (dist.length < 3) dist.push({ name: '', qty: 0, pct: 0 });

    // Distribution by Warehouse (Global View)
    const whMap = new Map<string, number>();
    fil.forEach(i => {
        whMap.set(i.wh, (whMap.get(i.wh) || 0) + (i.q || 0));
    });
    const whDist = Array.from(whMap.entries())
        .map(([name, qty]) => ({ name: name.replace("ELITE ", ""), qty, pct: totalQty ? (qty / totalQty) * 100 : 0 }))
        .sort((a, b) => b.qty - a.qty);
    while (whDist.length < 3) whDist.push({ name: '', qty: 0, pct: 0 });

    // --- ESTIMATED VALUE & CONCENTRATION CALCULATION ---
    // 1. Build Price Map (Min/Max per product)
    const productCosts = new Map<string, {min: number, max: number}>();
    prc.forEach(p => {
        const pid = String(p.id);
        const price = p.pr;
        if (!productCosts.has(pid)) {
            productCosts.set(pid, { min: price, max: price });
        } else {
            const current = productCosts.get(pid)!;
            if (price < current.min) current.min = price;
            if (price > current.max) current.max = price;
        }
    });

    let estVal = 0;
    const skuValueMap = new Map<string, { val: number, nm: string }>();

    fil.forEach(item => {
        const pid = String(item.id);
        const costs = productCosts.get(pid);
        if (costs) {
            const avg = (costs.min + costs.max) / 2;
            const val = avg * (item.q || 0);
            estVal += val;
            
            const current = skuValueMap.get(pid) || { val: 0, nm: item.nm };
            current.val += val;
            // Ensure we have a name
            if (!current.nm && item.nm) current.nm = item.nm;
            skuValueMap.set(pid, current);
        }
    });

    // Find Top 1 SKU by Value for Concentration
    let maxSku = { id: '', val: 0, nm: '' };
    for (const [id, data] of skuValueMap.entries()) {
        if (data.val > maxSku.val) {
             maxSku = { id, val: data.val, nm: data.nm };
        }
    }
    
    // Construct Concentration Data (Value based)
    const restValue = estVal - maxSku.val;
    const concentration = [
        { name: maxSku.nm ? `Top 1: ${maxSku.nm.substring(0, 15)}...` : 'Top 1 SKU', value: maxSku.val },
        { name: 'Resto (Valor)', value: restValue }
    ].filter(x => x.value > 0);

    return { totalQty, uniqueCodes, uniqueWhs, top3, dist, whDist, concentration, estimatedValue: estVal, topSku: maxSku };
  }, [fil, prc]);

  // Analytics pulse effect
  useEffect(() => {
    if (stats) {
        setBlockOpacity(0.85);
        const timer = setTimeout(() => setBlockOpacity(1), 150);
        return () => clearTimeout(timer);
    }
  }, [stats]);

  const up = (item: any, f: string, v: number) => { 
    setInv(p => p.map(i => (i.id === item.id && i.wh === item.wh) ? { ...i, [f]: v } : i)); 
  };
  
  // Check if movement form has data (dirty) to lock mode switching
  const isMoveDirty = useMemo(() => moveRows.length > 1 || moveRows.some(r => r.code || r.q), [moveRows]);

  // --- MOVEMENTS LOGIC ---
  const handleAddMoveRow = () => {
    if (!moveWh) {
        // Fallback safety, though UI is disabled
        return;
    }
    setMoveRows(prev => [...prev, { id: Date.now(), code: "", desc: "", q: "", cost: "" }]);
  };

  const handleRemoveMoveRow = (id: number) => {
    setMoveRows(prev => prev.filter(row => row.id !== id));
  };
  
  const handleResetMoveRow = (id: number) => {
      const row = moveRows.find(r => r.id === id);
      if (row && (row.code || row.q || row.cost)) {
         if (window.confirm("¿Estás seguro de que deseas limpiar esta fila?")) {
            setMoveRows(prev => prev.map(r => 
              r.id === id ? { ...r, code: "", desc: "", q: "", cost: "" } : r
            ));
         }
      }
  };

  const handleClearQuantities = () => {
      if (!moveWh) return;
      setMoveRows(prev => prev.map(r => ({ ...r, q: "" })));
      setClearFeedback(true);
      setTimeout(() => setClearFeedback(false), 1500);
  };

  const findInventoryItem = useCallback((code: string, warehouse?: string) => {
    return invRef.current.find(i => String(i.id) === String(code) && (!warehouse || i.wh === warehouse));
  }, []);

  const isKnownProductCode = useCallback((code: string) => {
    if (!code) return true;
    return invRef.current.some(i => String(i.id) === String(code)) || !!getProductByCode(code);
  }, []);

  const handleMoveRowChange = (id: number, field: string, value: string) => {
    setMoveRows(prev => prev.map(row => {
        if (row.id !== id) return row;
        const updated: any = { ...row, [field]: value };
        
        // Auto-complete Description
        if (field === 'code') {
             // Find description from any item with same ID (desc should be consistent)
             let found = findInventoryItem(value);
             if (!found) {
                // If not in inventory, check master data
                const m = getProductByCode(value);
                if (m) found = { nm: m.nm } as any;
             }
             updated.desc = found ? found.nm : "";
        }
        return updated;
    }));
  };

const validateAndConfirm = useCallback(() => {
  if (!moveWh) {
    alert("Seleccione una bodega.");
    return;
  }

  const validRows = moveRows.filter(r => r.code && Number(r.q) > 0);

  if (validRows.length === 0) {
    alert("Debe agregar al menos un producto con cantidad válida.");
    return;
  }

  if (moveType === "OUT") {
    for (let row of validRows) {
      const stockItem = findInventoryItem(String(row.code), moveWh);

      if (!stockItem) {
        alert(`El producto ${row.code} no existe en esta bodega.`);
        return;
      }

      if (Number(row.q) > stockItem.q) {
        alert(
          `Stock insuficiente para ${row.code}. Disponible: ${stockItem.q}`
        );
        return;
      }
    }
  }

  setConfirmOpen(true);
}, [findInventoryItem, moveRows, moveType, moveWh]);

const executeMovement = useCallback(() => {
  const validRows = moveRows.filter(r => r.code && Number(r.q) > 0);
  const modifier = moveType === "IN" ? 1 : -1;
  const batchId = (moveType === "IN" ? "IN-" : "OUT-") + Date.now().toString();
  const now = new Date().toISOString();

  const newHistoryItems = validRows.map(row => ({
    po: batchId,
    dt: now,
    wh: moveWh,
    sp: "Manual",
    pr: row.desc || row.code,
    qt: Number(row.q) * modifier,
    up: moveType === "IN" ? Number(row.cost || 0) : 0,
    tt:
      moveType === "IN"
        ? Number(row.q) * Number(row.cost || 0)
        : 0
  }));

  setHist(prev => [...newHistoryItems, ...prev]);

  setInv(prevInv => {
    const updated = [...prevInv];

    validRows.forEach(row => {
      const index = updated.findIndex(
        i => String(i.id) === String(row.code) && i.wh === moveWh
      );

      const qty = Number(row.q);

      if (index >= 0) {
        updated[index] = {
          ...updated[index],
          q: updated[index].q + qty * modifier
        };
      } else if (moveType === "IN") {
        updated.push({
          id: row.code,
          nm: row.desc || row.code,
          cat: "",
          sb: "",
          unimed: "UND",
          wh: moveWh,
          q: qty,
          wd: 0
        });
      }
    });

    return updated;
  });

  setConfirmOpen(false);
  setMoveRows([{ id: Date.now(), code: "", desc: "", q: "", cost: "" }]);
  setFocusIdx(0); 
  setSuccessAnim(true);

  setTimeout(() => {
    setSuccessAnim(false);
  }, 2500);
}, [moveRows, moveType, moveWh, setHist, setInv]);

  const validateAndConfirmRef = useRef(validateAndConfirm);
  const executeMovementRef = useRef(executeMovement);

  useEffect(() => {
    validateAndConfirmRef.current = validateAndConfirm;
  }, [validateAndConfirm]);

  useEffect(() => {
    executeMovementRef.current = executeMovement;
  }, [executeMovement]);

  const handleConfirmMovementClick = useCallback(() => {
    validateAndConfirmRef.current();
  }, []);

  const handleExecuteMovement = useCallback(() => {
    executeMovementRef.current();
  }, []);
  
  const handleImport = (txt: string) => {
    const data = parseCSV(txt);
    // Strict mapping: codins, nomins, nomgru, nomsub, unimed, nomalm, cant
    const mapped = data.map((d: any) => ({
        id: d['codins'] || '', 
        nm: d['nomins'] || '',
        cat: d['nomgru'] || '', 
        sb: d['nomsub'] || '', 
        unimed: d['unimed'] || '', 
        wh: d['nomalm'] || '', 
        q: d['cant'] ? parseFloat(d['cant']) : 0,
        st: '', 
        wd: 0 
    })).filter((i: any) => i.id || i.nm); 
    
    if(mapped.length > 0) setInv(prev => [...mapped, ...prev] as any);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      if (!file.name.toLowerCase().endsWith('.csv')) {
        alert("Formato no válido. Solo se aceptan archivos CSV (.csv) con codificación UTF-8.");
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) handleImport(ev.target.result as string);
      };
      reader.readAsText(file, "UTF-8");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const doX = () => csv(sortedFil.map((i: any) => {
      const totalVol = whVolume[i.wh] || 0;
      const pct = (i.q && totalVol) ? (i.q / totalVol) : 0;

      return { 
        Codigo: i.id, 
        Descripcion: i.nm, 
        Categoria: i.cat || "", 
        Subcategoria: i.sb || "", 
        Medida: i.unimed || "", 
        Bodega: i.wh, 
        Cantidad: i.q,
        PctVolumen: pct ? (pct * 100).toFixed(4) + '%' : ""
      };
  }), 
    [
        { k: "Codigo", l: "Código" }, 
        { k: "Descripcion", l: "Descripción" }, 
        { k: "Categoria", l: "Categoría" },
        { k: "Subcategoria", l: "Subcategoría" },
        { k: "Medida", l: "Medida" },
        { k: "Bodega", l: "Bodega" },
        { k: "Cantidad", l: "Cantidad" },
        { k: "PctVolumen", l: "% Volumen Bodega" }
    ], 
    "Inventario_EF_Master");

  // Handler for sorting headers
  const handleSort = (key: string) => {
      setSortConfig(curr => 
          curr.key === key 
              ? { key, direction: curr.direction === 'none' ? 'asc' : curr.direction === 'asc' ? 'desc' : 'none' } 
              : { key, direction: 'asc' }
      );
  };
  
  const SortIcon = ({ colKey }: { colKey: string }) => {
      if (sortConfig.key !== colKey || sortConfig.direction === 'none') return <ArrowUpDown size={12} className="text-t3/30 group-hover:text-t3/60" />;
      if (sortConfig.direction === 'asc') return <ArrowUp size={12} strokeWidth={3} className="text-bl" />;
      return <ArrowDown size={12} strokeWidth={3} className="text-bl" />;
  };
  
  const SortHeader = ({ label, colKey, align }: { label: string, colKey: string, align?: string }) => (
      <div 
        className={`flex items-center gap-2 cursor-pointer select-none group hover:text-tx transition-colors ${align === 'right' ? 'justify-end' : align === 'center' ? 'justify-center' : 'justify-start'}`}
        onClick={() => handleSort(colKey)}
      >
        {label}
        <SortIcon colKey={colKey} />
      </div>
  );

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-tx m-0 tracking-tight">Inventario Maestro</h1>
          <p className="text-sm font-medium text-t2 mt-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gn shadow-[0_0_12px_var(--gn)]"></span>
            {fil.length.toLocaleString()} SKUs • Vista Oficial
          </p>
        </div>
        <div className="flex items-center gap-6">
           <button onClick={() => setShowAnalytics(!showAnalytics)} className={`px-5 py-2.5 rounded-xl border transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-wide ${showAnalytics ? 'bg-bl/10 text-bl border-bl/20' : 'bg-transparent text-t3 border-bd hover:text-tx'}`}>
               <BarChart3 size={16} /> Análisis
           </button>
           <div className="w-px h-8 bg-bd"></div>
           <div className="flex gap-3">
              {/* Movimientos (Unified) */}
              <button 
                 onClick={() => setMoveModalOpen(true)} 
                 className="px-5 py-2.5 rounded-xl border border-[#535386] text-[#535386] flex items-center gap-2 text-xs font-bold uppercase tracking-wide bg-transparent hover:bg-[#535386]/5 transition-all active:scale-95"
               >
                  <ArrowRightLeft size={16} strokeWidth={2.5} />
                  Movimientos
               </button>
               
               {/* Importar */}
               <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="px-5 py-2.5 rounded-xl border border-[#535386] text-[#535386] flex items-center gap-2 text-xs font-bold uppercase tracking-wide bg-transparent hover:bg-[#535386]/5 transition-all active:scale-95"
               >
                  <Upload size={16} strokeWidth={2.5} />
                  Importar
               </button>

               {/* Exportar */}
               <button 
                 onClick={doX}
                 className="px-5 py-2.5 rounded-xl border border-[#535386] text-[#535386] flex items-center gap-2 text-xs font-bold uppercase tracking-wide bg-transparent hover:bg-[#535386]/5 transition-all active:scale-95"
               >
                  <Download size={16} strokeWidth={2.5} />
                  Exportar
               </button>
           </div>
        </div>
      </div>
      
      <div className="flex gap-4 mb-6 p-1 shrink-0 flex-wrap">
        <SI value={s} onChange={setS} ph="Buscar código o descripción..." />
        <FS value={wf} onChange={setWf} options={whs} label="Todas las bodegas" />
      </div>

      {/* --- ANALYTICS SECTION --- */}
      {showAnalytics && stats && (
         <div 
            className="bg-sf border border-bd rounded-3xl p-6 mb-6 shadow-sm grid grid-cols-1 lg:grid-cols-5 gap-0 relative transition-opacity duration-500 ease-in-out"
            style={{ opacity: blockOpacity }}
         >
             {/* 1. KPIs Compact */}
             <div className="lg:col-span-1 flex flex-col h-full">
                 <h3 className="text-[10px] font-black text-t3 uppercase tracking-widest mb-4 text-center">Resumen General</h3>
                 <div className="flex-1 flex flex-col justify-center">
                     <div className="grid grid-cols-2 gap-x-6 gap-y-10 mx-auto max-w-[260px]">
                        
                         {/* Item 1: Dom Valor */}
                         <div className="flex flex-col items-center group relative w-full">
                            <div className="text-3xl font-black text-tx leading-none tracking-tight tabular-nums relative z-10">
                                {stats.estimatedValue > 0 ? (
                                    <CountUp 
                                        value={(stats.topSku.val / stats.estimatedValue) * 100} 
                                        formatter={(v) => v.toFixed(1) + '%'} 
                                    />
                                ) : '-'}
                            </div>
                            <div className="text-[9px] font-bold text-t3 uppercase tracking-widest mt-2 flex items-center gap-1.5 opacity-70">
                                <Percent size={11} strokeWidth={2.5} />
                                Dom. Valor
                            </div>
                            {/* Tooltip (Detailed) */}
                            {stats.estimatedValue > 0 && stats.topSku.id && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity w-max max-w-[220px]">
                                    <div className="bg-sf border border-bd rounded-xl shadow-xl p-3 text-left">
                                        <div className="text-[10px] font-bold text-tx mb-1.5 leading-snug">
                                            <span className="text-bl mr-1">#{stats.topSku.id}</span>
                                            {stats.topSku.nm}
                                        </div>
                                        <div className="flex items-end justify-between gap-4 border-t border-bd/40 pt-2">
                                            <div>
                                                <div className="text-[9px] text-t3 font-bold uppercase tracking-wider mb-0.5">Valor Est.</div>
                                                <div className="text-sm font-black text-tx tabular-nums leading-none">
                                                    ${stats.topSku.val.toLocaleString(undefined, {maximumFractionDigits: 0})}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-[9px] text-t3 font-bold uppercase tracking-wider mb-0.5">Dominancia</div>
                                                <div className="text-xs font-bold text-bl tabular-nums leading-none">
                                                    {((stats.topSku.val / stats.estimatedValue) * 100).toFixed(1)}%
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                         </div>

                         {/* Item 2: Unique Codes */}
                         <div className="flex flex-col items-center w-full">
                            <div className="text-3xl font-black text-tx leading-none tracking-tight tabular-nums">
                                <CountUp value={stats.uniqueCodes} />
                            </div>
                            <div className="text-[9px] font-bold text-t3 uppercase tracking-widest mt-2 flex items-center gap-1.5 opacity-70">
                                <Hash size={11} strokeWidth={2.5} />
                                Códigos
                            </div>
                         </div>

                         {/* Item 3: Active Warehouses */}
                         <div className="flex flex-col items-center w-full">
                            <div className="text-3xl font-black text-tx leading-none tracking-tight tabular-nums">
                                <CountUp value={stats.uniqueWhs} />
                            </div>
                            <div className="text-[9px] font-bold text-t3 uppercase tracking-widest mt-2 flex items-center gap-1.5 opacity-70">
                                <Warehouse size={11} strokeWidth={2.5} />
                                Bodegas
                            </div>
                         </div>

                         {/* Item 4: Total Qty */}
                         <div className="flex flex-col items-center w-full">
                            <div className="text-3xl font-black text-bl leading-none tracking-tight tabular-nums">
                                <CountUp 
                                    value={stats.totalQty} 
                                    formatter={(v) => (v >= 10000) ? (v/1000).toFixed(1) + 'k' : Math.round(v).toLocaleString()} 
                                />
                            </div>
                            <div className="text-[9px] font-bold text-t3/80 uppercase tracking-widest mt-2 flex items-center gap-1.5 opacity-70">
                                <Package size={11} strokeWidth={2.5} />
                                Unidades
                            </div>
                         </div>

                     </div>
                 </div>
             </div>

             {/* 2. Estimated Inventory Value */}
             <div className="lg:col-span-1 flex flex-col lg:px-6 lg:border-l border-bd/40 mt-6 lg:mt-0">
                 <h3 className="text-[10px] font-black text-t3 uppercase tracking-widest mb-4 text-center">Valor Estimado de Inventario</h3>
                 <div className="flex-1 flex flex-col items-center justify-center h-28">
                     <div className="text-[40px] font-black text-gn tracking-tight tabular-nums flex items-baseline gap-1">
                         <span className="text-2xl">$</span>
                         <CountUp 
                            value={stats.estimatedValue || 0} 
                            formatter={(v) => v.toLocaleString(undefined, {maximumFractionDigits: 0})}
                         />
                     </div>
                     <div className="text-[9px] text-t3 font-medium mt-3 text-center max-w-[140px] leading-tight flex items-center justify-center gap-1 bg-s2 px-2 py-1 rounded">
                         <Info size={10} />
                         Ref. Costo Promedio (Min/Max)
                     </div>
                 </div>
             </div>

             {/* 3. Inventory Concentration */}
             <div className="lg:col-span-1 flex flex-col lg:px-6 lg:border-l border-bd/40 mt-6 lg:mt-0">
                 <h3 className="text-[10px] font-black text-t3 uppercase tracking-widest mb-4 text-center">Concentración (Valor)</h3>
                 <div className="flex-1 flex flex-col justify-center h-28">
                     <div className="h-28 w-full relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie 
                                    data={stats.concentration} 
                                    innerRadius={25} 
                                    outerRadius={40} 
                                    paddingAngle={2} 
                                    dataKey="value"
                                    stroke="none"
                                    isAnimationActive={true}
                                    animationDuration={800}
                                    animationEasing="ease-in-out"
                                >
                                    <Cell fill="var(--bl)" />
                                    <Cell fill="var(--bd)" opacity={0.5} />
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ backgroundColor: 'var(--sf)', borderColor: 'var(--bd)', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ color: 'var(--tx)' }}
                                    formatter={(value: any) => [`$${(value || 0).toLocaleString(undefined, {maximumFractionDigits: 0})}`, 'Valor Est.']} 
                                />
                            </PieChart>
                         </ResponsiveContainer>
                     </div>
                     <div className="text-center mt-2 px-2 flex flex-col items-center">
                         {stats.topSku?.id ? (
                            <>
                                <div className="text-[10px] font-bold text-tx truncate w-full" title={`Código: ${stats.topSku.id}`}>
                                    <span className="text-bl mr-1">#{stats.topSku.id}</span>
                                </div>
                                <div className="text-[9px] font-medium text-t3 truncate w-full" title={stats.topSku.nm}>
                                    {stats.topSku.nm}
                                </div>
                            </>
                         ) : (
                             <span className="text-[10px] text-t3 font-medium">Sin datos</span>
                         )}
                     </div>
                 </div>
             </div>

             {/* 4. Top 3 Volume Visual Block */}
             <div className="lg:col-span-1 flex flex-col lg:px-6 lg:border-l border-bd/40 mt-6 lg:mt-0">
                 <h3 className="text-[10px] font-black text-t3 uppercase tracking-widest mb-4 text-center">Top 3 SKUs (Volumen)</h3>
                 <div className="flex flex-col gap-3 justify-center flex-1">
                    {stats.top3.map((item, idx) => {
                        const maxVal = stats.top3[0]?.q || 1;
                        const width = item.q ? `${(item.q / maxVal) * 100}%` : '0%';
                        return (
                            <div key={idx} className="group relative">
                                <div className="flex justify-between items-center mb-1 text-[10px]">
                                    <div className="flex items-center gap-1.5 min-w-0 pr-2">
                                        <span className="opacity-50 font-mono text-t3">{item.id || "-"}</span>
                                        <span className="font-bold text-tx truncate max-w-[100px]" title={item.nm}>{item.nm || "-"}</span>
                                    </div>
                                    <span className="font-mono font-bold text-tx/80 tabular-nums shrink-0">
                                        {item.q ? <CountUp value={item.q} duration={600} /> : "0"}
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-s2 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full rounded-full transition-all duration-[800ms] ease-in-out bg-bl" 
                                        style={{ width, opacity: 1 - (idx * 0.15) }}
                                    ></div>
                                </div>
                                {item.id && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 pointer-events-none w-max max-w-[220px]">
                                        <div className="bg-sf border border-bd rounded-xl shadow-xl p-3">
                                            <div className="text-[10px] font-bold text-tx mb-1.5 leading-snug">
                                                <span className="text-bl mr-1">#{item.id}</span>
                                                {item.nm}
                                            </div>
                                            <div className="flex items-end justify-between gap-4 border-t border-bd/40 pt-2">
                                                <div>
                                                    <div className="text-[9px] text-t3 font-bold uppercase tracking-wider mb-0.5">Volumen</div>
                                                    <div className="text-sm font-black text-tx tabular-nums leading-none">{(item.q || 0).toLocaleString()}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-[9px] text-t3 font-bold uppercase tracking-wider mb-0.5">% del Total</div>
                                                    <div className="text-xs font-bold text-bl tabular-nums leading-none">{((item.q / (stats.totalQty || 1)) * 100).toFixed(2)}%</div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                 </div>
             </div>

             {/* 5. Dynamic Distribution Block */}
             <div className="lg:col-span-1 flex flex-col lg:pl-6 lg:border-l border-bd/40 mt-6 lg:mt-0">
                 <h3 className="text-[10px] font-black text-t3 uppercase tracking-widest mb-4 flex items-center justify-center gap-2">
                     {!wf ? <Warehouse size={12} /> : <PieChartIcon size={12} />} 
                     {!wf ? "Volumen por Bodega" : "Distribución"}
                 </h3>
                 
                 <div className="flex-1 flex flex-col gap-3 justify-center">
                     {(!wf ? stats.whDist : stats.dist).slice(0, 3).map((d, idx) => (
                         <div key={idx} className="group relative">
                             <div className="flex justify-between items-center mb-1 text-[10px]">
                                 <span className="font-bold text-tx truncate w-24" title={d.name}>{d.name || "-"}</span>
                             </div>
                             <div className="h-3 w-full bg-s2 rounded-full overflow-hidden">
                                 <div 
                                    className={`h-full rounded-full transition-all duration-[800ms] ease-in-out ${!wf ? 'bg-bl' : 'bg-vi'}`} 
                                    style={{ width: `${d.pct}%`, opacity: 0.8 - (idx * 0.05) }}
                                 ></div>
                             </div>
                             {d.name && (
                                 <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute right-0 bottom-full mb-2 z-50 pointer-events-none">
                                     <div className="bg-sf border border-bd rounded-xl shadow-xl p-3 min-w-[120px]">
                                         <div className="text-[10px] text-t3 font-bold uppercase tracking-wider mb-1 truncate max-w-[140px]">{d.name}</div>
                                         <div className="flex justify-between items-baseline gap-4">
                                              <span className="text-sm font-black text-tx tabular-nums">{(d.qty || 0).toLocaleString()}</span>
                                              <span className={`text-xs font-bold ${!wf ? 'text-bl' : 'text-vi'}`}>{d.pct.toFixed(1)}%</span>
                                         </div>
                                     </div>
                                 </div>
                             )}
                         </div>
                     ))}
                 </div>
             </div>
         </div>
      )}

      <div className="bg-sf rounded-3xl overflow-hidden shadow-sm border border-bd flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-sm text-left border-collapse table-fixed">
            <thead className="sticky top-0 bg-s2/95 z-20 shadow-sm backdrop-blur-md">
              <tr>
                <Th w={110}><SortHeader label="Código" colKey="id" /></Th>
                <Th><SortHeader label="Descripción" colKey="nm" /></Th>
                <Th w={150}><SortHeader label="Categoría" colKey="cat" /></Th>
                <Th w={150}><SortHeader label="Subcategoría" colKey="sb" /></Th>
                <Th w={80} a="center">
                    <div className="flex items-center justify-center">
                        <SortHeader label="Medida" colKey="unimed" align="center" />
                    </div>
                </Th>
                <Th w={180}><SortHeader label="Bodega" colKey="wh" /></Th>
                <Th w={120} a="right">
                    <div className="flex items-center justify-end">
                        <SortHeader label="Cantidad" colKey="q" align="right" />
                    </div>
                </Th>
                <Th w={100} a="right">
                    <div className="flex items-center justify-end">
                        <SortHeader label="% Vol" colKey="pct" align="right" />
                    </div>
                </Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd">
              {sortedFil.length === 0 ? (
                  <tr>
                      <td colSpan={8} className="p-20 text-center text-t3 opacity-40">
                          <div className="flex flex-col items-center gap-3">
                              <Box size={48} strokeWidth={1} />
                              <span className="text-sm font-medium">No se encontraron items</span>
                          </div>
                      </td>
                  </tr>
              ) : (
                  sortedFil.map((item: any) => {
                    const totalVol = whVolume[item.wh] || 0;
                    const pct = (item.q && totalVol) ? (item.q / totalVol) : 0;
                    
                    return (
                    <tr key={item.id + "-" + item.wh} className="hover:bg-ac/30 transition-colors group h-14">
                      <td className="px-4 py-3 align-middle first:pl-6">
                          <span className="font-mono font-bold text-bl text-xs bg-bl/10 px-2 py-1 rounded-lg border border-bl/10">
                            {item.id}
                          </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                          <div className="font-bold text-tx text-xs leading-snug truncate" title={item.nm}>{item.nm}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                          <div className="text-[11px] font-bold text-t2 uppercase tracking-wide truncate" title={item.cat}>{item.cat || "-"}</div>
                      </td>
                      <td className="px-4 py-3 align-middle">
                          <div className="text-[11px] font-medium text-t3 truncate" title={item.sb}>{item.sb || "-"}</div>
                      </td>
                      <td className="px-4 py-3 align-middle text-center">
                          <span className="text-[10px] font-black text-t3 bg-s2 px-1.5 py-0.5 rounded border border-bd/60 uppercase">
                              {item.unimed || "UND"}
                          </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                          <div className="text-xs font-semibold text-t2 truncate flex items-center gap-1.5" title={item.wh}>
                              <span className="w-1.5 h-1.5 rounded-full bg-t3/50 shrink-0"></span>
                              <span className="truncate">{item.wh}</span>
                          </div>
                      </td>
                      <td className="px-4 py-3 text-right align-middle">
                          <span className="text-sm font-bold text-tx tabular-nums bg-s2/50 px-2 py-1 rounded-lg">
                              <EC value={item.q} num onSave={v => up(item, "q", Math.round(v))} />
                          </span>
                      </td>
                      <td className="px-4 py-3 text-right align-middle last:pr-6">
                         {pct ? (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded tabular-nums" 
                                  style={{ color: 'var(--bl)', backgroundColor: 'var(--bl)15' }}>
                                {(pct * 100).toFixed(4)}%
                            </span>
                         ) : <span className="text-t3 text-[10px] italic">-</span>}
                      </td>
                    </tr>
                  )})
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- MOVEMENTS MODAL (Unified In/Out) --- */}
      {moveModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all">
              {/* Backdrop */}
              <div 
                className="absolute inset-0 bg-bg/80 backdrop-blur-sm transition-opacity" 
                onClick={() => setMoveModalOpen(false)}
              />
              
              {/* Modal Panel */}
              <div className={`bg-sf border border-bd shadow-2xl flex flex-col animate-fade-in-up overflow-hidden transition-all duration-300 ${
                  moveModalFullscreen 
                    ? 'w-full h-full rounded-2xl' 
                    : 'w-full max-h-[78vh] md:w-[60%] rounded-3xl'
              }`}>
                  
                  {/* Header */}
                  <div className="p-4 border-b border-bd/60 bg-sf z-10 flex flex-col gap-3 shrink-0">
                      <div className="flex justify-between items-start">
                         <div>
                            <h2 className="text-xl font-black text-tx tracking-tight flex items-center gap-2">
                               <ArrowRightLeft className={moveType === 'IN' ? 'text-gn' : 'text-rd'} strokeWidth={3} size={20} />
                               Registrar {moveType === 'IN' ? 'Entrada' : 'Salida'} de Inventario
                            </h2>
                            <div className="flex items-center gap-3 mt-2 text-xs font-medium text-t2">
                               <span className="bg-s2 px-2 py-1 rounded-md border border-bd/60 font-mono text-t3">
                                   ID: {(moveType === 'IN' ? 'IN-' : 'OUT-') + new Date().toISOString().split('T')[0].replace(/-/g,'')}
                               </span>
                               <span className="w-1 h-1 rounded-full bg-t3/50"></span>
                               <span>{moveRows.length} items en lista</span>
                            </div>
                         </div>

                         {/* Action Buttons in Header */}
                         <div className="flex items-center gap-2">
                             <button 
                                onClick={() => setMoveModalFullscreen(!moveModalFullscreen)}
                                className="p-2 hover:bg-hv rounded-xl text-t3 hover:text-tx transition-colors"
                                title={moveModalFullscreen ? "Restaurar" : "Expandir"}
                             >
                                {moveModalFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                             </button>
                             <button 
                                onClick={() => setMoveModalOpen(false)}
                                className="p-2 hover:bg-hv rounded-xl text-t3 hover:text-tx transition-colors"
                             >
                                <X size={20} />
                             </button>
                         </div>
                      </div>

                      <div className="flex gap-4 items-start">
                           {/* Movement Type Toggle */}
                           <div className="flex bg-s2 p-1 rounded-xl border border-bd/60 h-11 shrink-0">
                                <button 
                                    onClick={() => setMoveType('IN')} 
                                    disabled={moveType === 'OUT' && (moveRows.length > 1 || moveRows.some(r => r.code || r.q))}
                                    className={`px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                        moveType === 'IN' 
                                            ? 'bg-sf shadow text-gn' 
                                            : (moveType === 'OUT' && (moveRows.length > 1 || moveRows.some(r => r.code || r.q)) ? 'opacity-30 cursor-not-allowed text-t3' : 'text-t3 hover:text-tx')
                                    }`}
                                >
                                    <ArrowDown size={14} strokeWidth={3} /> Entrada
                                </button>
                                <button 
                                    onClick={() => setMoveType('OUT')} 
                                    disabled={moveType === 'IN' && (moveRows.length > 1 || moveRows.some(r => r.code || r.q))}
                                    className={`px-4 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                                        moveType === 'OUT' 
                                            ? 'bg-sf shadow text-rd' 
                                            : (moveType === 'IN' && (moveRows.length > 1 || moveRows.some(r => r.code || r.q)) ? 'opacity-30 cursor-not-allowed text-t3' : 'text-t3 hover:text-tx')
                                    }`}
                                >
                                    <ArrowUp size={14} strokeWidth={3} /> Salida
                                </button>
                           </div>

                          {/* Global Warehouse Selector */}
                          <div className="flex-1 flex flex-col">
                              <div className="bg-s2/50 p-1.5 pr-4 rounded-xl border border-bd/60 flex items-center gap-3 h-11 w-full">
                                  <div className="bg-bl/10 w-8 h-8 flex items-center justify-center rounded-lg text-bl"><Warehouse size={16} /></div>
                                  <div className="flex-1">
                                       <select 
                                           value={moveWh} 
                                           onChange={(e) => setMoveWh(e.target.value)}
                                           className="w-full bg-transparent font-bold text-tx text-xs outline-none cursor-pointer p-0 border-none focus:ring-0"
                                       >
                                           <option value="">Seleccionar Bodega...</option>
                                           {whs.map(w => <option key={w} value={w}>{w}</option>)}
                                       </select>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  {/* Body Wrapper */}
                  <div className="flex flex-1 min-h-0 overflow-hidden">
                      {/* Left: Operational Table */}
                      <div className="flex-1 flex flex-col overflow-hidden relative border-r border-bd/60">
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-0 bg-s2/20">
                              <table className="w-full text-sm text-left border-collapse">
                                  <thead className="sticky top-0 bg-sf z-10 shadow-sm text-[10px] font-black uppercase tracking-widest text-t3">
                                      <tr>
                                          <th className="px-4 py-2 border-b border-bd/60 w-32">Código</th>
                                          <th className="px-4 py-2 border-b border-bd/60 text-left">Descripción</th>
                                          <th className="px-4 py-2 border-b border-bd/60 w-24 text-left">Medida</th>
                                          <th className="px-4 py-2 border-b border-bd/60 w-28 text-center">Stock Actual</th>
                                          {moveType === 'IN' && <th className="px-4 py-2 border-b border-bd/60 w-28 text-right">Costo Unit.</th>}
                                          <th className="px-4 py-2 border-b border-bd/60 w-28 text-left relative">
                                              <div className="flex items-center justify-between">
                                                  <span>Cantidad</span>
                                                  <button
                                                      onClick={handleClearQuantities}
                                                      disabled={!moveWh || !moveRows.some(r => r.q)}
                                                      className="p-1 text-t3/60 hover:text-tx hover:bg-bd/50 rounded-md transition-all disabled:opacity-0"
                                                      title="Limpiar todas las cantidades"
                                                  >
                                                      <Eraser size={14} />
                                                  </button>
                                              </div>
                                              {clearFeedback && (
                                                  <div className="absolute -top-1 right-0 transform -translate-y-full bg-tx text-bg text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-fade-in-up z-20">
                                                      Cantidades limpiadas
                                                  </div>
                                              )}
                                          </th>
                                          <th className="px-4 py-2 border-b border-bd/60 w-28 text-center">Stock Final</th>
                                          <th className="px-4 py-2 border-b border-bd/60 w-24"></th>
                                      </tr>
                                  </thead>
                                  <tbody className="divide-y divide-bd/40 bg-sf">
                                      {moveRows.map((row, index) => {
                                          const stockItem = findInventoryItem(String(row.code), moveWh);
                                          // Find the item in master list to get UoM even if not in stock
                                          let masterItem = findInventoryItem(String(row.code));
                                          if (!masterItem) {
                                            const m = getProductByCode(row.code);
                                            if (m) masterItem = { ...m, unimed: m.size } as any;
                                          }
                                          
                                          const currentStock = stockItem ? stockItem.q : 0;
                                          const qtyChange = Number(row.q) || 0;
                                          const finalStock = moveType === 'IN' ? currentStock + qtyChange : currentStock - qtyChange;
                                          // Check if code exists in either inventory OR master data
                                          const productKnown = isKnownProductCode(String(row.code));
                                          const isCodeError = moveWh && !productKnown;
                                          const isStockError = moveWh && moveType === 'OUT' && (qtyChange > currentStock);
                                          const isFocused = index === focusIdx;

                                          return (
                                          <tr key={row.id} className={`transition-colors ${isFocused ? 'bg-bl/5' : 'hover:bg-s2/50'}`}>
                                              <td className="px-4 py-2 align-top">
                                                  <div className="relative">
                                                      <input 
                                                          disabled={!moveWh}
                                                          value={row.code}
                                                          onFocus={() => setFocusIdx(index)}
                                                          onChange={(e) => handleMoveRowChange(row.id, 'code', e.target.value)}
                                                          placeholder="E-Code"
                                                          className={`w-full bg-s2/50 border rounded-lg px-3 py-2 text-xs font-mono font-bold text-tx outline-none transition-all placeholder:text-t3/40 ${isCodeError ? 'border-rd focus:border-rd focus:ring-rd/10' : 'border-bd/60 focus:ring-2 focus:ring-bl/10 focus:border-bl'} disabled:opacity-50 disabled:cursor-not-allowed`}
                                                          autoFocus={index === moveRows.length - 1 && !row.code && !!moveWh}
                                                      />
                                                      {isCodeError && (
                                                          <div className="absolute top-1/2 -translate-y-1/2 right-2 text-rd" title="Código no encontrado en Inventario Maestro">
                                                              <AlertCircle size={14} />
                                                          </div>
                                                      )}
                                                  </div>
                                              </td>
                                              <td className="px-4 py-2 align-top">
                                                  <div className={`w-full px-3 py-2 rounded-lg text-xs font-medium border border-transparent min-h-[34px] flex items-center ${row.desc ? 'text-tx bg-ac/20' : 'text-t3/40 bg-s2/30 italic'}`}>
                                                      {row.desc || "Descripción automática..."}
                                                  </div>
                                              </td>
                                              <td className="px-4 py-2 align-top text-center">
                                                  <div className="py-2 text-xs font-bold text-t2 uppercase">
                                                      {masterItem?.unimed || "-"}
                                                  </div>
                                              </td>
                                              <td className="px-4 py-2 align-top text-center">
                                                  <div className={`py-2 text-xs font-mono font-black ${moveWh && row.code ? (currentStock === 0 ? 'text-rd' : 'text-bl') : 'text-t3/30'}`}>
                                                      {moveWh ? (row.code ? (currentStock === 0 ? "NO STOCK" : (currentStock || 0).toLocaleString()) : "-") : "..."}
                                                  </div>
                                              </td>
                                              {moveType === 'IN' && (
                                                <td className="px-4 py-2 align-top text-right">
                                                    <div className="relative">
                                                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 text-xs">$</span>
                                                      <input 
                                                          disabled={!moveWh}
                                                          type="number"
                                                          value={row.cost}
                                                          onChange={(e) => handleMoveRowChange(row.id, 'cost', e.target.value)}
                                                          placeholder="0.00"
                                                          className="w-full bg-s2/50 border border-bd/60 rounded-lg pl-6 pr-3 py-2 text-xs font-mono font-bold text-tx text-right outline-none focus:ring-2 focus:ring-bl/10 focus:border-bl transition-all disabled:opacity-50"
                                                      />
                                                    </div>
                                                </td>
                                              )}
                                              <td className="px-4 py-2 align-top text-right">
                                                  <div className="relative">
                                                      <input 
                                                          disabled={!moveWh}
                                                          type="number"
                                                          value={row.q}
                                                          onFocus={() => setFocusIdx(index)}
                                                          onChange={(e) => handleMoveRowChange(row.id, 'q', e.target.value)}
                                                          placeholder="0"
                                                          className={`w-full bg-s2/50 border rounded-lg px-3 py-2 text-xs font-mono font-bold text-tx text-right outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${isStockError ? 'border-rd focus:border-rd focus:ring-rd/10' : 'border-bd/60 focus:ring-2 focus:ring-bl/10 focus:border-bl'}`}
                                                      />
                                                  </div>
                                              </td>
                                              <td className="px-4 py-2 align-top text-center">
                                                   <div className={`py-2 text-xs font-mono font-black flex justify-center items-center gap-1 ${isStockError ? 'text-rd' : (moveWh ? 'text-tx' : 'text-t3/30')}`}>
                                                      {moveWh ? (finalStock || 0).toLocaleString() : '...'}
                                                  </div>
                                              </td>
                                              <td className="px-4 py-2 align-top text-center">
                                                   <div className="flex items-center justify-center gap-1">
                                                       <button 
                                                          onClick={() => handleResetMoveRow(row.id)}
                                                          disabled={!moveWh || (!row.code && !row.q)}
                                                          className="p-2 text-t3 hover:text-bl hover:bg-bl/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                          title="Limpiar fila"
                                                          tabIndex={-1}
                                                       >
                                                          <RotateCcw size={14} />
                                                       </button>
                                                       <button 
                                                          disabled={!moveWh || moveRows.length === 1}
                                                          onClick={() => handleRemoveMoveRow(row.id)}
                                                          className="p-2 text-t3 hover:text-rd hover:bg-rd/10 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                                          tabIndex={-1}
                                                          title="Eliminar fila"
                                                       >
                                                          <Trash2 size={16} />
                                                       </button>
                                                   </div>
                                              </td>
                                          </tr>
                                      )})}
                                  </tbody>
                              </table>
                              
                              <div className="p-4">
                                <button 
                                    disabled={!moveWh}
                                    onClick={handleAddMoveRow} 
                                    className="w-full py-3 rounded-xl border-2 border-dashed border-bd text-t3 hover:text-bl hover:border-bl/30 hover:bg-bl/5 transition-all text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-bd disabled:hover:bg-transparent disabled:hover:text-t3"
                                >
                                    <Plus size={16} className="group-hover:scale-110 transition-transform" /> 
                                    Agregar Fila
                                </button>
                              </div>
                          </div>
                      </div>

                      {/* Right: Info Panel (Fullscreen Only) */}
                      {moveModalFullscreen && (
                          <div className="w-[380px] bg-s2/30 flex flex-col overflow-y-auto animate-fade-in shrink-0">
                              {(() => {
                                  const currentRow = moveRows[focusIdx];
                                  const activeCode = currentRow?.code;
                                  const activeQty = Number(currentRow?.q) || 0;
                                  const activeCost = Number(currentRow?.cost) || 0;
                                  
                                  // Try to find master item data
                                  let masterItem = findInventoryItem(String(activeCode));
                                  if (!masterItem) {
                                      const m = getProductByCode(activeCode);
                                      if (m) masterItem = { ...m, unimed: m.size } as any;
                                  }

                                  // Specific stock for selected warehouse
                                  const stockItem = findInventoryItem(String(activeCode), moveWh);
                                  const currentStock = stockItem ? stockItem.q : 0;
                                  
                                  // Calculate Impact
                                  const resultingStock = moveType === 'IN' 
                                      ? currentStock + activeQty 
                                      : currentStock - activeQty;

                                  const totalValue = moveType === 'IN' ? activeQty * activeCost : 0;
                                  
                                  if (!activeCode || !masterItem) {
                                      return (
                                          <div className="flex-1 flex flex-col items-center justify-center text-t3 p-8 text-center opacity-60">
                                              <Box size={48} strokeWidth={1} className="mb-4" />
                                              <p className="text-sm font-bold">Seleccione un producto</p>
                                              <p className="text-xs mt-2">Haga click en una fila para ver los detalles del item.</p>
                                          </div>
                                      );
                                  }

                                  return (
                                      <div className="p-8 space-y-8">
                                          <div>
                                              <div className="text-[10px] font-black text-bl uppercase tracking-widest mb-2 bg-bl/10 inline-block px-2 py-1 rounded">
                                                  Ficha Técnica
                                              </div>
                                              <h3 className="text-2xl font-black text-tx leading-tight mb-2">
                                                  {masterItem.nm}
                                              </h3>
                                              <div className="flex items-center gap-2 font-mono text-sm text-t2 font-bold">
                                                  <Hash size={14} /> {masterItem.id}
                                              </div>
                                          </div>

                                          <div className="grid grid-cols-2 gap-4">
                                              <div className="bg-sf p-4 rounded-2xl border border-bd shadow-sm">
                                                  <div className="text-[9px] font-bold text-t3 uppercase tracking-wider mb-1">Categoría</div>
                                                  <div className="text-xs font-bold text-tx truncate" title={masterItem.cat}>{masterItem.cat || "—"}</div>
                                              </div>
                                              <div className="bg-sf p-4 rounded-2xl border border-bd shadow-sm">
                                                  <div className="text-[9px] font-bold text-t3 uppercase tracking-wider mb-1">Subcategoría</div>
                                                  <div className="text-xs font-bold text-tx truncate" title={masterItem.sb}>{masterItem.sb || "—"}</div>
                                              </div>
                                          </div>

                                          <div className="bg-sf p-5 rounded-2xl border border-bd shadow-sm relative overflow-hidden group">
                                              <div className="absolute top-0 right-0 p-4 opacity-10">
                                                  <Warehouse size={64} className="text-bl" />
                                              </div>
                                              <div className="relative z-10">
                                                  <div className="flex items-center gap-2 mb-3">
                                                      <span className="w-2 h-2 rounded-full bg-gn shadow-[0_0_8px_var(--gn)]"></span>
                                                      <span className="text-xs font-bold text-t2 uppercase tracking-wide">Stock en {moveWh || "Bodega"}</span>
                                                  </div>
                                                  <div className="text-4xl font-black text-tx tabular-nums tracking-tight">
                                                      {stockItem ? (stockItem.q || 0).toLocaleString() : "0"}
                                                  </div>
                                                  <div className="mt-2 text-xs font-medium text-t3 flex gap-1">
                                                      Unidad: <span className="text-tx font-bold uppercase">{masterItem.unimed || "UND"}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          {/* Impact Analysis Section */}
                                          {(activeQty > 0 || (moveType === 'IN' && activeCost > 0)) && (
                                              <div className="bg-sf border border-bd rounded-2xl p-5 shadow-sm animate-fade-in">
                                                  <div className="text-[10px] font-bold text-t3 uppercase tracking-wider mb-4 flex items-center gap-2">
                                                      <Activity size={12} /> Impacto de Movimiento
                                                  </div>
                                                  <div className="flex items-center justify-between mb-4">
                                                      <div className="text-center">
                                                          <div className="text-xs text-t3 font-medium mb-1">Actual</div>
                                                          <div className="text-lg font-bold text-tx">{(currentStock || 0).toLocaleString()}</div>
                                                      </div>
                                                      <div className="flex flex-col items-center px-4">
                                                          <span className={`text-xs font-bold ${moveType === 'IN' ? 'text-gn' : 'text-rd'}`}>
                                                              {moveType === 'IN' ? '+' : '-'}{activeQty.toLocaleString()}
                                                          </span>
                                                          <ArrowRight size={14} className="text-t3 mt-1" />
                                                      </div>
                                                      <div className="text-center">
                                                          <div className="text-xs text-t3 font-medium mb-1">Final</div>
                                                          <div className={`text-lg font-black ${resultingStock < 0 ? 'text-rd' : 'text-bl'}`}>
                                                              {(resultingStock || 0).toLocaleString()}
                                                          </div>
                                                      </div>
                                                  </div>
                                                  {moveType === 'IN' && activeCost > 0 && (
                                                      <div className="pt-4 border-t border-bd/60 flex justify-between items-center">
                                                          <span className="text-xs font-bold text-t2">Valor Total Entrada</span>
                                                          <span className="text-sm font-black text-gn tabular-nums">${totalValue.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
                                                      </div>
                                                  )}
                                              </div>
                                          )}
                                          
                                          <div className="p-4 rounded-xl bg-am/5 border border-am/10 flex gap-3 items-start">
                                              <Info size={16} className="text-am shrink-0 mt-0.5" />
                                              <div className="text-xs text-t2 leading-relaxed">
                                                  <span className="font-bold text-tx block mb-0.5">Control de Inventario</span>
                                                  Verifique físicamente el stock antes de realizar movimientos grandes de salida.
                                              </div>
                                          </div>
                                      </div>
                                  );
                              })()}
                          </div>
                      )}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-bd bg-sf shrink-0 flex justify-end gap-3 z-10 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.05)]">
                      <Btn variant="ghost" onClick={() => setMoveModalOpen(false)}>Cancelar</Btn>
                      <button 
                          disabled={!moveWh}
                          onClick={handleConfirmMovementClick}
                          className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none ${moveType === 'IN' ? 'bg-gn shadow-gn/20 hover:bg-gn/90' : 'bg-rd shadow-rd/20 hover:bg-rd/90'}`}
                      >
                          {moveType === 'IN' ? <ArrowDown size={18} strokeWidth={3} /> : <ArrowUp size={18} strokeWidth={3} />}
                          Confirmar {moveType === 'IN' ? 'Entrada' : 'Salida'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* Confirmation Modal */}
      <Modal 
          isOpen={confirmOpen} 
          onClose={() => setConfirmOpen(false)} 
          title="Confirmar Movimiento" 
          onSave={handleExecuteMovement}
          saveLabel="Confirmar"
      >
          <div className="space-y-4">
              <div className="flex items-center gap-3 text-am bg-am/10 p-4 rounded-xl border border-am/20">
                  <AlertTriangle size={24} />
                  <div className="text-sm">
                      <p className="font-bold">¿Está seguro de realizar este movimiento?</p>
                      <p className="text-xs opacity-90 mt-0.5">Esta acción afectará el inventario en tiempo real.</p>
                  </div>
              </div>
              <div className="bg-s2 p-4 rounded-xl border border-bd/60 text-sm space-y-2">
                  <div className="flex justify-between">
                      <span className="text-t3 font-medium">Tipo:</span>
                      <span className={`font-bold ${moveType === 'IN' ? 'text-gn' : 'text-rd'}`}>
                          {moveType === 'IN' ? 'ENTRADA DE STOCK' : 'SALIDA DE STOCK'}
                      </span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-t3 font-medium">Bodega:</span>
                      <span className="font-bold text-tx">{moveWh}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-t3 font-medium">Items:</span>
                      <span className="font-bold text-tx">{moveRows.filter(r => r.code && Number(r.q) > 0).length} líneas</span>
                  </div>
              </div>
          </div>
      </Modal>

      {/* Success Animation Toast (Professional - Centered - Light) */}
      {successAnim && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center pointer-events-none">
             <div className="bg-white border border-gray-100 px-12 py-10 rounded-[32px] shadow-[0_20px_60px_-10px_rgba(0,0,0,0.15)] flex flex-col items-center gap-5 animate-fade-in-up pointer-events-auto transform transition-all">
                <div className="w-20 h-20 rounded-full bg-green-50 text-green-500 flex items-center justify-center shrink-0">
                   <Check size={40} strokeWidth={4} />
                </div>
                <div className="text-center">
                   <h4 className="font-black text-2xl text-gray-900 mb-2 tracking-tight">¡Listo!</h4>
                   <p className="text-sm font-semibold text-gray-400">Movimiento registrado correctamente.</p>
                </div>
             </div>
          </div>
      )}
    </div>
  );
}
