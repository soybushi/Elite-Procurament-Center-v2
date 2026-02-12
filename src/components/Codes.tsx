
import React, { useState, useMemo } from 'react';
import { MasterProduct } from '../types';
import { csv } from '../utils/helpers';
import { SI, FS, XB, Th, Bg, Btn } from './shared/UI';
import { Lock, Tag, Box } from 'lucide-react';

interface Props {
  products: MasterProduct[];
}

export default function Codes({ products }: Props) {
  const [s, setS] = useState("");
  const [cat, setCat] = useState("");
  const [sub, setSub] = useState("");

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.cat).filter(Boolean))).sort(), [products]);
  const subcategories = useMemo(() => {
    let filtered = products;
    if (cat) filtered = filtered.filter(p => p.cat === cat);
    return Array.from(new Set(filtered.map(p => p.sb).filter(Boolean))).sort();
  }, [products, cat]);

  const filtered = useMemo(() => products.filter(p => 
    (!s || p.nm.toLowerCase().includes(s.toLowerCase()) || p.id.includes(s)) &&
    (!cat || p.cat === cat) &&
    (!sub || p.sb === sub)
  ), [products, s, cat, sub]);

  const doX = () => csv(filtered, [
      { k: "id", l: "E Code" },
      { k: "nm", l: "Descripción" },
      { k: "cat", l: "Categoría" },
      { k: "sb", l: "Subcategoría" },
      { k: "size", l: "Tamaño" }
  ], "Catalogo_Maestro_EF");

  return (
    <div className="animate-fade-in h-full flex flex-col">
      <div className="flex items-center justify-between mb-8 shrink-0">
        <div>
          <h1 className="text-2xl font-black text-tx m-0 tracking-tight flex items-center gap-3">
            <Tag className="text-bl" /> Códigos Maestros
          </h1>
          <p className="text-sm font-medium text-t2 mt-1.5 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-gn shadow-[0_0_12px_var(--gn)]"></span>
            Fuente de Verdad • {filtered.length.toLocaleString()} SKUs activos
          </p>
        </div>
        <div className="flex gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-am/5 text-am rounded-xl border border-am/10 text-xs font-bold uppercase tracking-wider">
                 <Lock size={16} /> Solo Lectura
             </div>
             <XB onClick={doX} />
        </div>
      </div>
      
      <div className="flex gap-4 mb-6 p-1 shrink-0">
        <SI value={s} onChange={setS} ph="Buscar por código o nombre..." />
        <FS value={cat} onChange={setCat} options={categories} label="Todas las Categorías" />
        <FS value={sub} onChange={setSub} options={subcategories} label="Todas las Subcategorías" />
      </div>

      <div className="bg-sf rounded-3xl overflow-hidden shadow-sm border border-bd flex-1 flex flex-col min-h-0">
        <div className="overflow-y-auto custom-scrollbar flex-1">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="sticky top-0 bg-s2/80 z-10 shadow-sm backdrop-blur-md">
              <tr>
                <Th w={120}>E Code</Th>
                <Th>Descripción del Producto</Th>
                <Th w={200}>Categoría</Th>
                <Th w={200}>Subcategoría</Th>
                <Th w={120}>Tamaño</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bd">
              {filtered.length === 0 ? (
                  <tr>
                      <td colSpan={5} className="p-16 text-center text-t3 opacity-50">
                          <div className="flex flex-col items-center justify-center gap-3">
                              <Box size={40} />
                              <p className="text-sm font-bold">No se encontraron productos</p>
                          </div>
                      </td>
                  </tr>
              ) : (
                  filtered.map((item) => (
                    <tr key={item.id} className="hover:bg-ac/30 transition-colors group h-16">
                      <td className="px-5 py-3 align-middle first:pl-8">
                          <span className="font-mono font-bold text-bl text-xs bg-bl/10 px-2.5 py-1 rounded-lg">
                              {item.id}
                          </span>
                      </td>
                      <td className="px-5 py-3 text-tx font-bold text-sm align-middle">{item.nm}</td>
                      <td className="px-5 py-3 align-middle">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${item.cat ? 'bg-s2 text-t2 border border-bd/60' : 'text-t3/40'}`}>
                             {item.cat || "—"}
                          </span>
                      </td>
                      <td className="px-5 py-3 text-t2 text-xs font-medium align-middle">{item.sb || "—"}</td>
                      <td className="px-5 py-3 text-t3 text-xs font-medium align-middle last:pr-8">{item.size || "—"}</td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-6 py-3 border-t border-bd bg-s2/30 text-[10px] text-t3 font-bold uppercase tracking-wider flex justify-between items-center shrink-0">
             <span>Mostrando {filtered.length} de {products.length} productos</span>
             <span>Sincronizado: {new Date().toLocaleDateString()}</span>
        </div>
      </div>
    </div>
  );
}
