import XLSX from 'xlsx';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

// Criar arquivo de teste com 70 produtos (simulação do arquivo real do usuário)
function createLargeTestFile() {
  const products = [];
  
  // Adicionar 70 produtos com diferentes cenários
  for (let i = 1; i <= 70; i++) {
    const revenue = Math.random() * 10000 + 500;
    const margin = Math.random() * 50;
    const stock = Math.random() > 0.7 ? 0 : Math.floor(Math.random() * 100); // 30% sem estoque
    const adsInvest = revenue * (Math.random() * 0.3 + 0.01); // 1%-30% TACOS
    
    products.push({
      'Anúncio': `Produto ${i}`,
      'Item Id': `ID_PROD${String(i).padStart(3, '0')}`,
      'Seller Sku': `SKU${i}`,
      'Faturamento': i <= 20 ? revenue * (50 - i) : revenue, // Primeiros 20 com faturamento maior
      'Margem %': i % 15 === 0 ? 0 : margin, // A cada 15 produtos, um com margem zero
      'Investimento (ADS)': i % 25 === 0 ? revenue * 0.5 : adsInvest, // A cada 25 produtos, um com ACOS alto
      'Estoque Principal': stock,
      'Estoque Seller': stock,
      'Estoque Full': stock,
    });
  }

  const ws = XLSX.utils.json_to_sheet(products);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Produtos');
  XLSX.writeFile(wb, 'test-70-produtos.xlsx');
  
  return products.length;
}

async function testLargeFile() {
  try {
    console.log('📊 TESTE COM 70 PRODUTOS\n');
    console.log('='.repeat(80));
    
    // Criar arquivo de teste
    const productCount = createLargeTestFile();
    console.log(`✅ Arquivo de teste criado: test-70-produtos.xlsx (${productCount} produtos)\n`);

    // Upload
    console.log('🚀 Enviando arquivo para análise...\n');
    
    const form = new FormData();
    form.append('file', fs.createReadStream('test-70-produtos.xlsx'));
    form.append('tacos', 8);

    const response = await axios.post('http://localhost:5000/api/upload', form, {
      headers: form.getHeaders(),
      maxBodyLength: Infinity,
    });

    if (response.data.success) {
      const { resumo, exclusoes, campanhas } = response.data;

      console.log(`📈 RESUMO:\n`);
      console.log(`   Total de Produtos (arquivo): ${resumo.totalProdutos}`);
      console.log(`   Produtos Analisados: ${resumo.produtosAnalisados}`);
      console.log(`   Exclusões: ${resumo.totalProdutos - resumo.produtosAnalisados}`);
      console.log(`   Campanhas Criadas: ${campanhas.length} (${resumo.campanhasIsoladas} Isoladas + ${resumo.campanhasAgrupadas} Agrupadas)`);
      console.log(`   Faturamento Total: R$ ${resumo.faturamentoTotal.toFixed(2)}\n`);

      // Exclusões detalhadas
      if (exclusoes) {
        const { porMargemNegativa = [], porHighAcos = [], porFaturamentoZero = [], porZeroStockComFaturamento = [], porZeroStockSemFaturamento = [] } = exclusoes;
        const totalExcluidos = porMargemNegativa.length + porHighAcos.length + porFaturamentoZero.length + porZeroStockComFaturamento.length + porZeroStockSemFaturamento.length;

        console.log(`⚠️  ANÁLISE DE EXCLUSÕES (Total: ${totalExcluidos}):\n`);

        if (porMargemNegativa.length > 0) {
          console.log(`   🚫 Margem Negativa: ${porMargemNegativa.length}`);
          porMargemNegativa.slice(0, 3).forEach(p => {
            console.log(`      - ${p.name} | Item Id: ${p.itemId} | Margem: ${p.margem?.toFixed(2)}% | R$ ${p.faturamento?.toFixed(2)}`);
          });
          if (porMargemNegativa.length > 3) console.log(`      ... e mais ${porMargemNegativa.length - 3}`);
        }

        if (porHighAcos.length > 0) {
          console.log(`\n   🚫 ACOS Alto (> 20%): ${porHighAcos.length}`);
          porHighAcos.slice(0, 3).forEach(p => {
            console.log(`      - ${p.name} | Item Id: ${p.itemId} | ACOS: ${(p.acos * 100)?.toFixed(2)}% | R$ ${p.faturamento?.toFixed(2)}`);
          });
          if (porHighAcos.length > 3) console.log(`      ... e mais ${porHighAcos.length - 3}`);
        }

        if (porFaturamentoZero.length > 0) {
          console.log(`\n   🚫 Faturamento Zero: ${porFaturamentoZero.length}`);
          porFaturamentoZero.slice(0, 3).forEach(p => {
            console.log(`      - ${p.name} | Item Id: ${p.itemId}`);
          });
          if (porFaturamentoZero.length > 3) console.log(`      ... e mais ${porFaturamentoZero.length - 3}`);
        }

        if (porZeroStockComFaturamento.length > 0) {
          console.log(`\n   🚫 Estoque Zerado (com Faturamento): ${porZeroStockComFaturamento.length}`);
          porZeroStockComFaturamento.slice(0, 3).forEach(p => {
            console.log(`      - ${p.name} | Item Id: ${p.itemId} | R$ ${p.faturamento?.toFixed(2)}`);
          });
          if (porZeroStockComFaturamento.length > 3) console.log(`      ... e mais ${porZeroStockComFaturamento.length - 3}`);
        }

        if (porZeroStockSemFaturamento.length > 0) {
          console.log(`\n   🚫 Estoque Zerado (sem Faturamento): ${porZeroStockSemFaturamento.length}`);
          porZeroStockSemFaturamento.slice(0, 3).forEach(p => {
            console.log(`      - ${p.name} | Item Id: ${p.itemId}`);
          });
          if (porZeroStockSemFaturamento.length > 3) console.log(`      ... e mais ${porZeroStockSemFaturamento.length - 3}`);
        }
      }

      // Campanhas
      console.log(`\n📋 CAMPANHAS GERADAS (${campanhas.length}):\n`);
      
      const isoladas = campanhas.filter(c => c.tipo === 'Isolada');
      const agrupadas = campanhas.filter(c => c.tipo === 'Agrupada');

      console.log(`   📌 ISOLADAS (${isoladas.length}):`);
      isoladas.slice(0, 5).forEach(c => {
        console.log(`      • ${c.nome} | ${c.quantidadeProdutos} produto(s) | R$ ${c.faturamento.toFixed(2)}`);
      });
      if (isoladas.length > 5) console.log(`      ... e mais ${isoladas.length - 5}`);

      if (agrupadas.length > 0) {
        console.log(`\n   🔗 AGRUPADAS (${agrupadas.length}):`);
        agrupadas.forEach(c => {
          console.log(`      • ${c.nome} | ${c.quantidadeProdutos} produtos | R$ ${c.faturamento.toFixed(2)}`);
        });
      }

      console.log(`\n${'='.repeat(80)}`);
      console.log(`✅ Teste concluído!`);
    }
  } catch (err) {
    console.error('❌ Erro:', err.response?.data || err.message);
  }
}

testLargeFile();
