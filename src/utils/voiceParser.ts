import { Product } from '@/lib/supabase/types';

export const parseProductVoiceCommand = (text: string): Partial<Product> => {
  const result: Partial<Product> = {};
  const lowerText = text.toLowerCase();

  // Helper to extract number after keyword
  const extractNumber = (keyword: string): number | undefined => {
    const regex = new RegExp(`${keyword}\\s*(\\d+(\\.\\d{1,2})?)`, 'i');
    const match = lowerText.match(regex);
    return match ? parseFloat(match[1]) : undefined;
  };

  // Helper to extract string after keyword until next keyword or end
  // Simple heuristic: name is usually at the start or explicitly marked
  const extractString = (keyword: string): string | undefined => {
    const idx = lowerText.indexOf(keyword);
    if (idx === -1) return undefined;
    
    // Start after keyword
    let content = text.slice(idx + keyword.length).trim();
    
    // Stop at known other keywords to Clean up
    const stopWords = ['precio', 'costo', 'stock', 'cantidad', 'código', 'barra', 'producto', 'nombre'];
    
    // Find earliest stop word
    let minIdx = content.length;
    stopWords.forEach(sw => {
        const swIdx = content.toLowerCase().indexOf(sw);
        if (swIdx !== -1 && swIdx < minIdx) {
            minIdx = swIdx;
        }
    });
    
    return content.substring(0, minIdx).trim();
  };

  // 1. Name
  // If "producto" or "nombre" is explicit
  if (lowerText.includes('producto')) {
    result.name = extractString('producto');
  } else if (lowerText.includes('nombre')) {
    result.name = extractString('nombre');
  } else {
    // Attempt implicit name at start if user just says "Coca Cola precio..."
    // We assume name ends before the first number or price keyword
     const firstKeywordIndex = lowerText.search(/(precio|costo|stock|código|barra|\d)/);
     if (firstKeywordIndex > 0) {
         result.name = text.substring(0, firstKeywordIndex).trim();
     }
  }

  // 2. Price (Selling Price)
  const price = extractNumber('precio') || extractNumber('venta');
  if (price !== undefined) result.price = price;

  // 3. Cost
  const cost = extractNumber('costo') || extractNumber('compra');
  if (cost !== undefined) result.cost = cost;

  // 4. Stock
  const stock = extractNumber('stock') || extractNumber('cantidad');
  if (stock !== undefined) result.stock = stock;
  
  // 5. Min Stock (Default if not spoken)
  const minStock = extractNumber('mínimo') || extractNumber('alerta');
  if (minStock !== undefined) result.min_stock = minStock;

  // 6. Barcode
  // Barcodes might be spoken as numbers "código 7 5 0..."
  // This is tricky with voice, usually barcode scanners are better, 
  // but if spoken we look for "código" followed by pure numbers usually.
  const barcodeMatch = lowerText.match(/(?:código|barra|barras)\s*([\w\d]+)/i);
  if (barcodeMatch) {
      result.barcode = barcodeMatch[1];
      result.sku = barcodeMatch[1]; // Default SKU to barcode
  }

  // Default cleanup
  if (result.name) {
      // Capitalize first letter
      result.name = result.name.charAt(0).toUpperCase() + result.name.slice(1);
  }

  // 7. Weighted Product (Sold by weight/bulk)
  const isWeighted = 
    lowerText.includes('peso') || 
    lowerText.includes('granel') || 
    lowerText.includes('kilo') || 
    lowerText.includes('pesado');
  
  if (isWeighted) {
    result.is_weighted = true;
    result.measurement_unit = 'kg'; // Default to kg for weighted products
  }

  return result;
};
