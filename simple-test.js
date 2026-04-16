import * as XLSX from 'xlsx';
import fs from 'fs';
import http from 'http';

// Create sample Excel file
const sampleData = [
  {
    'Anúncio': 'Produto Premium 1',
    'Seller Sku': 'SKU001',
    'Item Id': 'ID001',
    'Faturamento': 30000,
    'Margem %': 35,
  },
  {
    'Anúncio': 'Produto Premium 2',
    'Seller Sku': 'SKU002',
    'Item Id': 'ID002',
    'Faturamento': 25000,
    'Margem %': 32,
  },
  {
    'Anúncio': 'Produto Básico 1',
    'Seller Sku': 'SKU003',
    'Item Id': 'ID003',
    'Faturamento': 3000,
    'Margem %': 15,
  },
  {
    'Anúncio': 'Produto Básico 2',
    'Seller Sku': 'SKU004',
    'Item Id': 'ID004',
    'Faturamento': 2147,
    'Margem %': 12,
  }
];

// Create workbook
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Dados');

// Write file
const filePath = './test-data.xlsx';
XLSX.writeFile(wb, filePath);
console.log('✅ Excel criado: test-data.xlsx\n');

// Read file as buffer
const fileBuffer = fs.readFileSync(filePath);

// Create form data manually
const boundary = '----FormBoundary' + Math.random().toString(36).substr(2, 9);
let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file"; filename="test-data.xlsx"\r\n`;
body += `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n`;
body += `\r\n`;

const bodyStart = Buffer.from(body);
const bodyEnd = Buffer.from(`\r\n--${boundary}--\r\n`);

const totalBuffer = Buffer.concat([bodyStart, fileBuffer, bodyEnd]);

// Send request
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/upload?tacos=5',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': totalBuffer.length
  }
};

console.log('🚀 Enviando arquivo para http://localhost:5000/api/upload\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.success) {
        console.log('✅ ANÁLISE CONCLUÍDA!\n');
        console.log('═'.repeat(70));
        console.log('📊 RESUMO');
        console.log('═'.repeat(70));

        if (response.resumo) {
          console.log(`\n📈 Total Faturamento: R$ ${response.resumo.totalFaturamento.toFixed(2)}`);
          console.log(`   Total Margem: ${response.resumo.totalMargem.toFixed(2)}%`);
          console.log(`   Produtos Analisados: ${response.resumo.totalProdutos}`);
          console.log(`   Orçamento Total Diário: R$ ${response.resumo.totalOrcamentoDiario.toFixed(2)}`);
        }

        if (response.campanhas && Array.isArray(response.campanhas)) {
          console.log(`\n🎯 CAMPANHAS GERADAS: ${response.campanhas.length}`);
          console.log('═'.repeat(70));

          response.campanhas.forEach((campaign, idx) => {
            console.log(`\n${idx + 1}. ${campaign.nome}`);
            console.log(`   Tipo: ${campaign.tipo}`);
            console.log(`   ROAS Objetivo: ${campaign.roasObjetivo}x`);
            console.log(`   💰 Orçamento Diário: R$ ${campaign.orcamentoDiario.toFixed(2)}`);
            console.log(`   Faturamento: R$ ${campaign.faturamento.toFixed(2)}`);
            console.log(`   Produtos: ${campaign.quantidadeProdutos}`);
            console.log(`   MLBs: ${campaign.mlbs.join(', ')}`);
          });

          // Summary
          console.log('\n' + '═'.repeat(70));
          console.log('💰 DISTRIBUIÇÃO ORÇAMENTÁRIA');
          console.log('═'.repeat(70));

          const totalDaily = response.campanhas.reduce((sum, c) => sum + c.orcamentoDiario, 0);
          console.log(`Total Diário: R$ ${totalDaily.toFixed(2)}`);
          console.log(`Total Mensal: R$ ${(totalDaily * 30).toFixed(2)}`);

          response.campanhas.forEach(c => {
            const percent = ((c.orcamentoDiario / totalDaily) * 100).toFixed(1);
            console.log(`  - ${c.nome}: R$ ${c.orcamentoDiario.toFixed(2)} (${percent}%)`);
          });
        }

        console.log('\n✅ Teste concluído com sucesso!\n');
        fs.unlinkSync(filePath);
        process.exit(0);
      } else {
        console.error('❌ Erro na resposta:', response.error);
        process.exit(1);
      }
    } catch (error) {
      console.error('❌ Erro ao processar resposta:', error.message);
      console.log('Resposta bruta:', data);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erro na requisição:', error.message);
  process.exit(1);
});

req.write(totalBuffer);
req.end();
