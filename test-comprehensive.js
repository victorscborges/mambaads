import * as XLSX from 'xlsx';
import fs from 'fs';
import http from 'http';

// Create comprehensive sample Excel file with various scenarios
const sampleData = [
  // PREMIUM - HIGH VALUE PRODUCTS
  {
    'Anúncio': 'Premium Pro 1',
    'Seller Sku': 'PREM001',
    'Item Id': 'ID_PREM001',
    'Faturamento': 45000,
    'Margem %': 45,
    'Investimento (ADS)': 3000,
    'Estoque Principal': 100,
    'Estoque Seller': 80,
    'Estoque Full': 50,
  },
  {
    'Anúncio': 'Premium Pro 2',
    'Seller Sku': 'PREM002',
    'Item Id': 'ID_PREM002',
    'Faturamento': 32000,
    'Margem %': 40,
    'Investimento (ADS)': 2000,
    'Estoque Principal': 70,
    'Estoque Seller': 60,
    'Estoque Full': 40,
  },
  
  // INTERMEDIATE - MEDIUM VALUE
  {
    'Anúncio': 'Standard Mid 1',
    'Seller Sku': 'MID001',
    'Item Id': 'ID_MID001',
    'Faturamento': 12000,
    'Margem %': 25,
    'Investimento (ADS)': 1500,
    'Estoque Principal': 40,
    'Estoque Seller': 30,
    'Estoque Full': 20,
  },
  {
    'Anúncio': 'Standard Mid 2',
    'Seller Sku': 'MID002',
    'Item Id': 'ID_MID002',
    'Faturamento': 8000,
    'Margem %': 22,
    'Investimento (ADS)': 800,
    'Estoque Principal': 30,
    'Estoque Seller': 20,
    'Estoque Full': 10,
  },
  
  // BUDGET - LOW COST PRODUCTS
  {
    'Anúncio': 'Budget Basic 1',
    'Seller Sku': 'BUD001',
    'Item Id': 'ID_BUD001',
    'Faturamento': 2500,
    'Margem %': 15,
    'Investimento (ADS)': 200,
    'Estoque Principal': 50,
    'Estoque Seller': 40,
    'Estoque Full': 20,
  },
  {
    'Anúncio': 'Budget Basic 2',
    'Seller Sku': 'BUD002',
    'Item Id': 'ID_BUD002',
    'Faturamento': 1800,
    'Margem %': 12,
    'Investimento (ADS)': 150,
    'Estoque Principal': 30,
    'Estoque Seller': 20,
    'Estoque Full': 10,
  },
  {
    'Anúncio': 'Budget Basic 3',
    'Seller Sku': 'BUD003',
    'Item Id': 'ID_BUD003',
    'Faturamento': 1200,
    'Margem %': 10,
    'Investimento (ADS)': 100,
    'Estoque Principal': 20,
    'Estoque Seller': 15,
    'Estoque Full': 5,
  },
  
  // LONG TAIL - NICHE PRODUCTS
  {
    'Anúncio': 'Niche 1',
    'Seller Sku': 'NICH001',
    'Item Id': 'ID_NICH001',
    'Faturamento': 600,
    'Margem %': 20,
    'Investimento (ADS)': 50,
    'Estoque Principal': 10,
    'Estoque Seller': 8,
    'Estoque Full': 3,
  },
  {
    'Anúncio': 'Niche 2',
    'Seller Sku': 'NICH002',
    'Item Id': 'ID_NICH002',
    'Faturamento': 400,
    'Margem %': 18,
    'Investimento (ADS)': 40,
    'Estoque Principal': 8,
    'Estoque Seller': 5,
    'Estoque Full': 2,
  },
  
  // OUT OF STOCK - Should be excluded
  {
    'Anúncio': 'Out of Stock 1',
    'Seller Sku': 'OOS001',
    'Item Id': 'ID_OOS001',
    'Faturamento': 5000,
    'Margem %': 30,
    'Investimento (ADS)': 500,
    'Estoque Principal': 0,
    'Estoque Seller': 0,
    'Estoque Full': 0,
  },
  
  // ZERO MARGIN - Should be excluded
  {
    'Anúncio': 'No Margin Product',
    'Seller Sku': 'ZM001',
    'Item Id': 'ID_ZM001',
    'Faturamento': 3000,
    'Margem %': -5,
    'Investimento (ADS)': 300,
    'Estoque Principal': 50,
    'Estoque Seller': 40,
    'Estoque Full': 20,
  },
  
  // ZERO MARGIN - Now allowed (margem = 0 is OK)
  {
    'Anúncio': 'Zero Margin Product',
    'Seller Sku': 'ZM002',
    'Item Id': 'ID_ZM002',
    'Faturamento': 2000,
    'Margem %': 0,
    'Investimento (ADS)': 200,
    'Estoque Principal': 30,
    'Estoque Seller': 25,
    'Estoque Full': 15,
  },
  
  // HIGH ACOS - Should be excluded (ACOS > 20%)
  {
    'Anúncio': 'High ACOS Product',
    'Seller Sku': 'ACOS001',
    'Item Id': 'ID_ACOS001',
    'Faturamento': 4000,
    'Margem %': 20,
    'Investimento (ADS)': 1000,
    'Estoque Principal': 40,
    'Estoque Seller': 30,
    'Estoque Full': 15,
  },

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

  // ZERO STOCK WITHOUT REVENUE - Should be excluded
  {
    'Anúncio': 'Discontinued Product',
    'Seller Sku': 'DISC001',
    'Item Id': 'ID_DISC001',
    'Faturamento': 0,
    'Margem %': 0,
    'Investimento (ADS)': 0,
    'Estoque Principal': 0,
    'Estoque Seller': 0,
    'Estoque Full': 0,
  },
];

// Create workbook
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Dados');

// Write file
const filePath = './test-data-comprehensive.xlsx';
XLSX.writeFile(wb, filePath);
console.log('✅ Excel comprehensive created: test-data-comprehensive.xlsx\n');

// Read file as buffer
const fileBuffer = fs.readFileSync(filePath);

// Create form data manually
const boundary = '----FormBoundary' + Math.random().toString(36).substr(2, 9);
let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file"; filename="test-data-comprehensive.xlsx"\r\n`;
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
        console.log('✅ ANÁLISE COMPLETA!\n');
        console.log('═'.repeat(80));
        console.log('📊 RESUMO EXECUTIVO');
        console.log('═'.repeat(80));

        const totalBudget = response.campanhas.reduce((sum, c) => sum + c.orcamentoDiario, 0);

        if (response.resumo) {
          console.log(`\n📈 MÉTRICAS GERAIS:`);
          console.log(`   Total Faturamento: R$ ${response.resumo.faturamentoTotal.toFixed(2)}`);
          console.log(`   Produtos Analisados: ${response.resumo.totalProdutos}`);
          console.log(`   Campanhas Isoladas: ${response.resumo.campanhasIsoladas}`);
          console.log(`   Campanhas Agrupadas: ${response.resumo.campanhasAgrupadas}`);
          console.log(`   Orçamento Diário Total: R$ ${totalBudget}`);
        }

        // Mostrar análise de exclusões
        if (response.exclusoes) {
          const { porMargemNegativa = [], porHighAcos = [], porZeroStockComFaturamento = [], porZeroStockSemFaturamento = [] } = response.exclusoes;
          
          if (porMargemNegativa.length > 0 || porHighAcos.length > 0 || porZeroStockComFaturamento.length > 0 || porZeroStockSemFaturamento.length > 0) {
            console.log(`\n⚠️  ANÁLISE DE EXCLUSÕES:\n`);
            
            if (porMargemNegativa.length > 0) {
              console.log(`   🚫 Excluídos por MARGEM NEGATIVA (${porMargemNegativa.length}):`);
              porMargemNegativa.forEach(p => {
                console.log(`      - ${p.name} | Item Id: ${p.itemId} | Margem: ${p.margem?.toFixed(2)}% | R$ ${p.faturamento.toFixed(2)}`);
              });
            }
            
            if (porHighAcos.length > 0) {
              console.log(`\n   🚫 Excluídos por ACOS ALTO > 20% (${porHighAcos.length}):`);
              porHighAcos.forEach(p => {
                const acosPercent = (p.acos * 100).toFixed(2);
                console.log(`      - ${p.name} | Item Id: ${p.itemId} | ACOS ${acosPercent}% | R$ ${p.faturamento.toFixed(2)}`);
              });
            }
            
            if (porZeroStockComFaturamento.length > 0) {
              console.log(`\n   🚫 Excluídos por ESTOQUE ZERADO (COM FATURAMENTO) (${porZeroStockComFaturamento.length}):`);
              porZeroStockComFaturamento.forEach(p => {
                console.log(`      - ${p.name} | Item Id: ${p.itemId} | R$ ${p.faturamento.toFixed(2)}`);
              });
            }

            if (porZeroStockSemFaturamento.length > 0) {
              console.log(`\n   🚫 Excluídos por ESTOQUE ZERADO (SEM FATURAMENTO) (${porZeroStockSemFaturamento.length}):`);
              porZeroStockSemFaturamento.forEach(p => {
                console.log(`      - ${p.name} | Item Id: ${p.itemId}`);
              });
            }
          }
        }

        if (response.campanhas && Array.isArray(response.campanhas)) {
          console.log(`\n🎯 DISTRIBUIÇÃO POR CURVA:\n`);
          
          const byCurve = {};
          response.campanhas.forEach(c => {
            const curve = c.nome.match(/MAMBA-([A-C])/)?.[1] || 'N/A';
            if (!byCurve[curve]) byCurve[curve] = { count: 0, budget: 0, revenue: 0 };
            byCurve[curve].count++;
            byCurve[curve].budget += c.orcamentoDiario;
            byCurve[curve].revenue += c.faturamento;
          });
          
          Object.entries(byCurve).forEach(([curve, data]) => {
            const percent = ((data.revenue / response.resumo.faturamentoTotal) * 100).toFixed(1);
            console.log(`   Curva ${curve}:`);
            console.log(`      Campanhas: ${data.count}`);
            console.log(`      Faturamento: R$ ${data.revenue.toFixed(2)} (${percent}%)`);
            console.log(`      Orçamento: R$ ${data.budget}`);
          });

          console.log(`\n📋 DETALHES DAS CAMPANHAS:\n`);
          console.log('═'.repeat(80));

          response.campanhas.forEach((campaign, idx) => {
            console.log(`\n${idx + 1}. ${campaign.nome}`);
            console.log(`   Tipo: ${campaign.tipo} | ROAS: ${campaign.roasObjetivo}x`);
            console.log(`   Faturamento: R$ ${campaign.faturamento.toFixed(2)} | Orçamento: R$ ${campaign.orcamentoDiario}`);
            console.log(`   Produtos: ${campaign.quantidadeProdutos} | MLBs: ${campaign.mlbs.slice(0, 3).join(', ')}${campaign.mlbs.length > 3 ? '...' : ''}`);
          });
        }

        console.log('\n' + '═'.repeat(80));
        console.log('✅ Teste concluído com sucesso!\n');
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
