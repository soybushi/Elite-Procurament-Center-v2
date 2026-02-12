import React, { useState, useMemo } from 'react';
import { SupplierItem } from '../types';
import { csv, parseCSV } from '../utils/helpers';
import { SI, XB, Th, Btn, Modal, Inp, IB } from './shared/UI';
import { Plus } from 'lucide-react';

interface Props {
    sup: SupplierItem[];
    setSup?: React.Dispatch<React.SetStateAction<SupplierItem[]>>; 
}

export default function SupM({ sup, setSup }: any) {
  const [s, setS] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [newSup, setNewSup] = useState({ nm: "", ct: "", ph: "", em: "" });

  const fil = useMemo(() => sup.filter((x: SupplierItem) => !s || x.nm.toLowerCase().includes(s.toLowerCase())), [sup, s]);
  
  const handleAdd = () => {
    if (!newSup.nm) return;
    if (setSup) {
        setSup((prev: SupplierItem[]) => [...prev, newSup]);
        setModalOpen(false);
        setNewSup({ nm: "", ct: "", ph: "", em: "" });
    }
  };
  
  const handleImport = (txt: string) => {
    const data = parseCSV(txt);
    const mapped = data.map((d: any) => ({
        nm: d['proveedor'] || d['nombre'] || 'Desconocido',
        ct: d['contacto'] || '',
        ph: d['telefono'] || d['phone'] || '',
        em: d['email'] || d['correo'] || ''
    })).filter((i: any) => i.nm !== 'Desconocido');
    if(setSup && mapped.length > 0) setSup((prev: any) => [...mapped, ...prev]);
  };

  const doX = () => csv(fil, [{ k: "nm", l: "Proveedor" }, { k: "ct", l: "Contacto" }, { k: "ph", l: "Telefono" }, { k: "em", l: "Email" }], "Proveedores_EF");

  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-6 mb-8 flex-wrap">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-tx m-0 tracking-tight">Proveedores</h1>
          <p className="text-sm font-medium text-t2 mt-1.5">{sup.length} socios comerciales</p>
        </div>
        <div className="flex gap-3">
            <IB onImport={handleImport} />
            <Btn variant="primary" icon={Plus} onClick={() => setModalOpen(true)}>Nuevo Proveedor</Btn>
            <XB onClick={doX} />
        </div>
      </div>
      
      <div className="mb-6 p-1">
        <SI value={s} onChange={setS} ph="Buscar proveedor..." />
      </div>

      <div className="bg-sf rounded-2xl overflow-hidden shadow-sm border border-bd/40">
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
          <table className="w-full text-sm text-left">
            <thead>
              <tr>
                <Th>Proveedor</Th>
                <Th w={200}>Contacto</Th>
                <Th w={150}>Telefono</Th>
                <Th w={250}>Email</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd/30">
              {fil.map((r: SupplierItem, i: number) => (
                <tr key={i} className="hover:bg-ac/50 transition-colors">
                  <td className="py-5 px-4 text-tx font-bold">{r.nm}</td>
                  <td className="py-5 px-4 text-t2 font-medium">{r.ct}</td>
                  <td className="py-5 px-4 text-t3 font-mono">{r.ph}</td>
                  <td className="py-5 px-4 text-bl font-medium text-xs hover:underline cursor-pointer">{r.em}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Registrar Proveedor" onSave={handleAdd}>
        <Inp label="Nombre Empresa" value={newSup.nm} onChange={(v: string) => setNewSup({...newSup, nm: v})} placeholder="Ej: Smithers Oasis" />
        <Inp label="Persona Contacto" value={newSup.ct} onChange={(v: string) => setNewSup({...newSup, ct: v})} placeholder="Nombre completo" />
        <div className="grid grid-cols-2 gap-4">
           <Inp label="Teléfono" value={newSup.ph} onChange={(v: string) => setNewSup({...newSup, ph: v})} placeholder="555-000-0000" />
           <Inp label="Email" value={newSup.em} onChange={(v: string) => setNewSup({...newSup, em: v})} placeholder="contacto@empresa.com" />
        </div>
      </Modal>
    </div>
  );
}