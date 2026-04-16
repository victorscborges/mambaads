import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testRealFile() {
  try {
    const filePath = findRealSpreadsheet();

    if (!filePath) {
      console.error('Arquivo real nao encontrado para teste.');
      process.exit(1);
    }

    console.log(`Analisando arquivo real: ${path.basename(filePath)}`);
    console.log(`Tamanho: ${(fs.statSync(filePath).size / 1024).toFixed(2)} KB\n`);

    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('tacos', 8);

    const response = await axios.post('http://localhost:5000/api/upload', form, {
      headers: form.getHeaders(),
    });

    if (!response.data.success) {
      console.error('Resposta sem sucesso:', response.data);
      process.exit(1);
    }

    const { resumo, exclusoes, campanhas } = response.data;
    const totalExclusoes = Object.values(exclusoes || {}).reduce((sum, items) => {
      return sum + (Array.isArray(items) ? items.length : 0);
    }, 0);

    console.log(`\n${'='.repeat(80)}`);
    console.log('ANALISE DO ARQUIVO REAL');
    console.log(`${'='.repeat(80)}\n`);

    console.log('METRICAS GERAIS:');
    console.log(`   Total Faturamento: R$ ${resumo.faturamentoTotal.toFixed(2)}`);
    console.log(`   Produtos no arquivo: ${resumo.totalProdutos}`);
    console.log(`   Produtos analisados: ${resumo.produtosAnalisados}`);
    console.log(`   Campanhas isoladas: ${resumo.campanhasIsoladas}`);
    console.log(`   Campanhas agrupadas: ${resumo.campanhasAgrupadas}`);
    console.log(`   TACOS objetivo: ${resumo.tacosObjetivo}%`);
    console.log(`   Orcamento diario total: R$ ${resumo.orcamentoDiarioTotal.toFixed(2)}`);
    console.log(`   Orcamento mensal total: R$ ${resumo.orcamentoMensalTotal.toFixed(2)}`);

    console.log(`\nEXCLUSOES (${totalExclusoes}):`);
    printExclusionGroup('Margem Negativa', exclusoes?.porMargemNegativa, (product) => {
      return `Margem ${product.margem?.toFixed(2)}% | R$ ${product.faturamento?.toFixed(2)}`;
    });
    printExclusionGroup('ACOS Alto > 20%', exclusoes?.porHighAcos, (product) => {
      return `ACOS ${(product.acos * 100).toFixed(2)}% | R$ ${product.faturamento?.toFixed(2)}`;
    });
    printExclusionGroup('Estoque Zerado (com Faturamento)', exclusoes?.porZeroStockComFaturamento, (product) => {
      return `R$ ${product.faturamento?.toFixed(2)}`;
    });
    printExclusionGroup('Estoque Zerado (sem Faturamento)', exclusoes?.porZeroStockSemFaturamento);
    printExclusionGroup('Faturamento Zero', exclusoes?.porFaturamentoZero);

    console.log(`\nCAMPANHAS GERADAS (${campanhas.length}):`);
    campanhas.slice(0, 10).forEach((campaign, index) => {
      console.log(`${index + 1}. ${campaign.nome}`);
      console.log(
        `   Tipo: ${campaign.tipo} | ROAS: ${campaign.roasObjetivo}x | Faturamento: R$ ${campaign.faturamento.toFixed(2)}`
      );
      console.log(
        `   Orcamento: R$ ${campaign.orcamentoDiario.toFixed(2)} | Produtos: ${campaign.quantidadeProdutos}`
      );
    });
    if (campanhas.length > 10) {
      console.log(`   ... e mais ${campanhas.length - 10} campanhas`);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log('Analise completa com sucesso.');
  } catch (error) {
    console.error('Erro:', error.response?.data || error.message);
    process.exit(1);
  }
}

function findRealSpreadsheet() {
  const candidates = [
    path.join(process.cwd(), 'rentabilidade_real.xlsx'),
    path.join(process.cwd(), 'rentabilidade_1453322353_2026-03-16_2026-04-15.xlsx'),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  const fallback = fs
    .readdirSync(process.cwd())
    .find((file) => file.toLowerCase().endsWith('.xlsx') && file.toLowerCase().includes('rentabilidade'));

  return fallback ? path.join(process.cwd(), fallback) : null;
}

function printExclusionGroup(label, items, formatter) {
  if (!items || items.length === 0) {
    return;
  }

  console.log(`   ${label}: ${items.length}`);
  items.slice(0, 5).forEach((product) => {
    const details = formatter ? ` | ${formatter(product)}` : '';
    console.log(`      - ${product.name} | Item Id: ${product.itemId}${details}`);
  });
  if (items.length > 5) {
    console.log(`      ... e mais ${items.length - 5}`);
  }
}

testRealFile();
