import * as XLSX from 'xlsx';
import fs from 'fs';
import http from 'http';

// Create sample Excel file with 5 products
// 2 products (SKU004 and SKU005) with zero stock in all 3 columns
const sampleData = [
  {
    'Anúncio': 'Produto Premium 1',
    'Seller Sku': 'SKU001',
    'Item Id': 'ID001',
    'Faturamento': 30000,
    'Margem %': 35,
    'Estoque Principal': 50,
    'Estoque Seller': 30,
    'Estoque Full': 20,
  },
  {
    'Anúncio': 'Produto Premium 2',
    'Seller Sku': 'SKU002',
    'Item Id': 'ID002',
    'Faturamento': 25000,
    'Margem %': 32,
    'Estoque Principal': 40,
    'Estoque Seller': 25,
    'Estoque Full': 15,
  },
  {
    'Anúncio': 'Produto Básico 1',
    'Seller Sku': 'SKU003',
    'Item Id': 'ID003',
    'Faturamento': 3000,
    'Margem %': 15,
    'Estoque Principal': 10,
    'Estoque Seller': 5,
    'Estoque Full': 8,
  },
  {
    'Anúncio': 'Produto Sem Estoque 1',
    'Seller Sku': 'SKU004',
    'Item Id': 'ID004',
    'Faturamento': 2000,
    'Margem %': 12,
    'Estoque Principal': 0,
    'Estoque Seller': 0,
    'Estoque Full': 0,
  },
  {
    'Anúncio': 'Produto Sem Estoque 2',
    'Seller Sku': 'SKU005',
    'Item Id': 'ID005',
    'Faturamento': 1500,
    'Margem %': 10,
    'Estoque Principal': 0,
    'Estoque Seller': 0,
    'Estoque Full': 0,
  }
];

// Create workbook
const ws = XLSX.utils.json_to_sheet(sampleData);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Dados');

// Write file
const filePath = './test-stock-data.xlsx';
XLSX.writeFile(wb, filePath);
console.log('? Excel criado: test-stock-data.xlsx\n');
console.log('?? Dados de teste:');
console.log('   - 5 produtos no total');
console.log('   - SKU001, SKU002, SKU003: COM estoque');
console.log('   - SKU004, SKU005: SEM estoque (zeros nas 3 colunas)\n');

// Read file as buffer
const fileBuffer = fs.readFileSync(filePath);

// Create form data manually
const boundary = '----FormBoundary' + Math.random().toString(36).substr(2, 9);
let body = '';
body += `--${boundary}\r\n`;
body += `Content-Disposition: form-data; name="file"; filename="test-stock-data.xlsx"\r\n`;
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

console.log('?? Enviando arquivo para http://localhost:5000/api/upload\n');

const req = http.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const response = JSON.parse(data);

      if (response.success) {
        console.log('? ANÁLISE CONCLUÍDA!\n');
        console.log('-'.repeat(70));
        console.log('?? VERIFICAÇÃO DO FILTRO DE ESTOQUE');
        console.log('-'.repeat(70));

        const totalProdutos = sampleData.length;
        const produtosAnalysados = response.resumo.totalProdutos;
        const produtosRemovidos = totalProdutos - produtosAnalysados;
        const campanhasGeradas = response.campanhas ? response.campanhas.length : 0;

        console.log(`\n?? Total de produtos no arquivo: ${totalProdutos}`);
        console.log(`? Produtos analisados: ${produtosAnalysados}`);
        console.log(`??  Produtos removidos (sem estoque): ${produtosRemovidos}`);
        console.log(`?? Campanhas geradas: ${campanhasGeradas}\n`);

        // Verification 1: Only 3 products analyzed
        console.log('?? VERIFICAÇÕES:');
        console.log('-'.repeat(70));
        
        let verification1 = produtosAnalysados === 3;
        console.log(`1??  Apenas 3 produtos analisados? ${verification1 ? '? PASSOU' : '? FALHOU'}`);
        console.log(`   Esperado: 3, Recebido: ${produtosAnalysados}`);

        // Verification 2: Log shows warning about zero stock products
        let verification2 = produtosRemovidos === 2;
        console.log(`\n2??  Aviso mostra 2 produtos sem estoque? ${verification2 ? '? PASSOU' : '? FALHOU'}`);
        console.log(`   Esperado: 2, Recebido: ${produtosRemovidos}`);

        // Verification 3: Only 3 campaigns generated
        let verification3 = campanhasGeradas === 3;
        console.log(`\n3??  Apenas 3 campanhas geradas? ${verification3 ? '? PASSOU' : '? FALHOU'}`);
        console.log(`   Esperado: 3, Recebido: ${campanhasGeradas}`);

        // Verification 4: ID004 and ID005 NOT in campaign list
        let verification4 = true;
        const includedIds = [];
        if (response.campanhas && Array.isArray(response.campanhas)) {
          response.campanhas.forEach((campaign) => {
            if (campaign.mlbs) {
              campaign.mlbs.forEach(mlb => {
                includedIds.push(mlb);
              });
            }
          });
        }
        
        const hasID004 = includedIds.includes('ID004');
        const hasID005 = includedIds.includes('ID005');
        verification4 = !hasID004 && !hasID005;

        console.log(`\n4??  ID004 e ID005 NÃO estão nas campanhas? ${verification4 ? '? PASSOU' : '? FALHOU'}`);
        console.log(`   ID004 presente? ${hasID004 ? 'SIM (ERRO)' : 'NÃO (Correto)'}`);
        console.log(`   ID005 presente? ${hasID005 ? 'SIM (ERRO)' : 'NÃO (Correto)'}`);

        // Show campaigns
        console.log('\n' + '-'.repeat(70));
        console.log('?? CAMPANHAS GERADAS');
        console.log('-'.repeat(70));

        if (response.campanhas && Array.isArray(response.campanhas)) {
          response.campanhas.forEach((campaign, idx) => {
            console.log(`\n${idx + 1}. ${campaign.nome}`);
            console.log(`   Tipo: ${campaign.tipo}`);
            console.log(`   Faturamento: R$ ${campaign.faturamento.toFixed(2)}`);
            console.log(`   Produtos (MLBs): ${campaign.mlbs.join(', ')}`);
          });
        }

        // Final summary
        console.log('\n' + '-'.repeat(70));
        console.log('?? RESULTADO FINAL');
        console.log('-'.repeat(70));

        const allPassed = verification1 && verification2 && verification3 && verification4;
        if (allPassed) {
          console.log('\n?? TODOS OS TESTES PASSARAM!\n');
        } else {
          console.log('\n??  ALGUNS TESTES FALHARAM!\n');
        }

        fs.unlinkSync(filePath);
        process.exit(allPassed ? 0 : 1);
      } else {
        console.error('? Erro na resposta:', response.error);
        fs.unlinkSync(filePath);
        process.exit(1);
      }
    } catch (error) {
      console.error('? Erro ao processar resposta:', error.message);
      console.log('Resposta bruta:', data);
      fs.unlinkSync(filePath);
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('? Erro na requisição:', error.message);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  process.exit(1);
});

req.write(totalBuffer);
req.end();
