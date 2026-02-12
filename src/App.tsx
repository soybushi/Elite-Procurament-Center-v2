
import React, { useState, useEffect } from 'react';
import Nav from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Prices from './components/Prices';
import Codes from './components/Codes';
import History from './components/History';
import PurchaseOrders, { ExternalOrderForm } from './components/PurchaseOrders';
import TrM from './components/Transfers';
import SupM from './components/Suppliers';
import AgM from './components/Agents';
import SetM from './components/Settings';
import { loadMasterData } from './utils/data';
import { InventoryItem, PriceItem, TransferItem, HistoryItem, SupplierItem, OrderItem, PurchaseRequest, MasterProduct } from './types';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function App() {
  const [theme, setTheme] = useState("light");
  const [pg, setPg] = useState("dash");
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Data States - Initialized with localStorage persistence
  const [whs, setWhs] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('ef-whs');
      return saved ? JSON.parse(saved) : [
        "BAY STATE", 
        "ELITE CALIFORNIA", 
        "ELITE HARDGOODS MIAMI", 
        "ELITE LEBANON TN", 
        "ELITE MIAMI", 
        "ELITE NEW JERSEY", 
        "ELITE TEXAS", 
        "ELITE USA BQT IL", 
        "ELITE WASHINGTON", 
        "ELITE MIAMI - SNB", 
        "ELITE MIAMI 120", 
        "ELITE MIAMI 250", 
        "ELITE MIAMI 280", 
        "ELITE MIAMI 290", 
        "ELITE MIAMI 340", 
        "ELITE MIAMI 725", 
        "ELITE MIAMI SHIPPING", 
        "ELITE MIAMI SISTER CO.", 
        "ELITE MIAMI CAFETERÍA", 
        "USA BQT MIAMI", 
        "ELITE HARDGOODS 290"
      ].sort();
    } catch (e) { 
      console.error("Failed to load whs", e); 
      return []; 
    }
  });
  
  const [inv, setInv] = useState<InventoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ef-inv');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { console.error("Failed to load inv", e); return []; }
  });

  const [prc, setPrc] = useState<PriceItem[]>([]);
  const [masterProducts, setMasterProducts] = useState<MasterProduct[]>([]);
  
  const [hist, setHist] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem('ef-hist');
      return saved ? JSON.parse(saved) : [];
    } catch (e) { console.error("Failed to load hist", e); return []; }
  });

  const [sup, setSup] = useState<SupplierItem[]>([]);
  const [ord, setOrd] = useState<OrderItem[]>([]);
  const [tr, setTr] = useState<TransferItem[]>([]);
  
  const [reqs, setReqs] = useState<PurchaseRequest[]>(() => {
    try {
      const saved = localStorage.getItem('ef-reqs');
      if (saved) return JSON.parse(saved);
    } catch (e) { console.error("Failed to load reqs", e); }
    return [];
  });

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('ef-whs', JSON.stringify(whs));
  }, [whs]);

  useEffect(() => {
    localStorage.setItem('ef-reqs', JSON.stringify(reqs));
  }, [reqs]);

  useEffect(() => {
    localStorage.setItem('ef-inv', JSON.stringify(inv));
  }, [inv]);

  useEffect(() => {
    localStorage.setItem('ef-hist', JSON.stringify(hist));
  }, [hist]);

  const aTr = tr.filter(x => x.st !== "received").length;

  const [externalReq, setExternalReq] = useState<PurchaseRequest | null>(null);

  // Load Master Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const data = await loadMasterData();
      setMasterProducts(data.products || []);
      
      // Hydrate Prices from CSV (merged with PriceItem type) if available
      if (data.prices && data.prices.length > 0) {
        const pricesForView: PriceItem[] = data.prices.map(mp => {
           const product = data.products.find(p => p.id === mp.productId);
           return {
              id: mp.productId,
              pr: mp.price,
              dt: mp.updatedAt,
              nm: product ? product.nm : '',
              sp: mp.supplier,
              sb: product ? product.sb : '',
              da: 0,
              fr: 'fresh'
           };
        });
        setPrc(pricesForView);
      } else {
        setPrc([]);
      }

      setLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reqId = params.get('reqId');
    const token = params.get('token');

    if (reqId && token) {
      const found = reqs.find(r => r.id === reqId && r.token === token);
      if (found) {
        setExternalReq(found);
      }
    }
  }, [reqs]);

  const handleExternalSubmit = (updatedReq: PurchaseRequest) => {
     setReqs(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
     setExternalReq(updatedReq);
  };

  if (loading) {
     return (
        <div className="h-screen w-screen flex items-center justify-center bg-bg text-t2 flex-col gap-4">
           <Loader2 size={40} className="animate-spin text-bl" />
           <p className="text-sm font-bold">Cargando Sistema...</p>
        </div>
     );
  }

  if (externalReq) {
    return (
      <ExternalOrderForm 
        req={externalReq} 
        onSave={handleExternalSubmit} 
        inv={inv} 
      />
    );
  }

  const render = () => {
    switch (pg) {
      case "dash": return <Dashboard inv={inv} tr={tr} prc={prc} hist={hist} ord={ord} whs={whs} />;
      case "codes": return <Codes products={masterProducts} />;
      case "inv": return <Inventory inv={inv} setInv={setInv} whs={whs} prc={prc} setHist={setHist} />;
      case "prc": return <Prices prc={prc} setPrc={setPrc} />;
      case "his": return <History hist={hist} />;
      case "ord": return <PurchaseOrders ord={ord} setOrd={setOrd} reqs={reqs} setReqs={setReqs} inv={inv} whs={whs} hist={hist} sup={sup} prc={prc} masterProducts={masterProducts} />;
      case "trn": return <TrM tr={tr} setTr={setTr} whs={whs} />;
      case "sup": return <SupM sup={sup} setSup={setSup} />;
      case "agt": return <AgM />;
      case "set": return <SetM whs={whs} setWhs={setWhs} theme={theme} setTheme={setTheme} />;
      default: return null;
    }
  };

  return (
    <>
      <div className="h-screen w-screen flex bg-bg font-sans text-tx overflow-hidden selection:bg-bl/20 selection:text-bl">
        
        <div className={`h-full shrink-0 transition-all duration-300 overflow-hidden ${sidebarOpen ? "w-[280px]" : "w-[88px]"}`}>
             <Nav act={pg} go={setPg} trc={aTr} theme={theme} setTheme={setTheme} isOpen={sidebarOpen} />
        </div>

        <div className="flex-1 relative flex flex-col min-w-0">
          
          <button 
             onClick={() => setSidebarOpen(!sidebarOpen)}
             className="absolute top-1/2 -translate-y-1/2 z-50 bg-sf border border-bd shadow-[0_2px_8px_rgba(0,0,0,0.08)] text-t3 hover:text-bl hover:border-bl/50 transition-all duration-300 flex items-center justify-center group -left-3 w-6 h-6 rounded-full"
             title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
          >
             {sidebarOpen ? <ChevronLeft size={14} strokeWidth={3} className="group-hover:scale-110 transition-transform" /> : <ChevronRight size={14} strokeWidth={3} className="group-hover:scale-110 transition-transform" />}
          </button>

          <div className="flex-1 overflow-y-auto scroll-smooth">
             <div className="max-w-[1600px] mx-auto p-6 lg:p-10">
               {render()}
             </div>
          </div>
        </div>
      </div>
    </>
  );
}
