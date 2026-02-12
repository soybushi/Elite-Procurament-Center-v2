import React, { useState, useMemo } from 'react';
import { OrderItem } from '../types';
import { csv, parseCSV } from '../utils/helpers';
import { SI, FS, XB, Th, St, Btn, Modal, Inp, IB, EC } from './shared/UI';
import { Plus } from 'lucide-react';

export default function OrdM({ ord, setOrd }: any) {
  const [s, setS] = useState(""); 
  const [sf, setSf] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newOrd, setNewOrd] = useState({ sp: "", po: "", dl: "", pr: "", qo: "", tt: "", wh: "" });
  
  const sps = useMemo(() => [...new Set(ord.map((o: OrderItem) => o.sp))].sort() as string[], [ord]);
  const fil = useMemo(() => ord.filter((o: OrderItem) => 
    (!s || o.pr.toLowerCase().includes(s.toLowerCase())) && 
    (!sf || o.sp === sf)
  ), [ord, s, sf]);
  
  const pU = fil.reduce((a: number, o: OrderItem) => a + o.pn, 0); 
  const tV = fil.reduce((a: number, o: OrderItem) => a + o.tt, 0);

  const handleAdd = () => {
    if (!newOrd.sp || !newOrd.pr) return;
    if (setOrd) {
        const qty = Number(newOrd.qo) || 0;
        const total = Number(newOrd.tt) || 0;
        setOrd((prev: OrderItem[]) => [{
            sp: newOrd.sp,
            po: newOrd.po || "PO-" + Math.floor(Math.random() * 10000),
            dl: newOrd.dl,
            pr: newOrd.pr,
            qo: qty,
            tt: total,
            qr: 0,
            pn: qty,
            wh: newOrd.wh || "ELITE MIAMI"
        }, ...prev]);
        setModalOpen(false);
        setNewOrd({ sp: "", po: "", dl: "", pr: "", qo: "", tt: "", wh: "" });
    }
  };

  const handleImport = (txt: string) => {
    const data = parseCSV(txt);
    const mapped = data.map((d: any) => {
        const qty = parseFloat(d['ordenado'] || d['qty'] || '0');
        return {
            sp: d['proveedor'] || 'GENERIC',
            po: d['po'] || "PO-" + Math.floor(Math.random() * 10000),
            dl: d['entrega'] || d['delivery'] || '',
            pr: d['producto'] || d['item'] || 'Item',
            qo: qty,
            qr: parseFloat(d['recibido'] || '0'),
            pn: parseFloat(d['pendiente'] || String(qty)),
            tt: parseFloat(d['total'] || '0'),
            wh: d['bodega'] || 'ELITE MIAMI'
        };
    });
    if(setOrd && mapped.length > 0) setOrd((prev: any) => [...mapped, ...prev]);
  };

  const doX = () => csv(fil, 
    [{ k: "sp", l: "Proveedor" }, { k: "po", l: "PO" }, { k: "dl", l: "Entrega" }, { k: "pr", l: "Producto" }, { k: "qo", l: "Qty Orig" }, { k: "pn", l: "Pendiente" }, { k: "tt", l: "Total" }], 
    "Ordenes_Abiertas");

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-6 mb-8 flex-wrap">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tx m-0 tracking-tight">Órdenes Abiertas</h1>
          <p className="text-sm font-medium text-t2 mt-1.5 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-tx/30"></span>
            {fil.length} órdenes activas
          </p>
        </div>
        <div className="flex gap-3">
           <IB onImport={handleImport} />
           <Btn variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Nueva Orden</Btn>
           <XB onClick={doX} />
        </div>
      </div>
      
      <div className="flex gap-3 mb-6 flex-wrap p-1">
        <SI value={s} onChange={setS} ph="Buscar producto..." />
        <FS value={sf} onChange={setSf} options={sps} label="Proveedor" />
      </div>

      <div className="bg-sf rounded-2xl overflow-hidden shadow-sm border border-bd/40">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <Th>PO</Th>
                <Th>Proveedor</Th>
                <Th>Entrega</Th>
                <Th>Producto</Th>
                <Th a="right">Ordenado</Th>
                <Th a="right">Pendiente</Th>
                <Th a="right">Total</Th>
                <Th>Bodega</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd/30">
              {fil.map((o: OrderItem, i: number) => (
                <tr key={i} className="hover:bg-ac/50 transition-colors">
                  <td className="py-4 px-4 text-bl font-bold text-sm">{o.po}</td>
                  <td className="py-4 px-4 text-tx font-bold text-sm">{o.sp}</td>
                  <td className="py-4 px-4 text-t3 text-sm font-mono">{o.dl}</td>
                  <td className="py-4 px-4 text-t2 text-sm max-w-[200px] truncate">{o.pr}</td>
                  <td className="py-4 px-4 text-right text-tx font-bold text-sm">{o.qo.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right text-am font-bold text-sm">{o.pn.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right text-t3 text-sm font-mono">${o.tt.toLocaleString()}</td>
                  <td className="py-4 px-4 text-t3 text-xs uppercase">{o.wh}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Nueva Orden de Compra" onSave={handleAdd}>
        <Inp label="Proveedor" value={newOrd.sp} onChange={(v: string) => setNewOrd({...newOrd, sp: v})} />
        <div className="grid grid-cols-2 gap-4">
           <Inp label="PO #" value={newOrd.po} onChange={(v: string) => setNewOrd({...newOrd, po: v})} placeholder="Auto" />
           <Inp label="Entrega" type="date" value={newOrd.dl} onChange={(v: string) => setNewOrd({...newOrd, dl: v})} />
        </div>
        <Inp label="Producto" value={newOrd.pr} onChange={(v: string) => setNewOrd({...newOrd, pr: v})} />
        <div className="grid grid-cols-2 gap-4">
           <Inp label="Cantidad" type="number" value={newOrd.qo} onChange={(v: string) => setNewOrd({...newOrd, qo: v})} />
           <Inp label="Total ($)" type="number" value={newOrd.tt} onChange={(v: string) => setNewOrd({...newOrd, tt: v})} />
        </div>
        <Inp label="Bodega" value={newOrd.wh} onChange={(v: string) => setNewOrd({...newOrd, wh: v})} />
      </Modal>
    </div>
  );
}