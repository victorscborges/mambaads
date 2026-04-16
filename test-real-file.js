import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testRealFile() {
  try {
    // Usar o arquivo anexado pelo usuário
    const filePath = path.join(process.cwd(), 'rentabilidade_1453322353_2026-03-16_2026-04-15.xlsx');
    
    if (!fs.existsSync(filePath)) {
      console.error(`❌ Arquivo não encontrado: ${filePath}`);
      process.exit(1);
    }

    console.log(`📂 Analisando arquivo real: ${path.basename(filePath)}`);
    console.log(`📊 Tamanho: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB\n`);

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('tacos', 8);

    const response = await axios.post('http://localhost:5000/api/upload', form, {
      headers: form.getHeaders(),
    });

    if (response.data.success) {
      const { resumo, exclusoes, campanhas } = response.data;

      console.log(`\n${'='.repeat(80)}`);
      console.log(`📊 ANÁLISE DO ARQUIVO REAL (70 PRODUTOS)`);
      console.log(`${'='.repeat(80)}\n`);

      console.log(`📈 MÉTRICAS GERAIS:`);
      console.log(`   Total Faturamento: R$ ${resumo.faturamentoTotal.toFixed(2)}`);
      console.log(`   Produtos Analisados: ${resumo.totalProdutos}`);
      console.log(`   Campanhas Isoladas: ${resumo.campanhasIsoladas}`);
      console.log(`   Campanhas Agrupadas: ${resumo.campanhasAgrupadas}`);
      console.log(`   Orçamento Diário: R$ ${campanhas.reduce((sum, c) => sum + parseFloat(c.orcamentoDiario.replace('R$ ', '').replace(',', '.')), 0).toFixed(2)}`);

      // Análise de exclusões detalhada
      if (exclusoes) {
        const { porZeroMargin = [], porHighAcos = [], porZeroStock = [], porMuitoSmall = [] } = exclusoes;
        const totalExcluidos = porZeroMargin.length + porHighAcos.length + (porZeroStock.length || 0) + (porMuitoSmall.length || 0);

        console.log(`\n⚠️  ANÁLISE DE EXCLUSÕES (Total: ${totalExcluidos}):\n`);

        if (porZeroMargin.length > 0) {
          console.log(`   🚫 Margem Zero/Negativa (${porZeroMargin.length}):`);
          porZeroMargin.forEach(p => {
            const margin = p.margem !== undefined ? p.margem : 'N/A';
            console.log(`      - ${p.name} | Margem: ${margin}% | Faturamento: R$ ${p.faturamento?.toFixed(2)}`);
          });
        }

        if (porHighAcos.length > 0) {
          console.log(`\n   🚫 ACOS Alto > 20% (${porHighAcos.length}):`);
          porHighAcos.forEach(p => {
            const acosPercent = (p.acos * 100)?.toFixed(2);
            console.log(`      - ${p.name} | ACOS: ${acosPercent}% | Faturamento: R$ ${p.faturamento?.toFixed(2)}`);
          });
        }

        if (porZeroStock && porZeroStock.length > 0) {
          console.log(`\n   🚫 Estoque Zerado (${porZeroStock.length}):`);
          porZeroStock.forEach(p => {
            console.log(`      - ${p.name} | Faturamento: R$ ${p.faturamento?.toFixed(2)}`);
          });
        }

        if (porMuitoSmall && porMuitoSmall.length > 0) {
          console.log(`\n   ⚪ Abaixo de 1% - Disponível para agrupamento (${porMuitoSmall.length}):`);
          porMuitoSmall.slice(0, 10).forEach(p => {
            const revenuePercent = (p.revenuePercentage * 100)?.toFixed(3);
            console.log(`      - ${p.name} | ${revenuePercent}% | R$ ${p.faturamento?.toFixed(2)}`);
          });
          if (porMuitoSmall.length > 10) {
            console.log(`      ... e mais ${porMuitoSmall.length - 10} produtos pequenos`);
          }
        }
      }

      console.log(`\n📋 CAMPANHAS GERADAS (${campanhas.length}):\n`);
      campanhas.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.name}`);
        console.log(`   Tipo: ${c.tipo} | ROAS: ${c.roas} | Faturamento: R$ ${c.faturamento.replace('R$ ', '')}`);
        console.log(`   Orçamento: ${c.orcamentoDiario} | Produtos: ${c.produtos}`);
      });

      console.log(`\n${'='.repeat(80)}`);
      console.log(`✅ Análise completa! ${70 - (campanhas.length)} produtos excluídos ou agrupáveis.`);
    }
  } catch (err) {
    console.error('❌ Erro:', err.response?.data || err.message);
  }
}

testRealFile();
