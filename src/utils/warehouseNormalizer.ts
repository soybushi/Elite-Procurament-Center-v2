// Normalizador de nombres de warehouse
export function normalizeWarehouseName(input: string): string {
  if (!input || input.trim() === "") return "";
  let result = input.trim();
  result = result.toUpperCase();
  result = result.replace(/-/g, " ");
  result = result.replace(/\bELITE\b/g, "");
  result = result.replace(/\bWAREHOUSE\b/g, "");
  result = result.replace(/\s+/g, " ");
  result = result.trim();
  return result;
}
