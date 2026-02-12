
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { OrderItem, PurchaseRequest, RequestItem, InventoryItem, HistoryItem, SupplierItem, PriceItem, DeliverySplit, MasterProduct } from '../types';
import { csv, parseCSV } from '../utils/helpers';
import { getProductByCode, getSuppliersByCode, getPriceBySupplier, PRODUCT_MASTER } from '../utils/data';
import { SI, FS, XB, Th, St, Btn, Modal, Inp, IB, EC } from './shared/UI';
import { Plus, ShoppingCart, Calendar, CheckCircle2, Trash2, Search, Link as LinkIcon, Send, Save, Copy, Warehouse, Mail, ArrowLeft, AlertCircle, TrendingUp, TrendingDown, Target, FileText, Lock, Filter, X, Check, Globe, FileSpreadsheet, PenTool, Upload, Package, Layers, ChevronDown, Sparkles, RefreshCw, Clock, Hash, Zap, ToggleLeft, ToggleRight, Box, History, Activity, List, Clipboard, ArrowRight, Grid, Tag, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

/* --- HELPER COMPONENTS --- */

const DateInput = ({ value, onChange, placeholder, className }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);
    const [viewDate, setViewDate] = useState(() => value ? new Date(value + 'T12:00:00') : new Date());
    const [coords, setCoords] = useState({ top: 0, left: 0 });

    useEffect(() => {
        if (isOpen && wrapperRef.current) {
            const updatePosition = () => {
                if (wrapperRef.current) {
                    const rect = wrapperRef.current.getBoundingClientRect();
                    setCoords({
                        top: rect.bottom + window.scrollY + 4,
                        left: rect.left + window.scrollX
                    });
                }
            };
            updatePosition();
            window.addEventListener('scroll', updatePosition, true);
            window.addEventListener('resize', updatePosition);
            return () => {
                window.removeEventListener('scroll', updatePosition, true);
                window.removeEventListener('resize', updatePosition);
            };
        }
    }, [isOpen]);

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (
                wrapperRef.current && 
                !wrapperRef.current.contains(event.target) && 
                portalRef.current && 
                !portalRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        if (isOpen) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
             setViewDate(value ? new Date(value + 'T12:00:00') : new Date());
        }
    }, [isOpen, value]);

    const handleSelect = (d: number) => {
        const newDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), d);
        const y = newDate.getFullYear();
        const m = String(newDate.getMonth() + 1).padStart(2, '0');
        const day = String(newDate.getDate()).padStart(2, '0');
        onChange(`${y}-${m}-${day}`);
        setIsOpen(false);
    };

    const changeMonth = (offset: number) => {
        setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + offset, 1));
    };

    const formatDisplay = (d: string) => {
        if (!d) return "";
        try { return new Date(d + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }); } 
        catch { return d; }
    };
    
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay(); 
    
    const days = [];
    for(let i=0; i<startDay; i++) days.push(<div key={`e-${i}`} />);
    for(let i=1; i<=daysInMonth; i++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`;
        const isSel = value === dateStr;
        days.push(
            <button 
                key={i}
                onClick={(e) => { e.stopPropagation(); handleSelect(i); }}
                className={`w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${isSel ? 'bg-bl text-white shadow-sm' : 'hover:bg-bl/10 hover:text-bl text-tx'}`}
            >
                {i}
            </button>
        );
    }
    
    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

    return (
        <div className={`relative flex-1 ${className || ''}`} ref={wrapperRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center gap-2 px-3 py-2 bg-s2/40 border border-transparent rounded-xl transition-all h-[36px] cursor-pointer select-none group hover:bg-s2 hover:border-bd/50 ${isOpen ? 'ring-2 ring-bl/10 bg-sf' : ''}`}
            >
                <Calendar size={14} className={value ? "text-bl" : "text-t3"} />
                <span className={`text-[13px] font-medium truncate ${value ? "text-tx" : "text-t3"}`}>
                    {value ? formatDisplay(value) : placeholder || "Fecha"}
                </span>
            </div>
            {isOpen && createPortal(
                <div 
                    ref={portalRef}
                    style={{
                        position: 'absolute',
                        top: coords.top,
                        left: coords.left,
                        zIndex: 9999
                    }}
                    className="p-4 bg-sf border border-bd rounded-2xl shadow-2xl w-64 animate-fade-in" 
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-4">
                         <button onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-1 hover:bg-s2 rounded text-t3 hover:text-tx"><ChevronDown size={16} className="rotate-90" /></button>
                         <span className="text-sm font-bold text-tx">{monthNames[month]} {year}</span>
                         <button onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-1 hover:bg-s2 rounded text-t3 hover:text-tx"><ChevronDown size={16} className="-rotate-90" /></button>
                    </div>
                    <div className="grid grid-cols-7 text-center mb-2">
                        {['D','L','M','M','J','V','S'].map(d => <span key={d} className="text-[10px] font-bold text-t3">{d}</span>)}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {days}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

// Helper to format title
const getReqTitle = (dateStr: string) => {
    try {
        const d = new Date(dateStr + 'T12:00:00');
        const month = d.toLocaleDateString('es-ES', { month: 'long' });
        const year = d.getFullYear();
        return `${month.charAt(0).toUpperCase() + month.slice(1)} ${year}`;
    } catch {
        return dateStr;
    }
};

const SupplierAutocomplete = ({ value, onChange, itemCode }: { value: string, onChange: (v: string) => void, itemCode: string }) => {
    const [show, setShow] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Suppliers that have a price for this item
    const linked = useMemo(() => getSuppliersByCode(itemCode), [itemCode]);
    
    const suggestions = useMemo(() => {
        const v = (value || "").toLowerCase();
        return linked.filter(s => s.toLowerCase().includes(v)).slice(0, 8);
    }, [value, linked]);

    useEffect(() => {
        const out = (e: any) => { if(ref.current && !ref.current.contains(e.target)) setShow(false); };
        document.addEventListener("mousedown", out);
        return () => document.removeEventListener("mousedown", out);
    }, []);

    // Estimate rows for textarea based on char count to allow wrapping
    const rows = Math.max(1, Math.ceil((value || "").length / 28));

    return (
        <div className="relative w-full" ref={ref}>
            <textarea 
                value={value} 
                onChange={e => { onChange(e.target.value); setShow(true); }}
                onFocus={() => setShow(true)}
                rows={rows}
                className="w-full px-3 py-2 bg-transparent border border-transparent hover:bg-s2/50 rounded-xl text-[13px] font-medium text-tx outline-none focus:bg-sf focus:ring-2 focus:ring-bl/10 transition-all placeholder:text-t3/40 resize-none overflow-hidden leading-snug whitespace-normal"
                placeholder="Seleccionar..." 
                style={{ height: 'auto', minHeight: '34px' }}
            />
            {show && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-sf border border-bd rounded-xl shadow-lg z-50 overflow-hidden max-h-48 overflow-y-auto custom-scrollbar">
                    {suggestions.map(s => (
                        <div key={s} onClick={() => { onChange(s); setShow(false); }} className="px-4 py-2.5 text-xs font-bold text-tx hover:bg-hv cursor-pointer flex justify-between items-center border-b border-bd/30 last:border-0 h-auto">
                            <span className="whitespace-normal leading-tight">{s}</span>
                            <span className="text-[10px] text-gn bg-gn/10 px-1.5 py-0.5 rounded border border-gn/20 ml-2 shrink-0">★</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

/* --- PRODUCT CATALOG MODAL --- */
const ProductCatalogModal = ({ isOpen, onClose, onAdd }: any) => {
    const [search, setSearch] = useState("");
    const [catFilter, setCatFilter] = useState("TODOS");
    const [selection, setSelection] = useState<Map<string, { qty: string, date: string, data: MasterProduct }>>(new Map());
    const [bulkDate, setBulkDate] = useState(new Date().toISOString().split('T')[0]);
    const [bulkQty, setBulkQty] = useState("");

    // Use PRODUCT_MASTER from data.ts
    const categories = useMemo(() => {
        const cats = new Set(PRODUCT_MASTER.map(p => p.cat).filter(Boolean));
        return ["TODOS", ...Array.from(cats).sort() as string[]];
    }, []);

    const filtered = useMemo(() => {
        return PRODUCT_MASTER.filter(p => {
            const matchSearch = !search || p.nm.toLowerCase().includes(search.toLowerCase()) || String(p.id).includes(search);
            const matchCat = catFilter === "TODOS" || p.cat === catFilter;
            return matchSearch && matchCat;
        }).slice(0, 100); // Limit rendered items for performance
    }, [search, catFilter]);

    useEffect(() => {
        if (isOpen) {
            setSelection(new Map());
            setSearch("");
            setCatFilter("TODOS");
            setBulkQty("");
            setBulkDate(new Date().toISOString().split('T')[0]);
        }
    }, [isOpen]);

    const toggleSelect = (product: MasterProduct) => {
        const newMap = new Map<string, { qty: string, date: string, data: MasterProduct }>(selection);
        if (newMap.has(product.id)) {
            newMap.delete(product.id);
        } else {
            newMap.set(product.id, { qty: bulkQty, date: bulkDate, data: product });
        }
        setSelection(newMap);
    };

    const updateSelectionItem = (id: string, field: 'qty' | 'date', value: string) => {
        const newMap = new Map<string, { qty: string, date: string, data: MasterProduct }>(selection);
        const item = newMap.get(id);
        if (item) {
            newMap.set(id, { ...item, [field]: value });
            setSelection(newMap);
        }
    };

    const applyBulkToSelection = () => {
        if (!bulkQty && !bulkDate) return;
        const newMap = new Map<string, { qty: string, date: string, data: MasterProduct }>(selection);
        for (const [key, val] of newMap.entries()) {
             newMap.set(key, { 
                ...val, 
                qty: bulkQty || val.qty, 
                date: bulkDate || val.date 
            });
        }
        setSelection(newMap);
    };

    const handleAddSelected = () => {
        const requestItems = Array.from(selection.values()).map((item: { qty: string, date: string, data: MasterProduct }) => ({
            id: Math.random().toString(36).substr(2, 9),
            code: item.data.id,
            desc: item.data.nm,
            cat: item.data.cat,
            sub: item.data.sb,
            size: item.data.size,
            totalQty: parseInt(item.qty) || 0,
            splits: [{
                id: Math.random().toString(36).substr(2, 9),
                date: item.date,
                qty: parseInt(item.qty) || 0
            }]
        }));
        
        onAdd(requestItems);
        onClose();
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-sf border border-bd rounded-3xl shadow-2xl w-full max-w-6xl h-[85vh] overflow-hidden animate-fade-in-up flex flex-col md:flex-row">
                {/* LEFT COLUMN: CATALOG */}
                <div className="w-full md:w-1/2 flex flex-col border-r border-bd bg-sf">
                    <div className="p-6 border-b border-bd">
                        <h3 className="text-lg font-black text-tx tracking-tight flex items-center gap-2 mb-1"><Grid size={20} className="text-bl" /> Catálogo Maestro</h3>
                        <p className="text-xs text-t3 font-medium mb-4">Solo productos autorizados</p>
                        <div className="relative mb-3">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-t3 w-4 h-4" />
                            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por código o nombre..." className="w-full py-3 pl-11 pr-4 rounded-2xl bg-s2 border border-bd text-tx text-sm outline-none font-bold focus:bg-sf focus:ring-2 focus:ring-bl/20 transition-all shadow-sm" autoFocus />
                        </div>
                        <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
                            {categories.map((c) => (
                                <button key={c} onClick={() => setCatFilter(c)} className={`px-4 py-2 rounded-xl text-[10px] font-bold whitespace-nowrap transition-all border ${catFilter === c ? 'bg-bl text-white border-bl shadow-md shadow-bl/20' : 'bg-sf text-t3 border-bd hover:border-bl/30 hover:text-tx'}`}>{c}</button>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-s2/30">
                        {filtered.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40"><Box size={40} className="mb-2 text-t3" /><p className="text-xs font-bold text-t3">Sin resultados en Maestro</p></div>
                        ) : (
                            <div className="grid grid-cols-2 gap-3">
                                {filtered.map((p) => {
                                    const isSel = selection.has(p.id);
                                    return (
                                        <div key={p.id} onClick={() => toggleSelect(p)} className={`relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 group hover:-translate-y-0.5 hover:shadow-md ${isSel ? 'bg-sf border-bl ring-1 ring-bl/10 shadow-sm' : 'bg-sf border-bd hover:border-bl/40'}`}>
                                            <div className="flex justify-between items-start mb-2">
                                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${isSel ? 'bg-bl text-white border-bl' : 'bg-s2 text-t3 border-bd'}`}>{p.id}</span>
                                                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${isSel ? 'bg-bl border-bl text-white' : 'border-bd group-hover:border-bl'}`}>{isSel && <Check size={12} strokeWidth={4} />}</div>
                                            </div>
                                            <div className="h-10 line-clamp-2 text-xs font-bold text-tx leading-tight mb-1">{p.nm}</div>
                                            <div className="text-[10px] text-t3 truncate">{p.cat || "—"} • {p.size || "—"}</div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* RIGHT COLUMN: SELECTION & CONFIG */}
                <div className="w-full md:w-1/2 flex flex-col bg-sf h-full">
                    <div className="p-6 border-b border-bd bg-sf z-10 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <div><h3 className="text-lg font-black text-tx tracking-tight">Selección</h3><p className="text-xs text-t3 font-medium">{selection.size} productos agregados</p></div>
                            <button onClick={onClose} className="p-2 hover:bg-hv rounded-xl text-t3 transition-colors md:hidden"><X size={20} /></button>
                        </div>
                        <div className="bg-bl/5 border border-bl/10 rounded-2xl p-4">
                            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-bl uppercase tracking-wider"><Layers size={12} /> Aplicación Masiva</div>
                            <div className="flex gap-2">
                                <DateInput value={bulkDate} onChange={setBulkDate} className="flex-1 bg-sf h-[38px] text-xs rounded-xl" placeholder="Fecha" />
                                <input type="number" value={bulkQty} onChange={e => setBulkQty(e.target.value)} className="w-24 px-3 bg-sf border border-bd rounded-xl text-xs font-bold outline-none focus:border-bl h-[38px]" placeholder="Cant" />
                                <button onClick={applyBulkToSelection} disabled={selection.size === 0} className="px-4 bg-bl text-white rounded-xl text-xs font-bold hover:bg-bl/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">Aplicar</button>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 bg-s2/20">
                        {selection.size === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-8"><ShoppingCart size={40} className="mb-2 text-t3" /><p className="text-sm font-bold text-tx">Lista Vacía</p><p className="text-xs text-t3 mt-1">Seleccione productos del catálogo a la izquierda.</p></div>
                        ) : (
                            <div className="space-y-3">
                                {Array.from(selection.values()).map((item: any) => (
                                    <div key={item.data.id} className="bg-sf border border-bd rounded-2xl p-4 shadow-sm hover:border-bl/30 transition-colors flex gap-4 items-center group">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-0.5"><span className="text-[10px] font-black text-bl bg-bl/10 px-1.5 rounded-md">{item.data.id}</span><span className="text-xs font-bold text-tx truncate">{item.data.nm}</span></div>
                                            <div className="text-[10px] text-t3">{item.data.cat || "—"} • {item.data.size || "—"}</div>
                                        </div>
                                        <div className="flex gap-2 items-center">
                                             <div className="w-32"><DateInput value={item.date} onChange={(v: string) => updateSelectionItem(item.data.id, 'date', v)} className="h-[34px] text-[10px]" /></div>
                                             <div className="w-20"><input type="number" value={item.qty} onChange={e => updateSelectionItem(item.data.id, 'qty', e.target.value)} className="w-full px-3 py-1 bg-s2 border border-bd rounded-xl text-xs font-bold text-right outline-none focus:border-bl h-[34px]" placeholder="0" /></div>
                                             <button onClick={() => toggleSelect(item.data)} className="p-2 text-t3 hover:text-rd hover:bg-rd/5 rounded-xl transition-colors"><X size={16} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <div className="p-6 border-t border-bd bg-sf z-20 flex justify-end gap-3 shrink-0">
                        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
                        <Btn variant="primary" onClick={handleAddSelected} disabled={selection.size === 0} icon={Plus}>Agregar {selection.size > 0 ? `(${selection.size})` : ''}</Btn>
                    </div>
                </div>
            </div>
        </div>
    );
};

/* --- BULK PASTE MODAL --- */
const BulkPasteModal = ({ isOpen, onClose, onAdd }: any) => {
    const [text, setText] = useState("");
    const [preview, setPreview] = useState<any[]>([]);

    useEffect(() => {
        if(isOpen) { setText(""); setPreview([]); }
    }, [isOpen]);

    useEffect(() => {
        if(!text.trim()) { setPreview([]); return; }
        
        const lines = text.split('\n');
        const items = lines.map(line => {
            const parts = line.split(/,|\t/); 
            const rawCode = parts[0]?.trim();
            const rawQty = parts.length > 1 ? parseInt(parts[1]?.trim()) : 0;
            
            if(!rawCode) return null;

            const match = getProductByCode(rawCode);

            return {
                original: rawCode,
                qty: isNaN(rawQty) ? 0 : rawQty,
                found: !!match,
                data: match
            };
        }).filter(Boolean);
        
        setPreview(items);
    }, [text]);

    const handleImport = () => {
        const valid = preview.filter(i => i.found);
        if(valid.length === 0) return;
        
        const requestItems = valid.map(p => ({
            id: Math.random().toString(36).substr(2, 9),
            code: p.data.id,
            desc: p.data.nm,
            cat: p.data.cat,
            sub: p.data.sb,
            size: p.data.size,
            totalQty: p.qty > 0 ? p.qty : 0,
            splits: [{
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString().split('T')[0],
                qty: p.qty > 0 ? p.qty : 0
            }]
        }));
        
        onAdd(requestItems);
        onClose();
    };

    if(!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative bg-sf border border-bd rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden animate-fade-in-up flex flex-col max-h-[85vh]">
                <div className="flex items-center justify-between p-6 border-b border-bd bg-sf shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="bg-bl/10 text-bl p-2 rounded-xl"><Clipboard size={20} /></div>
                        <div>
                            <h3 className="text-lg font-black text-tx tracking-tight">Carga Rápida de Productos</h3>
                            <p className="text-xs text-t3 font-medium">Pegue su lista de Excel o texto aquí</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-t3 hover:text-tx transition-colors p-2 hover:bg-hv rounded-xl"><X size={20} /></button>
                </div>
                
                <div className="flex flex-1 overflow-hidden">
                    <div className="w-1/3 border-r border-bd p-6 flex flex-col bg-s2/30">
                        <textarea
                            value={text}
                            onChange={e => setText(e.target.value)}
                            placeholder={`Ejemplo:\n1498\n5506, 100\n6080\n...`}
                            className="flex-1 w-full bg-sf border border-bd rounded-2xl p-4 text-sm font-mono text-tx outline-none focus:border-bl focus:ring-2 focus:ring-bl/5 resize-none shadow-sm"
                            autoFocus
                        />
                        <div className="mt-4 text-[10px] text-t3 bg-sf p-3 rounded-xl border border-bd">
                            <span className="font-bold uppercase block mb-1">Formatos aceptados:</span>
                            • CODIGO<br/>
                            • CODIGO, CANTIDAD<br/>
                            • CODIGO [tab] CANTIDAD
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col bg-sf">
                        <div className="p-4 border-b border-bd bg-s2/20 flex justify-between items-center text-xs font-bold text-t3 uppercase tracking-wider">
                            <span>Vista Previa ({preview.length})</span>
                            <span className="text-gn">{preview.filter(i => i.found).length} Validos</span>
                        </div>
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                            {preview.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-t3/40">
                                    <List size={48} className="mb-2" />
                                    <span className="text-sm font-medium">Esperando datos...</span>
                                </div>
                            ) : (
                                <table className="w-full text-sm text-left">
                                    <thead className="sticky top-0 bg-sf z-10 shadow-sm text-xs text-t3 uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="px-5 py-3 border-b border-bd w-10"></th>
                                            <th className="px-5 py-3 border-b border-bd">Código / Input</th>
                                            <th className="px-5 py-3 border-b border-bd">Producto Detectado</th>
                                            <th className="px-5 py-3 border-b border-bd text-right">Cant.</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-bd/50">
                                        {preview.map((item, idx) => (
                                            <tr key={idx} className={item.found ? "bg-sf" : "bg-rd/5"}>
                                                <td className="px-5 py-3 text-center">
                                                    {item.found ? <CheckCircle2 size={16} className="text-gn" /> : <AlertCircle size={16} className="text-rd" />}
                                                </td>
                                                <td className="px-5 py-3 font-mono text-xs font-bold text-t3">{item.original}</td>
                                                <td className="px-5 py-3">
                                                    {item.found ? (
                                                        <div>
                                                            <div className="font-bold text-tx text-xs">{item.data.nm}</div>
                                                            <div className="text-[10px] text-t3">{item.data.cat || "—"} • {item.data.size || "—"}</div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs font-bold text-rd italic">No encontrado en maestro</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3 text-right font-mono text-xs">
                                                    {item.qty > 0 ? (
                                                        <span className="font-bold text-tx">{item.qty}</span>
                                                    ) : (
                                                        <span className="text-t3 opacity-50">-</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-bd bg-s2/30 flex justify-end gap-3">
                    <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
                    <Btn 
                        variant="primary" 
                        onClick={handleImport} 
                        disabled={preview.filter(i => i.found).length === 0}
                        className={preview.filter(i => i.found).length === 0 ? "opacity-50 cursor-not-allowed" : ""}
                    >
                        Importar {preview.filter(i => i.found).length} Items
                    </Btn>
                </div>
            </div>
        </div>
    );
};

/* --- ITEM CODE CELL --- */
const ItemCodeCell = ({ 
    code, 
    onChange, 
    products 
}: { 
    code: string, 
    onChange: (code: string, master?: MasterProduct) => void, 
    products: MasterProduct[] 
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [search, setSearch] = useState(code);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync local state when prop updates (and not editing)
    useEffect(() => {
        if (!isEditing) setSearch(code);
    }, [code, isEditing]);

    // Filter suggestions
    const suggestions = useMemo(() => {
        if (!isEditing || !search) return [];
        const term = search.toLowerCase();
        return products.filter(p => 
            p.id.toLowerCase().includes(term) || 
            p.nm.toLowerCase().includes(term)
        ).slice(0, 8);
    }, [search, isEditing, products]);

    // Handle outside click to close
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsEditing(false);
                setShowSuggestions(false);
                const match = products.find(p => p.id === search);
                if (match) {
                    onChange(match.id, match);
                } else {
                    setSearch(code); 
                }
            }
        };
        if (isEditing) document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isEditing, code, products, search, onChange]);

    const select = (p: MasterProduct) => {
         onChange(p.id, p);
         setSearch(p.id);
         setIsEditing(false);
         setShowSuggestions(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (suggestions.length > 0) select(suggestions[0]);
            else {
                const match = products.find(p => p.id === search);
                if (match) select(match);
            }
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setSearch(code);
        }
    };

    if (!isEditing && code) {
        return (
            <div 
                className="w-full flex items-center justify-center cursor-pointer group h-10 px-2"
                onClick={() => { setIsEditing(true); setSearch(code); setTimeout(() => inputRef.current?.focus(), 0); }}
            >
                <span className="font-mono font-semibold text-bl text-xs bg-bl/5 hover:bg-bl/10 px-2.5 py-1 rounded-xl transition-colors">
                    {code}
                </span>
            </div>
        );
    }

    return (
        <div className="relative w-full h-10 flex items-center justify-center" ref={containerRef}>
            <input
                ref={inputRef}
                value={search}
                onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="w-full text-center bg-transparent border-none outline-none font-mono font-bold text-bl text-xs focus:bg-sf focus:ring-1 focus:ring-bl/20 rounded-lg px-2 py-1 transition-all placeholder:text-t3/40"
                placeholder="Ingresar..."
            />
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-sf border border-bd rounded-xl shadow-xl z-50 overflow-hidden text-left">
                     <div className="max-h-60 overflow-y-auto custom-scrollbar">
                         {suggestions.map((p) => (
                             <button
                                 key={p.id}
                                 onClick={() => select(p)}
                                 className="w-full text-left px-4 py-2.5 hover:bg-bl/5 border-b border-bd/30 last:border-0 transition-colors flex flex-col gap-0.5"
                             >
                                 <div className="flex justify-between items-center">
                                     <span className="font-bold text-bl text-xs font-mono bg-bl/5 px-1.5 rounded-md">{p.id}</span>
                                     <span className="text-[10px] text-t3 font-medium uppercase tracking-wide">{p.cat}</span>
                                 </div>
                                 <div className="text-xs text-tx font-medium truncate">{p.nm}</div>
                             </button>
                         ))}
                     </div>
                </div>
            )}
        </div>
    );
};

interface Props {
    ord: OrderItem[];
    setOrd: React.Dispatch<React.SetStateAction<OrderItem[]>>;
    reqs: PurchaseRequest[];
    setReqs: React.Dispatch<React.SetStateAction<PurchaseRequest[]>>;
    inv: InventoryItem[];
    whs: string[];
    hist: HistoryItem[];
    sup: SupplierItem[];
    prc: PriceItem[];
    masterProducts: MasterProduct[];
}

export default function PurchaseOrders({ ord, setOrd, reqs, setReqs, inv, whs, hist, sup, prc, masterProducts }: Props) {
  const [tab, setTab] = useState<'requests' | 'orders'>('requests');

  return (
    <div className="animate-fade-in h-full flex flex-col">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 shrink-0">
             <div className="flex items-center gap-6">
                <h1 className="text-2xl font-black text-tx m-0 tracking-tight">Gestión de Compras</h1>
                <div className="flex bg-s2 p-1 rounded-2xl border border-bd">
                    <button onClick={() => setTab('requests')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${tab === 'requests' ? 'bg-sf shadow-sm text-bl ring-1 ring-black/5' : 'text-t3 hover:text-tx'}`}>Solicitudes</button>
                    <button onClick={() => setTab('orders')} className={`px-5 py-2 rounded-xl text-xs font-bold transition-all uppercase tracking-wide ${tab === 'orders' ? 'bg-sf shadow-sm text-bl ring-1 ring-black/5' : 'text-t3 hover:text-tx'}`}>Órdenes Activas</button>
                </div>
            </div>
        </div>

        <div className="flex-1 min-h-0">
            {tab === 'requests' ? (
                <InternalRequestsManager reqs={reqs} setReqs={setReqs} inv={inv} whs={whs} hist={hist} sup={sup} prc={prc} masterProducts={masterProducts} />
            ) : (
                <OrdersView ord={ord} setOrd={setOrd} />
            )}
        </div>
    </div>
  );
}

const OrdersView = ({ ord, setOrd }: { ord: OrderItem[], setOrd: React.Dispatch<React.SetStateAction<OrderItem[]>> }) => {
    const [s, setS] = useState("");
    const fil = useMemo(() => ord.filter(o => 
        !s || o.pr.toLowerCase().includes(s.toLowerCase()) || o.po.toLowerCase().includes(s.toLowerCase()) || o.sp.toLowerCase().includes(s.toLowerCase())
    ), [ord, s]);

    const doX = () => csv(fil, 
        [{ k: "sp", l: "Proveedor" }, { k: "po", l: "PO" }, { k: "dl", l: "Entrega" }, { k: "pr", l: "Producto" }, { k: "qo", l: "Qty Orig" }, { k: "pn", l: "Pendiente" }, { k: "tt", l: "Total" }], 
        "Ordenes_Activas");

    return (
        <div className="h-full flex flex-col">
            <div className="flex justify-between items-center mb-6 shrink-0">
                <SI value={s} onChange={setS} ph="Buscar PO, producto o proveedor..." />
                <XB onClick={doX} />
            </div>
            <div className="bg-sf rounded-3xl overflow-hidden shadow-sm border border-bd flex-1">
                <div className="overflow-y-auto h-full custom-scrollbar">
                    <table className="w-full text-sm text-left border-collapse">
                        <thead className="sticky top-0 bg-s2 z-10 shadow-sm">
                            <tr>
                                <Th>PO</Th>
                                <Th>Proveedor</Th>
                                <Th>Producto</Th>
                                <Th>Entrega</Th>
                                <Th a="right">Ordenado</Th>
                                <Th a="right">Pendiente</Th>
                                <Th a="right">Total</Th>
                                <Th>Bodega</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-bd">
                            {fil.map((o, i) => (
                                <tr key={i} className="hover:bg-ac/50 transition-colors h-14">
                                    <td className="px-5 font-bold text-bl font-mono text-xs">{o.po}</td>
                                    <td className="px-5 font-bold text-tx text-xs">{o.sp}</td>
                                    <td className="px-5 text-t2 text-xs truncate max-w-[200px]">{o.pr}</td>
                                    <td className="px-5 text-t3 font-mono text-xs">{o.dl}</td>
                                    <td className="px-5 text-right font-bold text-tx text-xs">{(o.qo || 0).toLocaleString()}</td>
                                    <td className="px-5 text-right font-bold text-am text-xs">{(o.pn || 0).toLocaleString()}</td>
                                    <td className="px-5 text-right font-mono text-t3 text-xs">${(o.tt || 0).toLocaleString()}</td>
                                    <td className="px-5 text-t3 text-[10px] uppercase tracking-wide">{o.wh}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const ShareForm = ({ req }: { req: PurchaseRequest }) => {
    const [copied, setCopied] = useState(false);
    const url = `${window.location.origin}${window.location.pathname}?reqId=${req.id}&token=${req.token}`;
    
    const copy = () => {
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="p-1">
            <div className="bg-bl/5 border border-bl/10 p-5 rounded-2xl mb-5">
                <p className="text-sm text-t2 mb-3 font-medium">Comparta este enlace con el responsable de la bodega para que complete la solicitud:</p>
                <div className="flex gap-3">
                    <input readOnly value={url} className="flex-1 bg-sf border border-bd rounded-xl px-4 py-3 text-xs font-mono text-t3 outline-none" />
                    <button onClick={copy} className="bg-bl text-white px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 hover:bg-bl/90 transition-colors">
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                        {copied ? "Copiado" : "Copiar"}
                    </button>
                </div>
            </div>
            <div className="flex justify-end">
                <a href={url} target="_blank" rel="noreferrer" className="text-xs font-bold text-bl hover:underline flex items-center gap-1.5">
                    <LinkIcon size={14} /> Abrir enlace de prueba
                </a>
            </div>
        </div>
    );
};

export const ExternalOrderForm = ({ req, onSave, inv }: { req: PurchaseRequest, onSave: (r: PurchaseRequest) => void, inv: InventoryItem[] }) => {
    // ... (This component is for external use, keeping it visually consistent but simpler is fine. I'll update basic classes)
    const [items, setItems] = useState<RequestItem[]>(req.items);
    const [search, setSearch] = useState("");
    const [suggestions, setSuggestions] = useState<InventoryItem[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const handleSearch = (v: string) => {
        setSearch(v);
        if (!v.trim()) { 
            setSuggestions([]); 
            return; 
        }
        const lower = v.toLowerCase();
        const matches = inv.filter(i => 
            String(i.id).includes(lower) || 
            i.nm.toLowerCase().includes(lower)
        ).slice(0, 8);
        setSuggestions(matches);
        setShowSuggestions(true);
    };

    const addItem = (invItem: InventoryItem) => {
        const code = String(invItem.id);
        if (items.some(i => i.code === code)) {
            setSearch("");
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }

        const newItem: RequestItem = {
            id: Math.random().toString(36).substr(2, 9),
            code: code,
            desc: invItem.nm,
            cat: "", // Strict
            sub: invItem.sb,
            size: "", // Strict
            totalQty: 0,
            splits: [{
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString().split('T')[0],
                qty: 0
            }]
        };
        setItems([newItem, ...items]);
        setSearch("");
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const removeItem = (id: string) => {
        setItems(items.filter(i => i.id !== id));
    };

    const updateQty = (itemId: string, qty: number) => {
        setItems(items.map(i => {
            if (i.id !== itemId) return i;
            const newSplits = [...i.splits];
            if (newSplits.length === 0) {
                 newSplits.push({ id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString().split('T')[0], qty: qty });
            } else {
                 newSplits[0] = { ...newSplits[0], qty };
            }
            return { ...i, totalQty: qty, splits: newSplits };
        }));
    };

    const handleSave = () => {
        if (items.length === 0) {
            alert("Agregue al menos un producto.");
            return;
        }
        onSave({ ...req, items, status: 'Enviada por bodega' });
        alert("Solicitud enviada correctamente.");
    };

    return (
        <div className="min-h-screen bg-bg flex flex-col items-center py-12 px-4 font-sans text-tx">
            <div className="w-full max-w-3xl bg-sf rounded-3xl shadow-xl border border-bd overflow-hidden animate-fade-in">
                <div className="bg-bl/5 border-b border-bd p-8 flex justify-between items-center">
                    <div>
                        <div className="text-xs font-bold text-bl uppercase tracking-wider mb-2">Solicitud de Abastecimiento</div>
                        <h1 className="text-3xl font-black text-tx capitalize tracking-tight">{getReqTitle(req.createdAt)}</h1>
                        <div className="flex items-center gap-2 mt-2 text-sm font-medium text-t2">
                            <span className="font-mono text-t3 text-xs bg-s2 px-2 py-1 rounded-md border border-bd">{req.id}</span>
                            <Warehouse size={16} /> {req.wh}
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-xs font-bold text-t3 uppercase mb-1">Estado</div>
                        <div className="text-sm font-black text-tx">{req.status}</div>
                    </div>
                </div>

                <div className="p-8 space-y-8">
                    <div className="bg-s2/50 p-6 rounded-2xl border border-bd">
                         <label className="text-xs font-bold text-t3 uppercase tracking-wider mb-3 block">Agregar Producto</label>
                         <div className="relative">
                             <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-t3 w-4 h-4" />
                             <input 
                                value={search}
                                onChange={e => handleSearch(e.target.value)}
                                placeholder="Buscar por nombre o código..."
                                className="w-full pl-11 pr-4 py-3 bg-sf border border-bd rounded-xl text-sm font-bold text-tx outline-none focus:border-bl focus:ring-4 focus:ring-bl/5 transition-all shadow-sm"
                             />
                             {showSuggestions && suggestions.length > 0 && (
                                 <div className="absolute top-full left-0 right-0 mt-2 bg-sf border border-bd rounded-xl shadow-xl z-50 overflow-hidden max-h-60 overflow-y-auto">
                                     {suggestions.map(s => (
                                         <div 
                                            key={s.id} 
                                            onClick={() => addItem(s)}
                                            className="px-5 py-3 hover:bg-bl/5 cursor-pointer border-b border-bd last:border-0"
                                         >
                                             <div className="flex justify-between items-center">
                                                 <span className="font-bold text-sm text-tx">{s.nm}</span>
                                                 <span className="text-xs font-mono text-bl bg-bl/10 px-2 py-0.5 rounded-md font-bold">{s.id}</span>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="text-sm font-bold text-tx">Items Solicitados ({items.length})</h3>
                        </div>
                        <div className="space-y-3">
                            {items.length === 0 ? (
                                <div className="text-center py-12 text-t3 italic text-sm border-2 border-dashed border-bd rounded-2xl">
                                    Su lista está vacía. Agregue productos arriba.
                                </div>
                            ) : (
                                items.map(item => (
                                    <div key={item.id} className="bg-sf border border-bd rounded-2xl p-5 flex flex-col sm:flex-row gap-5 sm:items-center shadow-sm">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1.5">
                                                <span className="text-xs font-bold text-bl bg-bl/10 px-2 py-1 rounded-md font-mono">{item.code}</span>
                                                <span className="text-base font-bold text-tx">{item.desc}</span>
                                            </div>
                                            <div className="text-xs text-t3 font-medium ml-1">{item.sub || "—"}</div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-32">
                                                <label className="text-[10px] font-bold text-t3 uppercase mb-1 block">Cantidad</label>
                                                <input 
                                                    type="number" 
                                                    value={item.totalQty || ""} 
                                                    onChange={e => updateQty(item.id, parseFloat(e.target.value))}
                                                    className="w-full px-3 py-2 bg-s2 border border-bd rounded-xl text-right font-bold text-tx outline-none focus:border-bl h-10"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <button 
                                                onClick={() => removeItem(item.id)}
                                                className="p-2.5 text-t3 hover:text-rd hover:bg-rd/5 rounded-xl transition-colors"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-s2/30 border-t border-bd flex justify-end">
                    <Btn variant="primary" icon={Send} onClick={handleSave} className="w-full sm:w-auto justify-center px-8 py-3 text-base">
                        Enviar Solicitud
                    </Btn>
                </div>
            </div>
        </div>
    );
};

const InternalRequestsManager = ({ reqs, setReqs, inv, whs, hist, sup, prc, masterProducts }: any) => {
    const [modalOpen, setModalOpen] = useState(false);
    const [creationTab, setCreationTab] = useState<'portal' | 'manual' | 'import'>('portal');
    const [detailReq, setDetailReq] = useState<PurchaseRequest | null>(null);
    const [shareReq, setShareReq] = useState<PurchaseRequest | null>(null);
    
    // Warehouse Filter
    const [whFilter, setWhFilter] = useState("");

    // New Request State
    const [newWh, setNewWh] = useState(whs[0]);
    const [newEmail, setNewEmail] = useState("");
    
    // Import State
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importFile, setImportFile] = useState<File | null>(null);

    const generateId = () => "REQ-" + new Date().getFullYear() + "-" + String(reqs.length + 1).padStart(3, '0');
    const generateToken = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

    // Filter Logic
    const filteredReqs = useMemo(() => {
        return reqs.filter((r: PurchaseRequest) => !whFilter || r.wh.toLowerCase() === whFilter.toLowerCase());
    }, [reqs, whFilter]);

    const handleCreate = () => {
        const id = generateId();
        const token = generateToken();
        const now = new Date().toISOString().split('T')[0];

        if (creationTab === 'portal') {
            const req: PurchaseRequest = {
                id, wh: newWh, status: 'Borrador', createdAt: now, recipientEmail: newEmail, token, items: [], origin: 'Portal'
            };
            setReqs([req, ...reqs]);
            setModalOpen(false);
            setShareReq(req);
        } else if (creationTab === 'manual') {
            const req: PurchaseRequest = {
                id, wh: newWh, status: 'Borrador', createdAt: now, token, items: [], origin: 'Manual'
            };
            setReqs([req, ...reqs]);
            setModalOpen(false);
            setDetailReq(req);
        } else if (creationTab === 'import') {
            if (!importFile) return;
            const reader = new FileReader();
            reader.onload = (e) => {
                const txt = e.target?.result as string;
                const rows = parseCSV(txt);
                const itemsMap = new Map<string, RequestItem>();
                
                rows.forEach((r: any) => {
                    const code = r['codigo'] || r['code'] || r['item'];
                    const qty = parseFloat(r['cantidad'] || r['qty'] || r['quantity'] || '0');
                    const date = r['fecha'] || r['date'] || r['delivery'] || now;

                    if (!code || qty <= 0) return;

                    // Match against Master Product List ONLY
                    const masterProd = getProductByCode(String(code));
                    
                    if (masterProd) {
                        if (!itemsMap.has(code)) {
                            itemsMap.set(code, {
                                id: Math.random().toString(36).substr(2, 9),
                                code,
                                desc: masterProd.nm,
                                cat: masterProd.cat,
                                sub: masterProd.sb,
                                size: masterProd.size,
                                totalQty: 0,
                                splits: []
                            });
                        }
                        
                        const item = itemsMap.get(code)!;
                        item.totalQty += qty;
                        item.splits.push({
                            id: Math.random().toString(36).substr(2, 9),
                            date,
                            qty
                        });
                    }
                });

                const req: PurchaseRequest = {
                    id, 
                    wh: newWh,
                    status: 'Borrador', 
                    createdAt: now, 
                    token, 
                    items: Array.from(itemsMap.values()), 
                    origin: 'Excel'
                };
                
                setReqs([req, ...reqs]);
                setModalOpen(false);
                setDetailReq(req);
            };
            reader.readAsText(importFile);
        }
        setNewEmail("");
        setImportFile(null);
    };

    const handleUpdate = (updated: PurchaseRequest) => {
        setReqs((prev: PurchaseRequest[]) => prev.map((r: PurchaseRequest) => r.id === updated.id ? updated : r));
        setDetailReq(null);
    };

    return (
        <div className="h-full flex flex-col">
             <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <p className="text-sm font-medium text-t2">Control centralizado de solicitudes.</p>
                    <div className="h-6 w-px bg-bd"></div>
                    <FS value={whFilter} onChange={setWhFilter} options={whs} label="Todas las bodegas" />
                </div>
                <Btn variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Nueva Solicitud</Btn>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pr-2 pb-20 custom-scrollbar">
                {filteredReqs.map((r: PurchaseRequest) => (
                    <div key={r.id} className="bg-sf rounded-3xl border border-bd p-6 hover:shadow-lg transition-all group relative overflow-hidden flex flex-col h-full hover:border-bl/30">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <div className="text-xs font-bold text-t3 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                    <Calendar size={12} /> {r.createdAt}
                                </div>
                                <div className="text-xl font-black text-tx capitalize tracking-tight mb-1">{getReqTitle(r.createdAt)}</div>
                                <div className="text-sm font-bold text-bl flex items-center gap-2">
                                    <Warehouse size={16} /> {r.wh}
                                </div>
                            </div>
                            <span className={`text-[10px] font-black px-3 py-1 rounded-full border uppercase tracking-wider ${
                                r.status === 'Borrador' ? 'bg-am/10 text-am border-am/20' : 
                                r.status.includes('Enviada') ? 'bg-cy/10 text-cy border-cy/20' : 
                                r.status === 'Aprobada' ? 'bg-gn/10 text-gn border-gn/20' :
                                'bg-bl/10 text-bl border-bl/20'
                            }`}>
                                {r.status}
                            </span>
                        </div>
                        
                        <div className="bg-s2/50 rounded-2xl p-4 mb-5 flex-1 border border-bd/50">
                            <div className="flex justify-between text-[10px] text-t3 font-mono mb-3 border-b border-bd/50 pb-2">
                                <span className="font-bold">REF: {r.id}</span>
                                <span className="bg-sf px-1.5 py-0.5 rounded border border-bd">{r.origin || 'Portal'}</span>
                            </div>
                            {r.items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-50 py-4">
                                    <ShoppingCart size={24} className="mb-2 text-t3" />
                                    <span className="text-xs font-bold text-t3">Sin items</span>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between text-xs font-medium mb-1.5">
                                        <span className="text-t3 uppercase tracking-wider font-bold text-[10px]">Items</span>
                                        <span className="text-tx font-bold">{r.items.length}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-medium mb-3">
                                        <span className="text-t3 uppercase tracking-wider font-bold text-[10px]">Unidades</span>
                                        <span className="text-tx font-bold">{r.items.reduce((a, b) => a + b.totalQty, 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium pt-3 mt-1 border-t border-bd/50">
                                        <span className="text-t2 font-bold">Valor Estimado</span>
                                        <span className="text-tx font-black">
                                            {r.totalValue ? `$${r.totalValue.toLocaleString()}` : <span className="text-t3 italic">--</span>}
                                        </span>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="flex gap-3 mt-auto">
                            <button 
                                onClick={() => setDetailReq(r)}
                                className="flex-1 py-3 rounded-xl bg-sf border-2 border-bd/50 text-xs font-bold text-tx uppercase tracking-wide hover:border-bl hover:text-bl hover:bg-bl/5 transition-all"
                            >
                                Gestionar
                            </button>
                            {r.origin === 'Portal' && (
                                <button 
                                    onClick={() => setShareReq(r)}
                                    className={`px-4 py-3 rounded-xl border-2 transition-all ${r.status === 'Borrador' ? 'bg-bl text-white border-bl shadow-md shadow-bl/20' : 'bg-sf border-bd text-bl hover:bg-bl hover:text-white hover:border-bl'}`}
                                    title="Enviar Enlace a Bodega"
                                >
                                    <Send size={18} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Iniciar Solicitud de Abastecimiento" onSave={handleCreate} saveLabel={creationTab === 'import' ? 'Importar y Crear' : 'Crear Solicitud'}>
                <div className="flex gap-3 mb-6 p-1.5 bg-s2 rounded-2xl border border-bd">
                    <button onClick={() => setCreationTab('portal')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 ${creationTab === 'portal' ? 'bg-sf shadow-sm text-bl ring-1 ring-black/5' : 'text-t3 hover:text-tx'}`}>
                        <Globe size={16} /> Enlace Web
                    </button>
                    <button onClick={() => setCreationTab('manual')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 ${creationTab === 'manual' ? 'bg-sf shadow-sm text-bl ring-1 ring-black/5' : 'text-t3 hover:text-tx'}`}>
                        <PenTool size={16} /> Manual
                    </button>
                    <button onClick={() => setCreationTab('import')} className={`flex-1 py-2.5 text-xs font-black uppercase tracking-wide rounded-xl transition-all flex items-center justify-center gap-2 ${creationTab === 'import' ? 'bg-sf shadow-sm text-bl ring-1 ring-black/5' : 'text-t3 hover:text-tx'}`}>
                        <FileSpreadsheet size={16} /> Excel/CSV
                    </button>
                </div>

                <div className="py-2 space-y-5">
                    <div>
                        <label className="text-xs font-bold text-t2 uppercase tracking-wider ml-1 mb-2 block">Bodega Solicitante</label>
                        <FS value={newWh} onChange={setNewWh} options={whs} label="Seleccionar Bodega" />
                    </div>

                    {creationTab === 'portal' && (
                        <>
                            <div>
                                <label className="text-xs font-bold text-t2 uppercase tracking-wider ml-1 mb-2 block">Email Responsable (Opcional)</label>
                                <Inp value={newEmail} onChange={setNewEmail} placeholder="bodega@eliteflower.com" />
                            </div>
                            <div className="bg-bl/5 border border-bl/10 p-5 rounded-2xl flex gap-4 items-start">
                                <AlertCircle className="text-bl shrink-0 mt-0.5" size={20} />
                                <p className="text-sm text-t2 leading-relaxed">
                                    Se generará un <strong>Enlace Seguro</strong>. Envíe este enlace al responsable de la bodega para que ingrese los productos requeridos.
                                </p>
                            </div>
                        </>
                    )}

                    {creationTab === 'manual' && (
                        <div className="bg-am/5 border border-am/10 p-5 rounded-2xl flex gap-4 items-start">
                            <PenTool className="text-am shrink-0 mt-0.5" size={20} />
                            <p className="text-sm text-t2 leading-relaxed">
                                Se creará una solicitud vacía. Podrá ingresar los productos y entregas manualmente en la siguiente pantalla.
                            </p>
                        </div>
                    )}

                    {creationTab === 'import' && (
                        <div>
                            <label className="text-xs font-bold text-t2 uppercase tracking-wider ml-1 mb-2 block">Archivo CSV</label>
                            <div className="border-2 border-dashed border-bd rounded-2xl p-8 flex flex-col items-center justify-center text-center hover:bg-s2 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
                                <div className="bg-bg p-3 rounded-full mb-3 group-hover:scale-110 transition-transform"><Upload size={24} className="text-bl" /></div>
                                <span className="text-sm font-bold text-tx">{importFile ? importFile.name : "Click para cargar archivo"}</span>
                                <span className="text-xs text-t3 mt-1">Columnas: Codigo, Cantidad, Fecha</span>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            <Modal isOpen={!!shareReq} onClose={() => setShareReq(null)} title="Enviar a Bodega" saveLabel="Cerrar" onSave={() => setShareReq(null)}>
                {shareReq && <ShareForm req={shareReq} />}
            </Modal>

            {detailReq && (
                <InternalRequestDetails 
                    req={detailReq} 
                    hist={hist}
                    sup={sup}
                    prc={prc}
                    inv={inv}
                    masterProducts={masterProducts}
                    onClose={() => setDetailReq(null)} 
                    onSave={handleUpdate} 
                />
            )}
        </div>
    );
};

const InternalRequestDetails = ({ req, onSave, onClose, hist, sup, prc, inv, masterProducts }: any) => {
    const [items, setItems] = useState<RequestItem[]>(req.items);
    const [showFilters, setShowFilters] = useState(false);
    const isEditable = req.status === 'Borrador';
    
    // Add Item State
    const [addCode, setAddCode] = useState("");
    const [addSplits, setAddSplits] = useState<{id: string, date: string, qty: string}[]>([
        { id: '1', date: new Date().toISOString().split('T')[0], qty: '' }
    ]);
    const [addDesc, setAddDesc] = useState("");
    const [addCat, setAddCat] = useState("");
    const [addSub, setAddSub] = useState("");
    const [addSize, setAddSize] = useState("");
    const [codeError, setCodeError] = useState(false);
    
    // Bulk Mode State
    const [showBulkModal, setShowBulkModal] = useState(false);
    const [showCatalogModal, setShowCatalogModal] = useState(false);

    // Quick Gen State
    const [isMagicMode, setIsMagicMode] = useState(false);
    const [genConfig, setGenConfig] = useState({ 
        start: new Date().toISOString().split('T')[0], 
        qty: '', 
        count: '4', 
        freq: '7' 
    });

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Template Menu State
    const [showTemplateMenu, setShowTemplateMenu] = useState(false);
    const templateMenuRef = useRef<HTMLDivElement>(null);

    // Filters State
    const [filters, setFilters] = useState({
        supplier: "",
        category: "",
        subcategory: "",
        poStatus: "",
        dateStart: "",
        dateEnd: ""
    });
    
    // Delete Confirmation State
    const [deleteCandidate, setDeleteCandidate] = useState<{itemId: string, splitId: string} | null>(null);

    // Sort State
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' | 'none' }>({ key: 'none', direction: 'none' });

    // Use global master data for search if prop is missing, but prefer prop for consistency if passed
    const productsSource = PRODUCT_MASTER.length > 0 ? PRODUCT_MASTER : masterProducts;

    const getSuggestions = (term: string) => {
        const t = term.toLowerCase().trim();
        if (!t) return productsSource.slice(0, 8);
        return productsSource.filter((p: MasterProduct) => 
            p.id.toLowerCase().includes(t) || 
            p.nm.toLowerCase().includes(t)
        ).slice(0, 8);
    };

    useEffect(() => {
        const handleClickOutside = (event: any) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
            if (templateMenuRef.current && !templateMenuRef.current.contains(event.target)) {
                setShowTemplateMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Available months for template
    const availableMonths = useMemo(() => {
        const monthsMap = new Map<string, { year: number, month: number, count: number }>();
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        
        hist.filter((h: HistoryItem) => h.wh === req.wh).forEach((h: HistoryItem) => {
            const d = new Date(h.dt);
            if (isNaN(d.getTime())) return;
            const key = `${d.getFullYear()}-${d.getMonth()}`;
            if (!monthsMap.has(key)) {
                monthsMap.set(key, { year: d.getFullYear(), month: d.getMonth(), count: 0 });
            }
            monthsMap.get(key)!.count++;
        });

        return Array.from(monthsMap.values())
            .sort((a, b) => {
                if (a.year !== b.year) return b.year - a.year;
                return b.month - a.month;
            })
            .map(m => ({
                ...m,
                label: `${monthNames[m.month]} ${m.year}`
            }));
    }, [hist, req.wh]);

    // Calculate Contextual Stats
    const productStats = useMemo(() => {
        if (!addCode) return null;
        
        const currentWhItem = inv.find((i: InventoryItem) => String(i.id) === addCode && i.wh === req.wh);
        const anyItem = inv.find((i: InventoryItem) => String(i.id) === addCode);
        const itemData = currentWhItem || anyItem;

        const historyItems = hist.filter((h: HistoryItem) => 
             String(h.po) !== "" && (
                String(h.pr) === addCode || 
                (itemData && h.pr.includes(itemData.nm))
             )
        );
        
        const whHistory = historyItems.filter(h => h.wh === req.wh);
        const relevantHistory = whHistory.length > 0 ? whHistory : historyItems;

        const lastOrder = relevantHistory.length > 0 
            ? relevantHistory.sort((a: HistoryItem, b: HistoryItem) => new Date(b.dt).getTime() - new Date(a.dt).getTime())[0]
            : null;

        const weeklyDemand = itemData ? itemData.wd : 0;
        const avgMonthly = Math.round(weeklyDemand * 4.3);
        const lastMonth = Math.round(avgMonthly * (0.85 + (addCode.length % 3) * 0.1)); 

        const packMatch = addSize ? addSize.match(/\d+/) : null;
        const unitsPerPack = packMatch ? parseInt(packMatch[0]) : 1;
        
        const boxesPerPallet = 48; 
        const unitsPerPallet = unitsPerPack > 1 ? unitsPerPack * boxesPerPallet : 800;

        return {
            avgConsumption: avgMonthly,
            lastMonthConsumption: lastMonth,
            lastOrder: lastOrder ? {
                date: lastOrder.dt,
                qty: lastOrder.qt,
                supplier: lastOrder.sp,
                price: lastOrder.up
            } : null,
            logistics: {
                pack: addSize,
                pallet: unitsPerPallet
            }
        };
    }, [addCode, addDesc, inv, hist, addSize, req.wh]);

    const totalAddQty = useMemo(() => addSplits.reduce((acc, s) => acc + (parseInt(s.qty) || 0), 0), [addSplits]);

    const handleInputFocus = () => {
        setSuggestions(getSuggestions(addCode));
        setShowSuggestions(true);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setAddCode(val);
        
        // Check if value exists in master
        const match = getProductByCode(val) || productsSource.find(p => String(p.id) === String(val));
        
        if (match) {
            setAddDesc(match.nm);
            setAddCat(match.cat);
            setAddSub(match.sb);
            setAddSize(match.size);
            setCodeError(false);
        } else {
             setAddDesc("");
             setAddCat("");
             setAddSub("");
             setAddSize("");
             if (val.length > 3) setCodeError(true);
        }

        setSuggestions(getSuggestions(val));
        setShowSuggestions(true);
    };

    const selectProduct = (item: any) => {
        setAddCode(String(item.id));
        setAddDesc(item.nm);
        setAddSub(item.sb || "");
        setAddCat(item.cat || "");
        setAddSize(item.size || "");
        setShowSuggestions(false);
        setCodeError(false);
    };

    const updateAddSplit = (id: string, field: 'date' | 'qty', val: string) => {
        setAddSplits(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
    };
    const addSplitRow = () => setAddSplits(prev => [...prev, { id: Math.random().toString(36).substr(2, 5), date: '', qty: '' }]);
    const removeSplitRow = (id: string) => {
        if (addSplits.length > 1) setAddSplits(prev => prev.filter(s => s.id !== id));
    };

    const handleAddItem = () => {
        if (!addCode || !addDesc || totalAddQty <= 0) return;
        
        // Strict Master Check
        const validMaster = getProductByCode(addCode) || productsSource.find(p => String(p.id) === String(addCode));
        if (!validMaster) {
            setCodeError(true);
            alert("Código inválido. Seleccione un producto del catálogo maestro.");
            return;
        }

        const validSplits = addSplits.filter(s => s.date && parseInt(s.qty) > 0).map(s => ({
            id: Math.random().toString(36).substr(2, 9),
            date: s.date,
            qty: parseInt(s.qty)
        }));

        if (validSplits.length === 0) {
            alert("Ingrese al menos una entrega válida (fecha y cantidad).");
            return;
        }

        const existingItemIndex = items.findIndex(i => String(i.code) === String(addCode));
        
        if (existingItemIndex > -1) {
            const updatedItems = [...items];
            const item = updatedItems[existingItemIndex];
            item.splits.push(...validSplits);
            item.totalQty += validSplits.reduce((a,b) => a + b.qty, 0);
            setItems(updatedItems);
        } else {
            const newItem: RequestItem = {
                id: Math.random().toString(36).substr(2, 9),
                code: addCode,
                desc: validMaster.nm, 
                cat: validMaster.cat, 
                sub: validMaster.sb,
                size: validMaster.size,
                totalQty: validSplits.reduce((a,b) => a + b.qty, 0),
                splits: validSplits
            };
            setItems([newItem, ...items]);
        }

        setAddCode(""); 
        setAddDesc(""); 
        setAddSub(""); 
        setAddCat("");
        setAddSize("");
        setAddSplits([{ id: Math.random().toString(36).substr(2, 5), date: new Date().toISOString().split('T')[0], qty: '' }]);
        setSuggestions([]);
        setShowSuggestions(false);
    };

    const handleBulkAdd = (newItems: RequestItem[]) => {
        setItems(prev => [...newItems, ...prev]);
    };

    const loadTemplate = (year: number, month: number) => {
        const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
        const label = `${monthNames[month]} ${year}`;

        if (!window.confirm(`¿Cargar plantilla de ${label}?\n\nADVERTENCIA: Se eliminarán los items actuales y se reemplazarán por los del historial seleccionado.`)) {
            setShowTemplateMenu(false);
            return;
        }

        const start = new Date(year, month, 1);
        const end = new Date(year, month + 1, 0);
        
        const relevant = hist.filter((h: HistoryItem) => {
             const d = new Date(h.dt);
             return h.wh === req.wh && d >= start && d <= end;
        });

        if (relevant.length === 0) {
            alert("No se encontraron compras en el periodo seleccionado.");
            setShowTemplateMenu(false);
            return;
        }

        const grouped = new Map<string, number>();
        relevant.forEach((h: HistoryItem) => grouped.set(h.pr, (grouped.get(h.pr) || 0) + h.qt));

        const toAdd: RequestItem[] = [];
        
        grouped.forEach((qty, name) => {
             // Try to find master by name or guess code if name matches
             const master = productsSource.find((m: MasterProduct) => m.nm === name);
             if (master) {
                 toAdd.push({
                     id: Math.random().toString(36).substr(2, 9),
                     code: master.id,
                     desc: master.nm,
                     cat: master.cat,
                     sub: master.sb,
                     size: master.size,
                     totalQty: qty,
                     splits: [{
                         id: Math.random().toString(36).substr(2, 9),
                         date: "", 
                         qty: qty
                     }]
                 });
             }
        });

        if (toAdd.length > 0) {
            setItems(toAdd); // Replace existing items
        } else {
             alert("Todos los productos del periodo seleccionado no se encontraron en el maestro.");
        }
        setShowTemplateMenu(false);
    };

    const applyGen = () => {
        if(!genConfig.start || !genConfig.qty || !genConfig.count) return;
        const newSplits = [];
        let curr = new Date(genConfig.start + 'T12:00:00'); 
        const count = parseInt(genConfig.count) || 1;
        const freq = parseInt(genConfig.freq) || 7;
        
        for(let i=0; i<count; i++) {
            newSplits.push({
                id: Math.random().toString(36).substr(2,9),
                date: curr.toISOString().split('T')[0],
                qty: genConfig.qty
            });
            curr.setDate(curr.getDate() + freq);
        }
        setAddSplits(newSplits);
    };

    const uniqueSuppliers = useMemo(() => {
        const s = new Set<string>();
        items.forEach(i => i.splits.forEach(sp => { if(sp.supplier) s.add(sp.supplier); }));
        return Array.from(s).sort();
    }, [items]);
    const uniqueCats = useMemo(() => {
        const cats = new Set<string>();
        items.forEach(i => {
             const m = productsSource.find(p => String(p.id) === String(i.code));
             const c = m ? m.cat : i.cat;
             if(c) cats.add(c);
        });
        return Array.from(cats).sort();
    }, [items, productsSource]);
    const uniqueSubs = useMemo(() => {
        const subs = new Set<string>();
        items.forEach(i => {
             const m = productsSource.find(p => String(p.id) === String(i.code));
             const s = m ? m.sb : i.sub;
             if(s) subs.add(s);
        });
        return Array.from(subs).sort();
    }, [items, productsSource]);

    const filteredRows = useMemo(() => {
        return items.flatMap(item => {
            const master = productsSource.find(p => String(p.id) === String(item.code));
            return item.splits.map((split, splitIndex) => ({
                item,
                split,
                splitIndex,
                master
            }));
        }).filter(({ item, split, master }) => {
            const cat = master ? master.cat : item.cat;
            const sub = master ? master.sb : item.sub;
            
            if (filters.supplier && split.supplier !== filters.supplier) return false;
            if (filters.category && cat !== filters.category) return false;
            if (filters.subcategory && sub !== filters.subcategory) return false;
            if (filters.poStatus === 'ASSIGNED' && !split.externalPO) return false;
            if (filters.poStatus === 'PENDING' && split.externalPO) return false;
            if (filters.dateStart && split.date < filters.dateStart) return false;
            if (filters.dateEnd && split.date > filters.dateEnd) return false;
            return true;
        });
    }, [items, filters, productsSource]);

    const sortedRows = useMemo(() => {
        let rows = [...filteredRows];
        if (sortConfig.direction !== 'none') {
             rows.sort((a, b) => {
                // 1. Primary Sort
                let valA = '';
                let valB = '';
                
                switch (sortConfig.key) {
                    case 'code':
                        valA = String(a.item.code || '').trim();
                        valB = String(b.item.code || '').trim();
                        break;
                    case 'desc':
                        // Use master name if available, else item desc
                        valA = String(a.master ? a.master.nm : a.item.desc).trim();
                        valB = String(b.master ? b.master.nm : b.item.desc).trim();
                        break;
                    case 'cat':
                        // Use master cat if available, else item cat
                        valA = String(a.master ? a.master.cat : a.item.cat || '').trim();
                        valB = String(b.master ? b.master.cat : b.item.cat || '').trim();
                        break;
                    default:
                        return 0;
                }

                const cmp = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
                
                if (cmp !== 0) {
                    return sortConfig.direction === 'asc' ? cmp : -cmp;
                }

                // 2. Secondary Sort: Code (Always ASC)
                const cA = String(a.item.code || '').trim();
                const cB = String(b.item.code || '').trim();
                const codeCmp = cA.localeCompare(cB, undefined, { numeric: true, sensitivity: 'base' });
                if (codeCmp !== 0) return codeCmp;

                // 3. Tertiary Sort: Date (Always ASC)
                const dA = a.split.date || '';
                const dB = b.split.date || '';
                if (dA < dB) return -1;
                if (dA > dB) return 1;

                return 0;
            });
        }
        return rows;
    }, [filteredRows, sortConfig]);

    const pendingEmails = useMemo(() => filteredRows.filter(r => r.split.supplier && !r.split.emailSent).length, [filteredRows]);
    const resetFilters = () => setFilters({ supplier: "", category: "", subcategory: "", poStatus: "", dateStart: "", dateEnd: "" });

    const updateSplitValue = (itemId: string, splitId: string, field: keyof DeliverySplit, value: any) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id !== itemId) return item;
            
            const newSplits = item.splits.map(split => {
                if (split.id !== splitId) return split;
                return { ...split, [field]: value };
            });

            // Recalculate totalQty if qty changed
            let newTotalQty = item.totalQty;
            if (field === 'qty') {
                 newTotalQty = newSplits.reduce((acc, s) => acc + (Number(s.qty) || 0), 0);
            }

            return {
                ...item,
                splits: newSplits,
                totalQty: newTotalQty
            };
        }));
    };

    const confirmRemoveRow = () => {
        if (!deleteCandidate) return;
        const { itemId, splitId } = deleteCandidate;

        setItems(prev => {
             // We need to map to find the item and filter its splits
             return prev.map(item => {
                 if (item.id !== itemId) return item;
                 
                 // Remove the specific split
                 const newSplits = item.splits.filter(s => s.id !== splitId);
                 
                 // Recalculate total qty for this item
                 const newTotal = newSplits.reduce((acc, s) => acc + (Number(s.qty) || 0), 0);

                 return {
                     ...item,
                     splits: newSplits,
                     totalQty: newTotal
                 };
             }).filter(item => item.splits.length > 0); // Remove item if no splits left
        });
        
        setDeleteCandidate(null);
    };

    const handleSupplierChange = (itemId: string, splitId: string, supplier: string) => {
        setItems(prevItems => prevItems.map(item => {
            if (item.id !== itemId) return item;
            // Use helper to check price
            const price = getPriceBySupplier(item.code, supplier);
            return {
                ...item,
                splits: item.splits.map(split => {
                    if (split.id !== splitId) return split;
                    const updates: any = { supplier };
                    if (price !== null) {
                        updates.unitPrice = price;
                    } else if (!supplier) {
                        updates.unitPrice = 0;
                        updates.externalPO = ""; 
                    }
                    return { ...split, ...updates };
                })
            };
        }));
    };

    const isSystemPrice = (code: string, supplier?: string) => {
        if (!supplier) return false;
        return getPriceBySupplier(code, supplier) !== null;
    };

    const calculateTotalValue = () => {
        return items.reduce((total, item) => {
            const itemTotal = item.splits.reduce((acc, split) => acc + ((split.qty || 0) * (split.unitPrice || 0)), 0);
            return total + itemTotal;
        }, 0);
    };

    const handleSave = () => {
        onSave({ ...req, items, totalValue: calculateTotalValue() });
    };

    const handleApprove = () => {
        const missingPO = items.some(i => i.splits.some(s => !s.externalPO));
        if (missingPO) {
             const confirm = window.confirm("Algunas entregas no tienen Orden de Compra (PO) asignada. ¿Desea aprobar parcial o continuar?");
             if (!confirm) return;
        }
        onSave({ 
            ...req, 
            items, 
            totalValue: calculateTotalValue(),
            status: missingPO ? 'Parcial' : 'Aprobada'
        });
        onClose();
    };

    const handleNotify = (targets: {itemId: string, splitId: string}[]) => {
        const now = new Date().toISOString();
        setItems(prevItems => prevItems.map(item => {
            const itemTargets = targets.filter(t => t.itemId === item.id);
            if (itemTargets.length === 0) return item;
            return {
                ...item,
                splits: item.splits.map(split => {
                    if (itemTargets.some(t => t.splitId === split.id)) {
                        return { ...split, emailSent: now };
                    }
                    return split;
                })
            };
        }));
    };

    const handleNotifyAllPending = () => {
        const targets = filteredRows.filter(r => r.split.supplier && !r.split.emailSent).map(r => ({ itemId: r.item.id, splitId: r.split.id }));
        if (targets.length === 0) return;
        const uniqueSuppliers = new Set(filteredRows.filter(r => r.split.supplier && !r.split.emailSent).map(r => r.split.supplier));
        if (window.confirm(`¿Enviar correos a ${uniqueSuppliers.size} proveedores para ${targets.length} entregas pendientes?`)) {
            handleNotify(targets);
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "Seleccionar";
        try {
            const d = new Date(dateStr + 'T12:00:00');
            return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return dateStr; }
    };

    const handleAddRow = () => {
        const newItem: RequestItem = {
            id: Math.random().toString(36).substr(2, 9),
            code: "",
            desc: "",
            cat: "",
            sub: "",
            size: "",
            totalQty: 0,
            splits: [{
                id: Math.random().toString(36).substr(2, 9),
                date: new Date().toISOString().split('T')[0],
                qty: 0
            }]
        };
        setItems(prev => [...prev, newItem]);
    };

    const handleCodeChange = (itemId: string, val: string, master?: MasterProduct) => {
        // If master is provided, use it directly. Otherwise try to find it.
        const foundMaster = master || productsSource.find(p => String(p.id) === String(val));
        
        setItems(prev => prev.map(item => {
            if (item.id !== itemId) return item;
            
            // If code is changing, reset splits supplier info
            const isChanged = item.code !== val;
            
            const newSplits = isChanged ? item.splits.map(s => ({
                ...s,
                supplier: '',
                unitPrice: 0,
                externalPO: ''
            })) : item.splits;

            return {
                ...item,
                code: val,
                desc: foundMaster ? foundMaster.nm : "",
                cat: foundMaster ? foundMaster.cat : "",
                sub: foundMaster ? foundMaster.sb : "",
                size: foundMaster ? foundMaster.size : "",
                splits: newSplits
            };
        }));
    };
    
    return (
        <div className="fixed inset-0 z-50 bg-bg flex flex-col animate-fade-in">
            {/* Header */}
            <div className="h-20 px-6 border-b border-bd flex justify-between items-center bg-sf shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2.5 hover:bg-hv rounded-xl text-t2 hover:text-tx transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-black text-tx flex items-center gap-2 capitalize tracking-tight">
                            {getReqTitle(req.createdAt)}
                            <span className="text-xs px-2.5 py-1 rounded-lg bg-vi/10 text-vi border border-vi/20 uppercase tracking-wide font-black">
                                {req.origin || 'Portal'}
                            </span>
                        </h2>
                        <div className="text-sm text-t2 font-bold mt-1 flex items-center gap-2">
                            <span className="font-mono text-t3 text-xs bg-s2 px-2 py-0.5 rounded-md border border-bd">{req.id}</span>
                            <Warehouse size={16} /> {req.wh}
                        </div>
                    </div>
                </div>
                <div className="flex gap-4 items-center">
                    <div className="px-6 flex flex-col justify-center mr-2 text-right">
                         <span className="text-xs font-bold text-t3 uppercase tracking-wider mb-0.5">Valor Total</span>
                         <span className="text-2xl font-black text-tx tabular-nums tracking-tight">${(calculateTotalValue() || 0).toLocaleString()}</span>
                    </div>
                    {pendingEmails > 0 && (
                        <Btn variant="secondary" onClick={handleNotifyAllPending} className="bg-bl/10 text-bl border-bl/20 hover:bg-bl/20">
                             <Mail size={16} /> Notificar Pendientes ({pendingEmails})
                        </Btn>
                    )}
                    <Btn variant="secondary" icon={Save} onClick={handleSave}>Guardar</Btn>
                    {req.status !== 'Aprobada' && (
                        <Btn variant="primary" icon={CheckCircle2} onClick={handleApprove}>Aprobar</Btn>
                    )}
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-s2/50">
                    
                    {/* Add Item Section (Manual Mode) */}
                    {isEditable && (
                        <div className="mb-8 bg-sf p-8 rounded-3xl border border-bd shadow-sm animate-fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl bg-tx text-bg flex items-center justify-center shadow-lg shadow-tx/20">
                                        <Plus size={20} strokeWidth={3} />
                                    </div>
                                    <span className="text-lg font-black text-tx tracking-tight">Agregar Productos</span>
                                </div>
                                
                                <div className="flex gap-3">
                                    <button 
                                        onClick={() => setShowCatalogModal(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-bl text-white shadow-lg shadow-bl/25 hover:bg-bl/90 transition-all text-xs font-bold active:scale-95"
                                    >
                                        <Grid size={16} />
                                        Catálogo
                                    </button>
                                    <button 
                                        onClick={() => setShowBulkModal(true)}
                                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-s2 hover:bg-hv border border-bd hover:border-bd/80 transition-all text-xs font-bold text-t2 active:scale-95"
                                    >
                                        <List size={16} className="text-t3" />
                                        Pegar Lista
                                    </button>
                                </div>
                            </div>
                            
                            <div className="flex flex-col xl:flex-row gap-8 animate-fade-in">
                                <div className="flex-1 space-y-6">
                                    <div className="relative" ref={wrapperRef}>
                                        <label className="text-xs font-bold text-t3 uppercase tracking-wider mb-2.5 block pl-1">Código de Producto</label>
                                        <div className="relative">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-t3 w-5 h-5" />
                                            <input 
                                                value={addCode} 
                                                onChange={handleInputChange}
                                                onFocus={handleInputFocus}
                                                onKeyDown={e => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        if (suggestions.length > 0) selectProduct(suggestions[0]);
                                                    }
                                                    if (e.key === 'Backspace' && !showSuggestions) {
                                                        setShowSuggestions(true);
                                                    }
                                                    if (e.key === 'Escape') {
                                                        setShowSuggestions(false);
                                                    }
                                                }}
                                                placeholder="Ej: 1498" 
                                                className={`w-full pl-12 pr-4 py-4 bg-sf border rounded-2xl text-base font-bold text-tx outline-none transition-all shadow-sm ${codeError ? 'border-rd focus:border-rd ring-4 ring-rd/5' : 'border-bd hover:border-bl/40 focus:border-bl focus:ring-4 focus:ring-bl/5'}`}
                                            />
                                            {showSuggestions && (
                                                <div className="absolute top-full left-0 right-0 mt-2 bg-sf border border-bd rounded-2xl shadow-xl z-50 overflow-hidden max-h-80 overflow-y-auto custom-scrollbar animate-fade-in">
                                                    {suggestions.length === 0 ? (
                                                        <div className="px-6 py-4 text-sm text-t3 italic text-center">No hay coincidencias</div>
                                                    ) : (
                                                        suggestions.map((item, idx) => (
                                                            <div 
                                                                key={item.id + idx}
                                                                onClick={() => selectProduct(item)}
                                                                className="px-6 py-3.5 hover:bg-bl/5 cursor-pointer border-b border-bd/40 last:border-0 transition-colors group"
                                                            >
                                                                <div className="flex items-center justify-between mb-0.5">
                                                                    <div className="font-bold text-sm text-tx">{item.id}</div>
                                                                    <div className="text-[10px] font-bold uppercase text-t3 bg-s2 px-2 py-0.5 rounded-md border border-bd/50">{item.sb || "—"}</div>
                                                                </div>
                                                                <div className="text-xs text-t2 font-medium mt-0.5 truncate group-hover:text-bl transition-colors">{item.nm}</div>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {codeError && <span className="absolute -bottom-6 left-1 text-xs font-bold text-rd flex items-center gap-1.5 animate-fade-in"><AlertCircle size={12} /> Producto no encontrado en Maestro</span>}
                                    </div>
                                    
                                    {/* Product Info Readonly */}
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-t3 uppercase tracking-wider block pl-1">Información del Producto (Lectura)</label>
                                        
                                        <div className={`w-full p-6 rounded-2xl border transition-all duration-300 ${addDesc ? 'bg-sf border-bl/20 shadow-lg shadow-bl/5' : 'bg-s2/30 border-bd/60 border-dashed'}`}>
                                            <div className="flex items-start justify-between gap-6">
                                                <div className="flex-1">
                                                    <div className={`text-base transition-colors ${addDesc ? 'font-black text-tx text-xl leading-tight' : 'font-medium text-t3 italic'}`}>
                                                        {addDesc || "Ingrese código válido..."}
                                                    </div>
                                                    {addDesc && (
                                                       <div className="space-y-5 mt-5">
                                                           <div className="flex flex-wrap gap-2.5 select-none pointer-events-none">
                                                                <div className="flex flex-col">
                                                                    <span className="text-[10px] font-bold text-t3 mb-1 uppercase tracking-wider">Pack Size</span>
                                                                    <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm border ${addSize ? 'bg-tx text-bg border-tx' : 'bg-s2 text-t3 border-bd/50'}`}>
                                                                        {addSize || "—"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                     <span className="text-[10px] font-bold text-t3 mb-1 uppercase tracking-wider">Categoría</span>
                                                                     <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm border ${addCat ? 'bg-bl text-white border-bl' : 'bg-s2 text-t3 border-bd/50'}`}>
                                                                        {addCat || "—"}
                                                                    </span>
                                                                </div>
                                                                <div className="flex flex-col">
                                                                     <span className="text-[10px] font-bold text-t3 mb-1 uppercase tracking-wider">Subcategoría</span>
                                                                     <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm border ${addSub ? 'bg-vi text-white border-vi' : 'bg-s2 text-t3 border-bd/50'}`}>
                                                                        {addSub || "—"}
                                                                    </span>
                                                                </div>
                                                           </div>
                                                           
                                                           {/* Stats */}
                                                           {productStats && (
                                                               <div className="mt-4 grid grid-cols-2 gap-2">
                                                                   <div className="bg-s2/50 p-2 rounded-lg border border-bd/50">
                                                                       <div className="text-[9px] text-t3 uppercase font-bold mb-0.5">Consumo Prom.</div>
                                                                       <div className="text-xs font-black text-tx">{(productStats.avgMonthly || 0).toLocaleString()}</div>
                                                                   </div>
                                                                   <div className="bg-s2/50 p-2 rounded-lg border border-bd/50">
                                                                        <div className="text-[9px] text-t3 uppercase font-bold mb-0.5">Última Compra</div>
                                                                        <div className="text-xs font-black text-tx">{productStats.lastOrder ? productStats.lastOrder.date : "N/A"}</div>
                                                                   </div>
                                                               </div>
                                                           )}
                                                       </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="pt-6 border-t border-bd/50 flex justify-end">
                                        <button 
                                            onClick={handleAddItem}
                                            className="px-8 py-3 rounded-xl bg-bl text-white font-bold text-sm shadow-lg shadow-bl/20 hover:bg-bl/90 transition-all active:scale-95 flex items-center gap-2"
                                        >
                                            <Plus size={18} strokeWidth={3} />
                                            Agregar a la Lista
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ITEMS LIST */}
                    <div className="bg-sf rounded-3xl border border-bd shadow-sm overflow-hidden min-h-[400px] flex flex-col">
                         {/* Filters & Toolbar could go here */}
                         <div className="p-4 border-b border-bd bg-s2/20 flex justify-between items-center gap-4">
                             <h3 className="text-sm font-black text-tx uppercase tracking-wider flex items-center gap-2">
                                <List size={16} /> Detalle de Solicitud
                             </h3>
                             {/* Add manual row button for quick entry */}
                             {isEditable && (
                                 <button onClick={handleAddRow} className="text-xs font-bold text-bl hover:underline">+ Fila Vacía</button>
                             )}
                         </div>

                         <div className="flex-1 overflow-x-auto">
                            <table className="w-full text-xs text-left">
                                <thead className="bg-s2 text-t3 font-bold uppercase tracking-wider border-b border-bd">
                                    <tr>
                                        <th className="px-4 py-3 w-32">Código</th>
                                        <th className="px-4 py-3">Descripción</th>
                                        <th className="px-4 py-3 w-32">Entrega</th>
                                        <th className="px-4 py-3 w-24 text-right">Cant.</th>
                                        <th className="px-4 py-3 w-48">Proveedor</th>
                                        <th className="px-4 py-3 w-24 text-right">Precio</th>
                                        <th className="px-4 py-3 w-24 text-right">Total</th>
                                        <th className="px-4 py-3 w-32">PO Externo</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-bd">
                                    {items.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="p-12 text-center text-t3">
                                                No hay productos en la solicitud.
                                            </td>
                                        </tr>
                                    ) : (
                                        items.map((item, idx) => (
                                            <React.Fragment key={item.id}>
                                                {item.splits.map((split, sIdx) => {
                                                    const isFirst = sIdx === 0;
                                                    const rowSpan = item.splits.length;
                                                    return (
                                                        <tr key={split.id} className="hover:bg-hv/30 group transition-colors">
                                                            {isFirst && (
                                                                <>
                                                                    <td rowSpan={rowSpan} className="px-4 py-3 align-top border-r border-bd/30 bg-sf">
                                                                        {isEditable ? (
                                                                             <ItemCodeCell 
                                                                                code={item.code} 
                                                                                products={productsSource} 
                                                                                onChange={(c, m) => handleCodeChange(item.id, c, m)} 
                                                                             />
                                                                        ) : (
                                                                            <span className="font-mono font-bold text-bl">{item.code}</span>
                                                                        )}
                                                                    </td>
                                                                    <td rowSpan={rowSpan} className="px-4 py-3 align-top border-r border-bd/30 bg-sf">
                                                                        <div className="font-bold text-tx mb-0.5">{item.desc}</div>
                                                                        <div className="text-[10px] text-t3">{item.cat} • {item.sub}</div>
                                                                    </td>
                                                                </>
                                                            )}
                                                            <td className="px-4 py-2 align-middle">
                                                                {isEditable ? (
                                                                    <DateInput value={split.date} onChange={(v: string) => updateSplitValue(item.id, split.id, 'date', v)} />
                                                                ) : (
                                                                    <span className="font-mono text-tx">{split.date}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 align-middle text-right">
                                                                {isEditable ? (
                                                                    <input 
                                                                        type="number" 
                                                                        value={split.qty} 
                                                                        onChange={e => updateSplitValue(item.id, split.id, 'qty', e.target.value)} 
                                                                        className="w-20 text-right bg-s2 border border-bd rounded-lg px-2 py-1 font-bold text-tx outline-none focus:border-bl"
                                                                    />
                                                                ) : (
                                                                    <span className="font-bold text-tx">{(split.qty || 0).toLocaleString()}</span>
                                                                )}
                                                            </td>
                                                            <td className="px-4 py-2 align-middle">
                                                                <SupplierAutocomplete 
                                                                    value={split.supplier || ""} 
                                                                    onChange={v => handleSupplierChange(item.id, split.id, v)} 
                                                                    itemCode={item.code} 
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 align-middle text-right">
                                                                <div className="relative">
                                                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-t3 text-xs">$</span>
                                                                    <input 
                                                                        type="number" 
                                                                        value={split.unitPrice || ""} 
                                                                        onChange={e => updateSplitValue(item.id, split.id, 'unitPrice', parseFloat(e.target.value))} 
                                                                        className="w-24 text-right bg-s2 border border-bd rounded-lg pl-5 pr-2 py-1 font-mono text-tx outline-none focus:border-bl"
                                                                        placeholder="0.00"
                                                                    />
                                                                </div>
                                                            </td>
                                                            <td className="px-4 py-2 align-middle text-right font-bold text-tx tabular-nums">
                                                                ${((split.qty || 0) * (split.unitPrice || 0)).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}
                                                            </td>
                                                            <td className="px-4 py-2 align-middle">
                                                                <input 
                                                                    value={split.externalPO || ""} 
                                                                    onChange={e => updateSplitValue(item.id, split.id, 'externalPO', e.target.value)} 
                                                                    className={`w-full bg-transparent border-b border-transparent hover:border-bd focus:border-bl outline-none text-xs font-mono transition-all ${!split.externalPO ? 'placeholder:text-rd/50' : 'text-bl'}`}
                                                                    placeholder="PO Pendiente"
                                                                />
                                                            </td>
                                                            <td className="px-4 py-2 align-middle text-center">
                                                                {isEditable && (
                                                                    <button 
                                                                        onClick={() => setDeleteCandidate({ itemId: item.id, splitId: split.id })}
                                                                        className="text-t3 hover:text-rd transition-colors p-1"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                    </button>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </React.Fragment>
                                        ))
                                    )}
                                </tbody>
                            </table>
                         </div>
                    </div>
                </div>
            </div>
            
            {/* MODALS */}
            <ProductCatalogModal 
                isOpen={showCatalogModal} 
                onClose={() => setShowCatalogModal(false)} 
                onAdd={handleBulkAdd} 
            />
            
            <BulkPasteModal 
                isOpen={showBulkModal} 
                onClose={() => setShowBulkModal(false)} 
                onAdd={handleBulkAdd} 
            />
            
            <Modal
                isOpen={!!deleteCandidate}
                onClose={() => setDeleteCandidate(null)}
                title="Confirmar Eliminación"
                onSave={confirmRemoveRow}
                saveLabel="Eliminar"
            >
                <p>¿Está seguro de que desea eliminar esta línea? Esta acción no se puede deshacer.</p>
            </Modal>
        </div>
    );
};
