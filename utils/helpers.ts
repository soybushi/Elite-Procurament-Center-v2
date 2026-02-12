
import Papa from 'papaparse';

export function csv(data: any[], cols: {k: string, l: string}[], fn: string) {
  const h = cols.map(c => c.l).join(",");
  const rows = data.map(row => cols.map(c => {
    const v = row[c.k]; 
    return typeof v === "string" && (v.includes(",") || v.includes('"')) 
      ? '"' + v.replace(/"/g, '""') + '"' 
      : (v ?? "");
  }).join(","));
  const blob = new Blob(["\uFEFF" + h + "\n" + rows.join("\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a"); 
  a.href = URL.createObjectURL(blob); 
  a.download = fn + ".csv"; 
  a.click();
}

export function parseCSV(txt: string) {
  if (!txt) return [];

  // Auto-detect delimiter based on first line content
  const firstLine = txt.split('\n').find(l => l.trim().length > 0) || "";
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  const delimiter = semiCount > commaCount ? ';' : ',';

  const results = Papa.parse(txt, {
    header: true,
    skipEmptyLines: true,
    delimiter: delimiter,
    transformHeader: (h: string) => h.trim().replace(/^"|"$/g, '').toLowerCase()
  });

  return results.data;
}
