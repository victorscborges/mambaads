import * as XLSX from 'xlsx';
import fs from 'fs';
import FormData from 'form-data';
import axios from 'axios';

// Create comprehensive sample Excel file with various scenarios
const sampleData = [
  // ZERO REVENUE WITH STOCK - Should be excluded (new filter)
  {
    'Anúncio': 'No Sales Product',
    'Seller Sku': 'NOSALE001',
    'Item Id': 'ID_NOSALE001',
    'Faturamento': 0,
    'Margem %': 15,
    'Investimento (ADS)': 0,
    'Estoque Principal': 50,
    'Estoque Seller': 40,
    'Estoque Full': 30,
  },
  {
    'Anúncio': 'Normal Product',
    'Seller Sku': 'NORM001',
    'Item Id': 'ID_NORM001',
    'Faturamento': 1000,
    'Margem %': 20,
    'Investimento (ADS)': 100,
    'Estoque Principal': 50,
    'Estoque Seller': 40,
    'Estoque Full': 30,
  },
];

// Create workbook
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Dados');

// Write file
const filePath = 'test-zero-revenue-debug.xlsx';
XLSX.writeFile(wb, filePath);

console.log(`✅ Excel debug created: ${filePath}\n`);

// Send to API
const fileBuffer = fs.readFileSync(filePath);

const form = new FormData();
form.append('file', fileBuffer, filePath);
form.append('tacos', 8);

axios
  .post('http://localhost:5000/api/upload', form, {
    headers: form.getHeaders(),
  })
  .then((response) => {
    console.log('📊 RESPOSTA COMPLETA:\n');
    console.log(JSON.stringify(response.data, null, 2));
  })
  .catch((err) => {
    console.error('❌ Erro:', err.message);
  });
