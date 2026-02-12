
import { InventoryItem, PriceItem, HistoryItem, SupplierItem, OrderItem, MasterProduct, MasterPrice } from '../types';
import Papa from 'papaparse';

/* ═══ MASTER DATA STORAGE ═══ */
// Immutable in-memory storage after load
export let PRODUCT_MASTER: MasterProduct[] = [];
export let PRICE_BY_SUPPLIER: MasterPrice[] = [];

/* ═══ HELPERS FOR MASTER DATA ═══ */

// Get product details by code (E Code)
export const getProductByCode = (code: string): MasterProduct | undefined => {
    return PRODUCT_MASTER.find(p => String(p.id) === String(code));
};

// Get all suppliers for a specific product code
export const getSuppliersByCode = (code: string): string[] => {
    return PRICE_BY_SUPPLIER
        .filter(p => String(p.productId) === String(code))
        .map(p => p.supplier)
        .sort();
};

// Get specific price for a product from a supplier
export const getPriceBySupplier = (code: string, supplier: string): number | null => {
    const match = PRICE_BY_SUPPLIER.find(p => String(p.productId) === String(code) && p.supplier === supplier);
    return match ? match.price : null;
};

/* 
  DATA LOADER 
  Fetches master matrices from public CSV files.
  Path: /data/product_master_elite_flower.csv
  Path: /data/price_supplier_elite_flower.csv
*/

export const loadMasterData = async (): Promise<{ products: MasterProduct[], prices: MasterPrice[] }> => {
  try {
    const [prodRes, priceRes] = await Promise.all([
      fetch('data/product_master_elite_flower.csv').catch(() => null),
      fetch('data/price_supplier_elite_flower.csv').catch(() => null)
    ]);

    if (!prodRes?.ok || !priceRes?.ok) {
        // If files are missing, we just return empty, no mock data allowed.
        console.warn("CSV files not found. Starting with empty master data.");
        return { products: [], prices: [] };
    }

    const prodText = await prodRes.text();
    const priceText = await priceRes.text();

    // Helper to find the start of the data (skipping metadata lines)
    const parseWithHeaderLoc = (text: string) => {
        const lines = text.split('\n');
        const headerIndex = lines.findIndex(line => line.includes("E CODE"));
        if (headerIndex === -1) return [];
        const cleanText = lines.slice(headerIndex).join('\n');
        return Papa.parse(cleanText, { header: true, skipEmptyLines: true, dynamicTyping: false }).data;
    };

    const rawProds: any[] = parseWithHeaderLoc(prodText);
    const rawPrices: any[] = parseWithHeaderLoc(priceText);

    // 1. Build a unique lookup map by E CODE from the price list to get Category/Subcategory
    const priceMetaMap = new Map<string, { cat: string, sb: string, size: string }>();

    rawPrices.forEach((r: any) => {
        const code = r['E CODE']?.toString().trim();
        if (!code) return;

        const cat = r['CATEGORY']?.toString().trim() || '';
        const sb = r['SUB CATEGORY']?.toString().trim() || '';
        const size = r['SIZE']?.toString().trim() || '';

        // If not in map, add it. If in map, prefer non-empty values (fill gaps).
        if (!priceMetaMap.has(code)) {
            priceMetaMap.set(code, { cat, sb, size });
        } else {
            const current = priceMetaMap.get(code)!;
            if (!current.cat && cat) current.cat = cat;
            if (!current.sb && sb) current.sb = sb;
            if (!current.size && size) current.size = size;
        }
    });

    // 2. Populate PRODUCT_MASTER by merging base data with price metadata
    PRODUCT_MASTER = rawProds.map((r: any) => {
      const id = r['E CODE']?.toString().trim();
      if (!id || id === '0') return null;

      const meta = priceMetaMap.get(id);
      
      // STRICT RULE: No default strings. If missing, it's empty.
      return {
        id: id,
        nm: r['PRODUCT NAME']?.toString().trim() || '',
        cat: meta?.cat || '',
        sb: meta?.sb || '',
        size: r['SIZE']?.toString().trim() || meta?.size || ''
      };
    }).filter((p): p is MasterProduct => p !== null && p.nm !== '');

    // Remove duplicates from Product Master (by ID) just in case the source has them
    PRODUCT_MASTER = Array.from(new Map(PRODUCT_MASTER.map(item => [item.id, item])).values());

    // 3. Populate PRICE_BY_SUPPLIER (Transactional data)
    PRICE_BY_SUPPLIER = rawPrices.map((r: any) => ({
        productId: r['E CODE']?.toString().trim() || '0',
        supplier: r['PROV']?.toString().trim() || '',
        price: parseFloat(r['PRICE'] || '0'),
        updatedAt: r['UPDATE DATE'] || new Date().toISOString().split('T')[0]
    })).filter(p => p.productId !== '0' && p.price > 0);
    
    // 4. Self-healing: If items in Price List are NOT in Master, add them ONLY if we have a name.
    const masterIds = new Set(PRODUCT_MASTER.map(p => p.id));
    rawPrices.forEach((r: any) => {
         const id = r['E CODE']?.toString().trim();
         if (id && id !== '0' && !masterIds.has(id)) {
             const nm = r['PRODUCT NAME']?.toString().trim();
             if (nm) {
                 // STRICT: No semantic defaults.
                 PRODUCT_MASTER.push({
                     id: id,
                     nm: nm,
                     cat: r['CATEGORY']?.toString().trim() || '',
                     sb: r['SUB CATEGORY']?.toString().trim() || '',
                     size: r['SIZE']?.toString().trim() || ''
                 });
                 masterIds.add(id);
             }
         }
    });

    return { products: PRODUCT_MASTER, prices: PRICE_BY_SUPPLIER };
  } catch (error) {
    console.warn("Error loading data:", error);
    // On error, return empty, NEVER mock data.
    PRODUCT_MASTER = [];
    PRICE_BY_SUPPLIER = [];
    return { products: [], prices: [] };
  }
};
