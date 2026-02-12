
import React, { useState, useMemo } from 'react';
import { HistoryItem } from '../types';
import { csv } from '../utils/helpers';
import { Search, Filter, Download, Eye, Calendar, ArrowUpRight, ArrowDownLeft, FileText, Truck, ArrowRightLeft, X, ChevronDown, CheckCircle2 } from 'lucide-react';
import { Modal, Btn, FS } from './shared/UI';

interface Props {
  hist: HistoryItem[];
}

type TabType = 'general' | 'movements' | 'orders' | 'transfers';

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'general', label: 'General', icon: FileText },
  { id: 'movements', label: 'Movimientos', icon: ArrowRightLeft },
  { id: 'orders', label: 'Órdenes de Compra', icon: FileText }, // Using FileText for POs
  { id: 'transfers', label: 'Transferencias', icon: Truck },
];

export default function History({ hist }: Props) {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const [search, setSearch] = useState("");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [selWh, setSelWh] = useState("");
  const [selUser, setSelUser] = useState("");
  
  const [selectedEvent, setSelectedEvent] = useState<HistoryItem[] | null>(null);

  // --- 1. Data Grouping (Immutable Source of Truth) ---
  const events = useMemo(() => {
    const groups: Record<string, HistoryItem[]> = {};
    // Group by PO/Reference. If no PO, we might group by timestamp+type or treat as singletons.
    // Assuming strictly that 'po' is the Reference ID for an event.
    hist.forEach(item => {
        const key = item.po || `UNKNOWN-${item.dt}-${item.pr}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
    });
    
    // Sort events by date descending (newest first)
    return Object.values(groups).sort((a, b) => {
        const dateA = new Date(a[0].dt).getTime();
        const dateB = new Date(b[0].dt).getTime();
        return dateB - dateA;
    });
  }, [hist]);

  // --- 2. Derived Lists for Filters ---
  const warehouses = useMemo(() => Array.from(new Set(hist.map(h => h.wh).filter(Boolean))).sort(), [hist]);
  const users = useMemo(() => {
     // In many systems 'sp' holds the User or Supplier. For Movements/Transfers it might be the user or source.
     // We'll collect unique 'sp' values as potential users/sources for the filter.
     return Array.from(new Set(hist.map(h => h.sp).filter(Boolean))).sort();
  }, [hist]);

  // --- 3. Filtering Logic ---
  const filteredEvents = useMemo(() => {
    return events.filter(group => {
       const head = group[0]; // Representative item for header info
       const ref = head.po.toLowerCase();
       
       // Tab Specific Logic
       // FIX: Ensure prefixes match lowercase ref
       if (activeTab === 'movements') {
           if (!ref.startsWith('in-') && !ref.startsWith('out-') && !head.sp.toLowerCase().includes('manual')) return false;
       }
       if (activeTab === 'orders') {
           if (!ref.startsWith('po-') && !ref.startsWith('req-')) return false;
       }
       if (activeTab === 'transfers') {
           if (!ref.startsWith('tr-')) return false;
       }

       // Global Filters
       if (selWh && head.wh.toLowerCase() !== selWh.toLowerCase()) return false;
       
       if (search) {
           const s = search.toLowerCase();
           const matchesRef = ref.includes(s);
           const matchesItem = group.some(i => i.pr.toLowerCase().includes(s) || String(i.pr).toLowerCase().includes(s)); // pr is Product Code/Name
           if (!matchesRef && !matchesItem) return false;
       }

       if (dateStart && head.dt < dateStart) return false;
       if (dateEnd && head.dt > dateEnd) return false;

       if (selUser && head.sp !== selUser) return false;

       return true;
    });
  }, [events, activeTab, search, dateStart, dateEnd, selWh, selUser]);

  // --- 4. Helpers ---
  const getEventType = (ref: string, sp: string) => {
      const r = ref.toUpperCase();
      if (r.startsWith('IN-')) return { label: 'Entrada', color: 'text-gn bg-gn/10', icon: ArrowDownLeft };
      if (r.startsWith('OUT-')) return { label: 'Salida', color: 'text-rd bg-rd/10', icon: ArrowUpRight };
      if (r.startsWith('TR-')) return { label: 'Transferencia', color: 'text-cy bg-cy/10', icon: Truck };
      if (r.startsWith('PO-')) return { label: 'Orden Compra', color: 'text-bl bg-bl/10', icon: FileText };
      return { label: 'Registro', color: 'text-t2 bg-s2', icon: FileText };
  };

  const calculateTotal = (group: HistoryItem[]) => group.reduce((sum, i) => sum + (i.tt || 0), 0);
  const calculateQty = (group: HistoryItem[]) => group.reduce((sum, i) => sum + (i.qt || 0), 0);

  const handleExport = () => {
     // Export flattened data
     const flatData = filteredEvents.flatMap(g => g);
     csv(flatData, [
         {k: 'po', l: 'Referencia'},
         {k: 'dt', l: 'Fecha'},
         {k: 'wh', l: 'Bodega'},
         {k: 'sp', l: 'Usuario/Prov'},
         {k: 'pr', l: 'Producto'},
         {k: 'qt', l: 'Cantidad'},
         {k: 'up', l: 'Precio Unit'},
         {k: 'tt', l: 'Total'}
     ], `Historial_${activeTab}_${new Date().toISOString().split('T')[0]}`);
  };

  // --- 5. Renderers ---

  return (
    <div className="flex flex-col h-full animate-fade-in bg-bg">
      {/* 1) Fixed Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6 shrink-0">
        <div>
           <h1 className="text-2xl font-black text-tx tracking-tight">Historial</h1>
           <p className="text-sm font-medium text-t2 mt-1 flex items-center gap-2">
             <span className="w-2 h-2 rounded-full bg-bl shadow-[0_0_8px_var(--bl)]"></span>
             Registro inmutable del sistema
           </p>
        </div>
        <div className="flex gap-3">
             <button 
                onClick={handleExport}
                className="px-4 py-2 bg-sf border border-bd rounded-xl text-xs font-bold text-tx hover:bg-s2 transition-all flex items-center gap-2 shadow-sm"
             >
                <Download size={16} /> Exportar Vista
             </button>
        </div>
      </div>

      {/* 2) Tabs & Filters Container */}
      <div className="bg-sf rounded-3xl border border-bd shadow-sm flex flex-col overflow-hidden mb-6 shrink-0">
          
          {/* Tabs */}
          <div className="flex border-b border-bd/60 px-2 overflow-x-auto">
             {TABS.map(t => {
                 const isActive = activeTab === t.id;
                 const Icon = t.icon;
                 return (
                     <button
                        key={t.id}
                        onClick={() => setActiveTab(t.id)}
                        className={`px-6 py-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all relative ${isActive ? 'text-bl' : 'text-t3 hover:text-tx'}`}
                     >
                        <Icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                        {t.label}
                        {isActive && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-bl rounded-t-full"></div>}
                     </button>
                 );
             })}
          </div>

          {/* Global Filters */}
          <div className="p-4 bg-s2/50 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-t3 w-4 h-4 group-focus-within:text-bl transition-colors" />
                  <input 
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar Ref, Código, Desc..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-sf border border-bd text-xs font-bold text-tx outline-none focus:border-bl focus:ring-2 focus:ring-bl/10 transition-all shadow-sm placeholder:font-medium"
                  />
              </div>
              <div className="relative">
                  <select 
                    value={selWh} 
                    onChange={e => setSelWh(e.target.value)}
                    className={`w-full pl-4 pr-10 py-2.5 rounded-xl bg-sf border border-bd text-xs font-bold outline-none focus:border-bl focus:ring-2 focus:ring-bl/10 transition-all shadow-sm cursor-pointer appearance-none ${selWh ? 'text-tx' : 'text-t3'}`}
                  >
                      <option value="">Todas las Bodegas</option>
                      {warehouses.map(w => <option key={w} value={w} className="text-tx">{w}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-t3 pointer-events-none" size={14} />
              </div>
              <div className="flex gap-2">
                  <input 
                    type="date" 
                    value={dateStart}
                    onChange={e => setDateStart(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl bg-sf border border-bd text-xs font-bold outline-none focus:border-bl focus:ring-2 focus:ring-bl/10 transition-all shadow-sm uppercase ${dateStart ? 'text-tx' : 'text-t3'}`}
                  />
                  <input 
                    type="date" 
                    value={dateEnd}
                    onChange={e => setDateEnd(e.target.value)}
                    className={`w-full px-3 py-2.5 rounded-xl bg-sf border border-bd text-xs font-bold outline-none focus:border-bl focus:ring-2 focus:ring-bl/10 transition-all shadow-sm uppercase ${dateEnd ? 'text-tx' : 'text-t3'}`}
                  />
              </div>
              <div className="relative">
                  <select 
                    value={selUser} 
                    onChange={e => setSelUser(e.target.value)}
                    className={`w-full pl-4 pr-10 py-2.5 rounded-xl bg-sf border border-bd text-xs font-bold outline-none focus:border-bl focus:ring-2 focus:ring-bl/10 transition-all shadow-sm cursor-pointer appearance-none ${selUser ? 'text-tx' : 'text-t3'}`}
                  >
                      <option value="">Todos los Usuarios/Prov</option>
                      {users.map(u => <option key={u} value={u} className="text-tx">{u}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-t3 pointer-events-none" size={14} />
              </div>
          </div>
      </div>

      {/* 3) Data Table (Context Aware) */}
      <div className="flex-1 bg-sf rounded-3xl border border-bd shadow-sm overflow-hidden flex flex-col min-h-0 relative">
          <div className="overflow-auto custom-scrollbar flex-1">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-s2 sticky top-0 z-10 text-[10px] font-black uppercase tracking-widest text-t3 border-b border-bd">
                      <tr>
                          {activeTab === 'general' && (
                              <>
                                <th className="px-6 py-4 w-40">Fecha/Hora</th>
                                <th className="px-6 py-4 w-32">Tipo</th>
                                <th className="px-6 py-4 w-40">Referencia</th>
                                <th className="px-6 py-4 w-48">Bodega</th>
                                <th className="px-6 py-4">Usuario/Origen</th>
                                <th className="px-6 py-4">Resumen</th>
                                <th className="px-6 py-4 text-right">Impacto</th>
                                <th className="px-6 py-4 w-20 text-center">Detalle</th>
                              </>
                          )}
                          {activeTab === 'movements' && (
                              <>
                                <th className="px-6 py-4 w-40">Referencia</th>
                                <th className="px-6 py-4 w-32">Tipo</th>
                                <th className="px-6 py-4 w-40">Fecha/Hora</th>
                                <th className="px-6 py-4 w-48">Bodega</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Ítems</th>
                                <th className="px-6 py-4 text-right">Impacto QTY</th>
                                <th className="px-6 py-4 text-right">Valor Total</th>
                                <th className="px-6 py-4 w-20 text-center">Detalle</th>
                              </>
                          )}
                          {activeTab === 'orders' && (
                              <>
                                <th className="px-6 py-4 w-40">PO/Referencia</th>
                                <th className="px-6 py-4 w-40">Fecha</th>
                                <th className="px-6 py-4 w-48">Site/Bodega</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Proveedor</th>
                                <th className="px-6 py-4 text-right">Total</th>
                                <th className="px-6 py-4 w-32 text-center">Estado</th>
                                <th className="px-6 py-4 w-20 text-center">Detalle</th>
                              </>
                          )}
                          {activeTab === 'transfers' && (
                              <>
                                <th className="px-6 py-4 w-40">Referencia</th>
                                <th className="px-6 py-4 w-40">Fecha</th>
                                <th className="px-6 py-4 w-48">Origen</th>
                                <th className="px-6 py-4 w-48">Destino</th>
                                <th className="px-6 py-4">Usuario</th>
                                <th className="px-6 py-4">Ítems</th>
                                <th className="px-6 py-4 text-right">Impacto QTY</th>
                                <th className="px-6 py-4 w-32 text-center">Estado</th>
                                <th className="px-6 py-4 w-20 text-center">Detalle</th>
                              </>
                          )}
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-bd">
                      {filteredEvents.length === 0 ? (
                          <tr>
                              <td colSpan={10} className="p-20 text-center opacity-40">
                                  <div className="flex flex-col items-center gap-3">
                                      <Filter size={40} className="text-t3" />
                                      <span className="text-sm font-bold text-t3">No se encontraron registros</span>
                                  </div>
                              </td>
                          </tr>
                      ) : filteredEvents.map((group, idx) => {
                          const head = group[0];
                          const typeInfo = getEventType(head.po, head.sp);
                          const totalVal = calculateTotal(group);
                          const totalQty = calculateQty(group);
                          
                          // Shared Row Style
                          const rowClass = "hover:bg-s2/40 transition-colors group text-xs font-medium text-tx border-b border-bd/40";
                          const TypeBadge = () => (
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border border-current/10 ${typeInfo.color}`}>
                                  <typeInfo.icon size={12} /> {typeInfo.label}
                              </span>
                          );

                          return (
                             <tr key={head.po + idx} className={rowClass}>
                                 {/* --- GENERAL TAB --- */}
                                 {activeTab === 'general' && (
                                     <>
                                        <td className="px-6 py-4 text-t3 font-mono">{head.dt}</td>
                                        <td className="px-6 py-4"><TypeBadge /></td>
                                        <td className="px-6 py-4 font-bold font-mono text-bl">{head.po}</td>
                                        <td className="px-6 py-4 text-t2">{head.wh}</td>
                                        <td className="px-6 py-4 text-t2 truncate max-w-[200px]">{head.sp || "-"}</td>
                                        <td className="px-6 py-4 truncate max-w-[200px]">
                                            {group.length > 1 ? `${group.length} Ítems` : head.pr}
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold">
                                            {typeInfo.label === 'Orden Compra' ? `$${totalVal.toLocaleString()}` : totalQty.toLocaleString()}
                                        </td>
                                     </>
                                 )}

                                 {/* --- MOVEMENTS TAB --- */}
                                 {activeTab === 'movements' && (
                                     <>
                                        <td className="px-6 py-4 font-bold font-mono text-bl">{head.po}</td>
                                        <td className="px-6 py-4"><TypeBadge /></td>
                                        <td className="px-6 py-4 text-t3 font-mono">{head.dt}</td>
                                        <td className="px-6 py-4 text-t2">{head.wh}</td>
                                        <td className="px-6 py-4 text-t2">{head.sp || "-"}</td>
                                        <td className="px-6 py-4">{group.length > 1 ? `${group.length} Items (Var)` : head.pr}</td>
                                        <td className={`px-6 py-4 text-right font-bold ${totalQty > 0 ? 'text-gn' : 'text-rd'}`}>
                                            {totalQty > 0 ? '+' : ''}{totalQty.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right tabular-nums">
                                            {totalVal ? `$${totalVal.toLocaleString()}` : <span className="text-t3/40">-</span>}
                                        </td>
                                     </>
                                 )}

                                 {/* --- ORDERS TAB --- */}
                                 {activeTab === 'orders' && (
                                     <>
                                        <td className="px-6 py-4 font-bold font-mono text-bl">{head.po}</td>
                                        <td className="px-6 py-4 text-t3 font-mono">{head.dt}</td>
                                        <td className="px-6 py-4 text-t2">{head.wh}</td>
                                        <td className="px-6 py-4 text-t3 italic">--</td>
                                        <td className="px-6 py-4 font-bold text-tx">{head.sp}</td>
                                        <td className="px-6 py-4 text-right font-bold text-tx">${totalVal.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-gn bg-gn/10 px-2 py-0.5 rounded border border-gn/20">Confirmada</span>
                                        </td>
                                     </>
                                 )}

                                 {/* --- TRANSFERS TAB --- */}
                                 {activeTab === 'transfers' && (
                                     <>
                                        <td className="px-6 py-4 font-bold font-mono text-bl">{head.po}</td>
                                        <td className="px-6 py-4 text-t3 font-mono">{head.dt}</td>
                                        <td className="px-6 py-4 text-t2">{head.wh}</td>
                                        <td className="px-6 py-4 text-t2">--</td>
                                        <td className="px-6 py-4 text-t2">{head.sp}</td>
                                        <td className="px-6 py-4">{group.length > 1 ? `${group.length} Items` : head.pr}</td>
                                        <td className="px-6 py-4 text-right font-bold text-tx">{totalQty.toLocaleString()}</td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-bl bg-bl/10 px-2 py-0.5 rounded border border-bl/20">Completada</span>
                                        </td>
                                     </>
                                 )}

                                 <td className="px-6 py-4 text-center">
                                     <button 
                                        onClick={() => setSelectedEvent(group)}
                                        className="p-1.5 text-t3 hover:text-bl hover:bg-bl/10 rounded-lg transition-all"
                                        title="Ver Detalle"
                                     >
                                         <Eye size={16} />
                                     </button>
                                 </td>
                             </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
          <div className="bg-s2/50 border-t border-bd px-6 py-3 text-[10px] font-bold text-t3 uppercase tracking-wider flex justify-between shrink-0">
             <span>Registros Visualizados: {filteredEvents.length}</span>
             <span>Total Histórico: {events.length}</span>
          </div>
      </div>

      {/* 4) Detail Modal (Strict Read-Only) */}
      <Modal isOpen={!!selectedEvent} onClose={() => setSelectedEvent(null)} title="Detalle de Registro" saveLabel="Cerrar" onSave={() => setSelectedEvent(null)}>
         {selectedEvent && (
             <div className="space-y-6">
                 {/* Detail Header */}
                 <div className="bg-s2/50 p-4 rounded-2xl border border-bd/60 grid grid-cols-2 gap-4">
                     <div>
                         <label className="text-[10px] font-black text-t3 uppercase tracking-widest mb-1 block">Referencia</label>
                         <div className="text-sm font-bold text-bl font-mono">{selectedEvent[0].po}</div>
                     </div>
                     <div>
                         <label className="text-[10px] font-black text-t3 uppercase tracking-widest mb-1 block">Fecha / Hora</label>
                         <div className="text-sm font-medium text-tx">{selectedEvent[0].dt}</div>
                     </div>
                     <div>
                         <label className="text-[10px] font-black text-t3 uppercase tracking-widest mb-1 block">Bodega / Site</label>
                         <div className="text-sm font-medium text-tx">{selectedEvent[0].wh}</div>
                     </div>
                     <div>
                         <label className="text-[10px] font-black text-t3 uppercase tracking-widest mb-1 block">Usuario / Origen</label>
                         <div className="text-sm font-medium text-tx">{selectedEvent[0].sp || "Sistema"}</div>
                     </div>
                 </div>

                 {/* Detail Lines */}
                 <div className="border border-bd rounded-2xl overflow-hidden">
                     <table className="w-full text-xs text-left">
                         <thead className="bg-s2 text-t3 font-bold uppercase tracking-wider border-b border-bd">
                             <tr>
                                 <th className="px-4 py-3">Producto</th>
                                 <th className="px-4 py-3 text-right">Cantidad</th>
                                 <th className="px-4 py-3 text-right">Valor Unit.</th>
                                 <th className="px-4 py-3 text-right">Total</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-bd/50 bg-sf">
                             {selectedEvent.map((line, i) => (
                                 <tr key={i} className="hover:bg-ac/10">
                                     <td className="px-4 py-3 font-medium text-tx">{line.pr}</td>
                                     <td className="px-4 py-3 text-right font-bold">{line.qt.toLocaleString()}</td>
                                     <td className="px-4 py-3 text-right tabular-nums text-t2">
                                         {line.up ? `$${line.up.toLocaleString()}` : '-'}
                                     </td>
                                     <td className="px-4 py-3 text-right font-bold tabular-nums">
                                         {line.tt ? `$${line.tt.toLocaleString()}` : '-'}
                                     </td>
                                 </tr>
                             ))}
                         </tbody>
                         <tfoot className="bg-s2/30 font-bold border-t border-bd">
                             <tr>
                                 <td className="px-4 py-3 text-right">TOTALES</td>
                                 <td className="px-4 py-3 text-right">{calculateQty(selectedEvent).toLocaleString()}</td>
                                 <td></td>
                                 <td className="px-4 py-3 text-right text-bl">
                                     ${calculateTotal(selectedEvent).toLocaleString()}
                                 </td>
                             </tr>
                         </tfoot>
                     </table>
                 </div>
                 
                 <div className="flex items-center gap-2 text-xs text-t3 bg-blue-50/50 p-3 rounded-xl border border-blue-100">
                     <CheckCircle2 size={14} className="text-blue-500" />
                     Registro auditado y confirmado por el sistema. No editable.
                 </div>
             </div>
         )}
      </Modal>
    </div>
  );
}
