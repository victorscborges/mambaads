import fs from 'fs';
import path from 'path';
import FormData from 'form-data';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const filePath = path.join(__dirname, 'rentabilidade_real.xlsx');

if (!fs.existsSync(filePath)) {
  console.error(`❌ Arquivo não encontrado: ${filePath}`);
  process.exit(1);
}

const fileBuffer = fs.readFileSync(filePath);

const form = new FormData();
form.append('file', fileBuffer, path.basename(filePath));
form.append('tacos', 8);

axios
  .post('http://localhost:5000/api/upload', form, {
    headers: form.getHeaders(),
  })
  .then(response => {
    const { success, resumo, exclusoes, campanhas } = response.data;

    if (!success) {
      console.error('❌ Erro na análise');
      return;
    }

    console.log(`✅ Análise concluída!\n`);
    console.log(`📊 Total de campanhas: ${campanhas.length}`);
    console.log(`📈 Faturamento total: R$ ${resumo.faturamentoTotal.toFixed(2)}\n`);

    // Procurar por campanhas com faturamento zero
    const campanhasZeroRevenue = campanhas.filter(c => c.faturamento === 0);

    if (campanhasZeroRevenue.length > 0) {
      console.log(`\n⚠️  CAMPANHAS COM FATURAMENTO ZERO (${campanhasZeroRevenue.length}):\n`);
      
      campanhasZeroRevenue.forEach((c, idx) => {
        console.log(`${idx + 1}. ${c.name}`);
        console.log(`   Tipo: ${c.tipo}`);
        console.log(`   Faturamento: R$ ${c.faturamento.toFixed(2)}`);
        console.log(`   Orçamento: R$ ${c.orcamentoDiario.toFixed(2)}`);
        console.log(`   Produtos: ${c.produtos.length}`);
        console.log(`   MLBs: ${c.produtos.map(p => p.itemId).join(', ')}`);
        console.log();
      });
    } else {
      console.log(`✅ Nenhuma campanha com faturamento zero encontrada!`);
    }

    // Mostrar resumo de exclusões
    if (exclusoes) {
      const { porMargemNegativa = [], porHighAcos = [], porZeroStockComFaturamento = [], porZeroStockSemFaturamento = [] } = exclusoes;
      console.log(`\n📋 RESUMO DE EXCLUSÕES:`);
      console.log(`   - Margem Negativa: ${porMargemNegativa.length}`);
      console.log(`   - ACOS Alto: ${porHighAcos.length}`);
      console.log(`   - Estoque Zerado (com Faturamento): ${porZeroStockComFaturamento.length}`);
      console.log(`   - Estoque Zerado (sem Faturamento): ${porZeroStockSemFaturamento.length}`);
      console.log(`   TOTAL EXCLUÍDOS: ${porMargemNegativa.length + porHighAcos.length + porZeroStockComFaturamento.length + porZeroStockSemFaturamento.length}`);
    }

    // Listar todos os produtos com faturamento zero que passaram
    console.log(`\n🔍 PRODUTOS COM FATURAMENTO ZERO NAS CAMPANHAS:\n`);
    let produtosZeroFaturamento = [];
    campanhas.forEach(c => {
      c.produtos.forEach(p => {
        if (p.faturamento === 0 || p.faturamento === undefined) {
          produtosZeroFaturamento.push({
            campanha: c.name,
            ...p
          });
        }
      });
    });

    if (produtosZeroFaturamento.length > 0) {
      console.log(`Encontrados ${produtosZeroFaturamento.length} produtos com faturamento zero:\n`);
      produtosZeroFaturamento.slice(0, 10).forEach(p => {
        console.log(`   - ${p.name} (${p.itemId}) em ${p.campanha}`);
        console.log(`     Faturamento: ${p.faturamento}, Margem: ${p.margem}%, Estoque: ${p.estoqueTotal}`);
      });
      if (produtosZeroFaturamento.length > 10) {
        console.log(`   ... e mais ${produtosZeroFaturamento.length - 10}`);
      }
    } else {
      console.log(`✅ Nenhum produto com faturamento zero encontrado nas campanhas!`);
    }
  })
  .catch(err => {
    console.error('❌ Erro:', err.message);
    if (err.response?.data) {
      console.error('Detalhes:', err.response.data);
    }
  });
