import * as XLSX from 'xlsx';

export function exportarExcel(
  filas: Record<string, any>[],
  nombreHoja: string,
  nombreArchivo: string
) {
  const ws = XLSX.utils.json_to_sheet(filas);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, nombreHoja);
  XLSX.writeFile(wb, `${nombreArchivo}.xlsx`);
}
