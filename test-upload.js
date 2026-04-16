import * as XLSX from 'xlsx';
import FormData from 'form-data';
import fs from 'fs';
import https from 'https';
import http from 'http';

// Create sample Excel file
const sampleData = [
  {
    'Anúncio': 'Produto Premium 1',
    'Seller Sku': 'SKU001',
    'Item Id': 'ID001',
    'Faturamento': 150000,
    'Margem %': 35,
    'Preço Médio Venda': 500,
    'Visitas': 5000,
    'Un. Vendidas': 1500,
    'CPC': 2.50,
    'ROAS': 8.5
  },
  {
    'Anúncio': 'Produto Premium 2',
    'Seller Sku': 'SKU002',
    'Item Id': 'ID002',
    'Faturamento': 120000,
    'Margem %': 32,
    'Preço Médio Venda': 480,
    'Visitas': 4200,
    'Un. Vendidas': 1200,
    'CPC': 2.30,
    'ROAS': 8.2
  },
  {
    'Anúncio': 'Produto Intermediário 1',
    'Seller Sku': 'SKU003',
    'Item Id': 'ID003',
    'Faturamento': 60000,
    'Margem %': 22,
    'Preço Médio Venda': 300,
    'Visitas': 3000,
    'Un. Vendidas': 800,
    'CPC': 1.80,
    'ROAS': 6.5
  },
  {
    'Anúncio': 'Produto Intermediário 2',
    'Seller Sku': 'SKU004',
    'Item Id': 'ID004',
    'Faturamento': 45000,
    'Margem %': 20,
    'Preço Médio Venda': 250,
    'Visitas': 2200,
    'Un. Vendidas': 600,
    'CPC': 1.50,
    'ROAS': 6.0
  },
  {
    'Anúncio': 'Produto Básico 1',
    'Seller Sku': 'SKU005',
    'Item Id': 'ID005',
    'Faturamento': 18000,
    'Margem %': 15,
    'Preço Médio Venda': 100,
    'Visitas': 1200,
    'Un. Vendidas': 400,
    'CPC': 1.00,
    'ROAS': 4.5
  },
  {
    'Anúncio': 'Produto Básico 2',
    'Seller Sku': 'SKU006',
    'Item Id': 'ID006',
    'Faturamento': 12000,
    'Margem %': 12,
    'Preço Médio Venda': 80,
    'Visitas': 800,
    'Un. Vendidas': 300,
    'CPC': 0.80,
    'ROAS': 4.0
  },
  {
    'Anúncio': 'Produto Básico 3',
    'Seller Sku': 'SKU007',
    'Item Id': 'ID007',
    'Faturamento': 8000,
    'Margem %': 10,
    'Preço Médio Venda': 60,
    'Visitas': 500,
    'Un. Vendidas': 200,
    'CPC': 0.70,
    'ROAS': 3.5
  }
];

// Create workbook and worksheet
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Dados');

// Write file
const filePath = './test-data.xlsx';
XLSX.writeFile(wb, filePath);
console.log('✅ Excel file created: test-data.xlsx\n');

// Upload the file
const fileStream = fs.createReadStream(filePath);
const form = new FormData();
form.append('file', fileStream);

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/upload',
  method: 'POST',
  headers: form.getHeaders()
};

console.log('🚀 Uploading file to http://localhost:5000/api/upload\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const response = JSON.parse(data);
      
      console.log('✅ UPLOAD SUCCESSFUL!\n');
      console.log('='.repeat(70));
      console.log('📊 CAMPAIGN ANALYSIS RESULTS');
      console.log('='.repeat(70));
      
      if (response.analysis) {
        console.log('\n📈 ANALYSIS SUMMARY:');
        console.log('   Total Revenue: R$ ' + (response.analysis.totalRevenue?.toFixed(2) || 'N/A'));
        console.log('   Monthly Investment (5% TACOS): R$ ' + (response.analysis.monthlyBudget?.toFixed(2) || 'N/A'));
        console.log('   Daily Budget (base): R$ ' + (response.analysis.dailyBudget?.toFixed(2) || 'N/A'));
      }
      
      if (response.campaigns && Array.isArray(response.campaigns)) {
        console.log('\n🎯 CAMPAIGNS GENERATED: ' + response.campaigns.length);
        console.log('='.repeat(70));
        
        response.campaigns.forEach((campaign, index) => {
          console.log('\n' + (index + 1) + '. ' + campaign.name);
          console.log('   SKU(s): ' + (campaign.skus?.join(', ') || campaign.sku || 'N/A'));
          console.log('   Curve: ' + (campaign.curve || 'N/A'));
          console.log('   Revenue %: ' + (campaign.revenuePercentage?.toFixed(2) || 'N/A') + '%');
          console.log('   Revenue: R$ ' + (campaign.faturamento?.toFixed(2) || 'N/A'));
          console.log('   Avg Margin: ' + (campaign.avgMargin?.toFixed(1) || 'N/A') + '%');
          console.log('   Monthly Budget: R$ ' + (campaign.monthlyBudget?.toFixed(2) || 'N/A'));
          console.log('   Daily Budget: R$ ' + (campaign.dailyBudget?.toFixed(2) || 'N/A'));
          console.log('   Products: ' + (campaign.products?.length || campaign.productCount || 1));
        });
        
        // Summary of daily budgets
        console.log('\n' + '='.repeat(70));
        console.log('💰 DAILY BUDGET DISTRIBUTION:');
        console.log('='.repeat(70));
        
        const dailyBudgets = response.campaigns.map(c => ({
          name: c.name,
          budget: c.dailyBudget
        }));
        
        dailyBudgets.forEach(item => {
          console.log('   ' + item.name.padEnd(40) + ' R$ ' + item.budget.toFixed(2));
        });
        
        const totalDaily = dailyBudgets.reduce((sum, item) => sum + item.budget, 0);
        const variance = Math.max(...dailyBudgets.map(i => i.budget)) - Math.min(...dailyBudgets.map(i => i.budget));
        
        console.log('\n   ' + '-'.repeat(66));
        console.log('   Total Daily Budget: R$ ' + totalDaily.toFixed(2));
        console.log('   Budget Variance: R$ ' + variance.toFixed(2));
        console.log('   Min Daily Budget: R$ ' + Math.min(...dailyBudgets.map(i => i.budget)).toFixed(2));
        console.log('   Max Daily Budget: R$ ' + Math.max(...dailyBudgets.map(i => i.budget)).toFixed(2));
      }
      
      console.log('\n' + '='.repeat(70));
      console.log('✅ Test completed successfully!\n');
      
      // Clean up
      fs.unlinkSync(filePath);
      process.exit(0);
    } catch (error) {
      console.error('❌ Error parsing response:', error.message);
      console.log('Raw response:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
  process.exit(1);
});

form.pipe(req);
