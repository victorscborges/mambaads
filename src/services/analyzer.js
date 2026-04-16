import * as XLSX from 'xlsx';
import { classifyCurve, generateCampaignName, groupProducts } from '../utils/campaignLogic.js';

export async function analyzeSpreadsheet(buffer, tacosObjetivo = 5) {
  // Ler o arquivo Excel
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  if (!data || data.length === 0) {
    throw new Error('Planilha vazia ou formato inválido');
  }

  // Log das colunas encontradas
  const headers = Object.keys(data[0]);
  console.log('\n📋 COLUNAS ENCONTRADAS NA PLANILHA:');
  console.log(`   ${headers.join(' | ')}\n`);

  // Calcular faturamento total
  const totalRevenue = data.reduce((sum, row) => {
    const revenue = parseFloat(row['Faturamento'] || row['faturamento'] || 0);
    return sum + revenue;
  }, 0);

  // Classificar produtos e calcular métricas
  const products = data.map((row) => {
    const revenue = parseFloat(row['Faturamento'] || row['faturamento'] || 0);
    const revenuePercentage = (revenue / totalRevenue) * 100;
    
    // Tentar várias colunas de margem
    let margin = parseFloat(row['Margem %'] || row['margem %'] || row['Margem'] || row['margem'] || 0);
    
    // Se margem for 0, tentar usar Margem R$ dividido por Faturamento
    if (margin === 0 && row['Margem R$']) {
      const marginReais = parseFloat(row['Margem R$'] || 0);
      if (revenue > 0) {
        margin = (marginReais / revenue) * 100;
      }
    }

    const avgTicket = parseFloat(row['Preço Médio Venda'] || row['Ticket Médio'] || row['ticket'] || 0);

    // Calcular ACOS (Advertising Cost of Sale) = Investimento / Faturamento
    const adsInvestment = parseFloat(row['Investimento (ADS)'] || row['investimento (ads)'] || row['Investment'] || 0);
    const acos = revenue > 0 ? adsInvestment / revenue : 0;

    return {
      sku: row['Seller Sku'] || row['SKU'] || row['sku'] || 'N/A',
      itemId: row['Item Id'] || row['item id'] || 'N/A',
      name: row['Anúncio'] || row['Produto'] || row['produto'] || 'Sem nome',
      faturamento: revenue,
      revenuePercentage,
      margem: margin,
      ticket: avgTicket,
      acos: acos,
      adsInvestment: adsInvestment,
      cursor: row['ROAS'] || row['roas'] || 'N/A',
      visits: parseFloat(row['Visitas'] || row['visits'] || 0),
      sales: parseFloat(row['Un. Vendidas'] || row['Vendas'] || row['vendas'] || 0),
      cpc: parseFloat(row['CPC'] || row['cpc'] || 0),
      // Estoque nas três colunas
      estoquePrincipal: parseFloat(row['Estoque Principal'] || row['estoque principal'] || 0),
      estoqueSeller: parseFloat(row['Estoque Seller'] || row['estoque seller'] || 0),
      estoqueFull: parseFloat(row['Estoque Full'] || row['estoque full'] || 0),
    };
  });

  // Classificar em curvas
  const classifiedProducts = products.map((product) => ({
    ...product,
    curve: classifyCurve(product, totalRevenue),
  }));

  // Filtrar produtos sem estoque (zero nas 3 colunas de estoque)
  const productsRemovedByStockZero = classifiedProducts.filter((p) => {
    const stockZeroInAll = p.estoquePrincipal === 0 && p.estoqueSeller === 0 && p.estoqueFull === 0;
    return stockZeroInAll;
  });

  // Separar estoque zerado em dois tipos
  const productsZeroStockWithRevenue = productsRemovedByStockZero.filter((p) => p.faturamento > 0);
  const productsZeroStockWithoutRevenue = productsRemovedByStockZero.filter((p) => p.faturamento === 0);

  const productsWithStock = classifiedProducts.filter((p) => {
    const stockZeroInAll = p.estoquePrincipal === 0 && p.estoqueSeller === 0 && p.estoqueFull === 0;
    return !stockZeroInAll;
  });

  // Filtrar produtos com ACOS alto (> 20%)
  const productsWithGoodAcos = productsWithStock.filter((p) => p.acos <= 0.2);
  const productsRemovedByHighAcos = productsWithStock.filter((p) => p.acos > 0.2);

  // Filtrar por margem negativa (< 0) - Margem ZERO é permitida
  const productsRemovedByNegativeMargin = productsWithGoodAcos.filter((p) => p.margem < 0);
  const productsWithValidMargin = productsWithGoodAcos.filter((p) => p.margem >= 0);

  // Filtrar por faturamento zero - produtos sem vendas não devem gerar campanhas
  const productsRemovedByZeroRevenue = productsWithValidMargin.filter((p) => p.faturamento === 0);
  const productsWithRevenue = productsWithValidMargin.filter((p) => p.faturamento > 0);

  // Separar produtos isolados e agrupáveis
  // Regra: Se faturamento >= 1% → DEVE ser isolado obrigatoriamente
  // Margem >= 0 é permitida (incluindo zero)
  const isolatedProducts = productsWithRevenue.filter(
    (p) => p.revenuePercentage >= 1
  );

  // Apenas produtos com faturamento < 1% e margem >= 0 podem ser agrupados
  const groupableProducts = productsWithRevenue.filter(
    (p) => p.revenuePercentage < 1
  );

  // Log detalhado para debugging
  console.log('\n📊 ANÁLISE DE PLANILHA:');
  console.log(`   Total de produtos: ${products.length}`);
  
  // Contar produtos removidos por falta de estoque
  const productsRemovedByStock = products.length - productsWithStock.length;
  if (productsRemovedByStock > 0) {
    console.log(`   ⚠️  Produtos sem estoque (3 colunas zeradas): ${productsRemovedByStock}`);
  }
  
  if (productsRemovedByHighAcos.length > 0) {
    console.log(`   ⚠️  Produtos com ACOS alto (> 20%): ${productsRemovedByHighAcos.length}`);
  }

  if (productsRemovedByNegativeMargin.length > 0) {
    console.log(`   ⚠️  Produtos com margem negativa: ${productsRemovedByNegativeMargin.length}`);
  }

  if (productsRemovedByZeroRevenue.length > 0) {
    console.log(`   ⚠️  Produtos com faturamento zero: ${productsRemovedByZeroRevenue.length}`);
  }
  
  console.log(`   ✅ Produtos válidos para análise: ${productsWithRevenue.length}`);
  console.log(`   Faturamento total: R$ ${totalRevenue.toFixed(2)}`);
  console.log(`   TACOS Objetivo: ${tacosObjetivo}%`);
  console.log(`   Investimento mensal: R$ ${(totalRevenue * tacosObjetivo / 100).toFixed(2)}`);
  console.log(`   Orçamento diário (sem buffer): R$ ${(totalRevenue * tacosObjetivo / 100 / 30).toFixed(2)}`);
  console.log(`   Orçamento diário (com +20%): R$ ${(totalRevenue * tacosObjetivo / 100 / 30 * 1.2).toFixed(2)}`);
  console.log(`   Produtos isoláveis (>= 1%): ${isolatedProducts.length}`);
  console.log(`   Produtos agrupáveis (< 1%): ${groupableProducts.length}`);
  console.log(`   Mínimo para grupo: R$ ${(totalRevenue * 0.01).toFixed(2)}`);

  // Se nenhum produto qualificado, mostrar detalhes
  if (isolatedProducts.length === 0 && groupableProducts.length === 0) {
    console.log('\n⚠️  AVISO: Nenhum produto qualificado!');
    console.log('   Primeiros 5 produtos analisados:');
    products.slice(0, 5).forEach((p, idx) => {
      console.log(`   ${idx + 1}. ${p.name} | Faturamento: R$ ${p.faturamento.toFixed(2)} (${p.revenuePercentage.toFixed(2)}%) | Margem: ${p.margem}%`);
    });
  }

  // Calcular faturamento por curva para ROAS dinâmico
  const revenueByCurve = { A: 0, B: 0, C: 0 };
  isolatedProducts.forEach((p) => {
    revenueByCurve[p.curve] = (revenueByCurve[p.curve] || 0) + p.faturamento;
  });
  groupableProducts.forEach((p) => {
    revenueByCurve[p.curve] = (revenueByCurve[p.curve] || 0) + p.faturamento;
  });

  // Gerar campanhas
  const campaigns = [];

  // Campanhas isoladas
  isolatedProducts.forEach((product) => {
    const campaignName = generateCampaignName(product, true);
    const revenuePercentageInCurve = (product.faturamento / (revenueByCurve[product.curve] || product.faturamento)) * 100;

    campaigns.push({
      nome: campaignName,
      roasObjetivo: getRoasTarget(product.curve, revenuePercentageInCurve),
      tipo: 'Isolada',
      products: [product.name],
      mlbs: [product.itemId],
      quantidadeProdutos: 1,
      faturamento: product.faturamento,
    });
  });

  // Campanhas agrupadas
  const groups = groupProducts(groupableProducts, totalRevenue);
  groups.forEach((group) => {
    const campaignName = generateCampaignName(group, false);
    const groupRevenue = group.products.reduce((sum, p) => sum + p.faturamento, 0);
    const revenuePercentageInCurve = (groupRevenue / (revenueByCurve[group.curve] || groupRevenue)) * 100;

    campaigns.push({
      nome: campaignName,
      roasObjetivo: getRoasTarget(group.curve, revenuePercentageInCurve),
      tipo: 'Agrupada',
      products: group.products.map((p) => p.name),
      mlbs: group.products.map((p) => p.itemId),
      quantidadeProdutos: group.products.length,
      faturamento: groupRevenue,
    });
  });

  // Calcular orçamento total e distribuir proporcionalmente
  const totalCampaignRevenue = campaigns.reduce((sum, c) => sum + c.faturamento, 0);
  const totalDailyBudget = calculateDailyBudgetTacos(totalRevenue, totalRevenue, tacosObjetivo);

  campaigns.forEach((campaign) => {
    // Distribuir o orçamento total proporcional ao faturamento da campanha
    const revenueShare = campaign.faturamento / totalCampaignRevenue;
    const budgetBeforeRounding = totalDailyBudget * revenueShare;
    // Arredondar para cima para o múltiplo mais próximo de 5
    campaign.orcamentoDiario = Math.ceil(budgetBeforeRounding / 5) * 5;
  });

  // Log final
  console.log(`   Campanhas isoladas geradas: ${campaigns.filter((c) => c.tipo === 'Isolada').length}`);
  console.log(`   Campanhas agrupadas geradas: ${campaigns.filter((c) => c.tipo === 'Agrupada').length}`);
  console.log(`   TOTAL: ${campaigns.length} campanhas`);
  console.log(`   Orçamento TOTAL diário: R$ ${campaigns.reduce((sum, c) => sum + c.orcamentoDiario, 0).toFixed(2)}\n`);

  return {
    success: true,
    resumo: {
      totalProdutos: products.length,
      produtosAnalisados: productsWithRevenue.length,
      faturamentoTotal: totalRevenue,
      campanhasIsoladas: isolatedProducts.length,
      campanhasAgrupadas: campaigns.filter((c) => c.tipo === 'Agrupada').length,
    },
    exclusoes: {
      porMargemNegativa: productsRemovedByNegativeMargin,
      porHighAcos: productsRemovedByHighAcos,
      porFaturamentoZero: productsRemovedByZeroRevenue,
      porZeroStockComFaturamento: productsZeroStockWithRevenue,
      porZeroStockSemFaturamento: productsZeroStockWithoutRevenue,
    },
    campanhas: campaigns.sort((a, b) => b.faturamento - a.faturamento),
  };
}

function getRoasTarget(curve, revenuePercentageInCurve = 50) {
  const roasMap = {
    A: { high: 12, medium: 11, low: 10 },
    B: { high: 8, medium: 7, low: 6 },
    C: { high: 6, medium: 5, low: 4 },
  };

  const roasOptions = roasMap[curve] || roasMap.C;
  if (revenuePercentageInCurve >= 30) return roasOptions.high;
  if (revenuePercentageInCurve >= 12) return roasOptions.medium;
  return roasOptions.low;
}

function calculateDailyBudgetTacos(productRevenue, totalRevenue, tacosObjetivo) {
  // Fórmula: (Faturamento Total * TACOS% / 100) / 30 dias * 1.2 (buffer 20%)
  const monthlyInvestment = (totalRevenue * tacosObjetivo) / 100;
  const dailyBudget = (monthlyInvestment / 30) * 1.2; // +20% buffer
  return Math.round(dailyBudget * 100) / 100;
}
