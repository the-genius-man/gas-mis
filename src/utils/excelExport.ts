import * as XLSX from 'xlsx';

/**
 * Export data to Excel file
 * @param data - Array of objects to export
 * @param filename - Name of the file (without extension)
 * @param sheetName - Name of the worksheet
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string = 'export',
  sheetName: string = 'Sheet1'
): void {
  if (!data || data.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Convert data to worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const maxWidth = 50;
    const colWidths = Object.keys(data[0]).map(key => {
      const maxLength = Math.max(
        key.length,
        ...data.map(row => String(row[key] || '').length)
      );
      return { wch: Math.min(maxLength + 2, maxWidth) };
    });
    worksheet['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fullFilename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Erreur lors de l\'export Excel');
  }
}

/**
 * Export multiple sheets to a single Excel file
 * @param sheets - Array of sheet data with name and data
 * @param filename - Name of the file (without extension)
 */
export function exportMultipleSheetsToExcel(
  sheets: Array<{ name: string; data: Record<string, any>[] }>,
  filename: string = 'export'
): void {
  if (!sheets || sheets.length === 0) {
    alert('Aucune donnée à exporter');
    return;
  }

  try {
    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Add each sheet
    sheets.forEach(sheet => {
      if (sheet.data && sheet.data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(sheet.data);

        // Auto-size columns
        const maxWidth = 50;
        const colWidths = Object.keys(sheet.data[0]).map(key => {
          const maxLength = Math.max(
            key.length,
            ...sheet.data.map(row => String(row[key] || '').length)
          );
          return { wch: Math.min(maxLength + 2, maxWidth) };
        });
        worksheet['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name);
      }
    });

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fullFilename = `${filename}_${timestamp}.xlsx`;

    // Write file
    XLSX.writeFile(workbook, fullFilename);
  } catch (error) {
    console.error('Error exporting to Excel:', error);
    alert('Erreur lors de l\'export Excel');
  }
}

/**
 * Format data for Excel export by cleaning and formatting values
 * @param data - Raw data array
 * @param columnMapping - Optional mapping of column names
 */
export function formatDataForExcel<T extends Record<string, any>>(
  data: T[],
  columnMapping?: Record<string, string>
): Record<string, any>[] {
  return data.map(row => {
    const formattedRow: Record<string, any> = {};
    
    Object.keys(row).forEach(key => {
      const displayKey = columnMapping?.[key] || key;
      let value = row[key];

      // Format dates
      if (value instanceof Date) {
        value = value.toLocaleDateString('fr-FR');
      } else if (typeof value === 'string' && value.match(/^\d{4}-\d{2}-\d{2}/)) {
        value = new Date(value).toLocaleDateString('fr-FR');
      }

      // Format booleans
      if (typeof value === 'boolean') {
        value = value ? 'Oui' : 'Non';
      }

      // Handle null/undefined
      if (value === null || value === undefined) {
        value = '';
      }

      formattedRow[displayKey] = value;
    });

    return formattedRow;
  });
}
