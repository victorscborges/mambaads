import * as XLSX from 'xlsx';
import { generateCampaignName, getRoasTarget, getTicketRange, groupProducts } from '../utils/campaignLogic.js';

const REVENUE_HEADERS = ['Faturamento', 'faturamento'];
const MARGIN_PERCENT_HEADERS = ['Margem %', 'margem %', 'Margem', 'margem'];
const MARGIN_VALUE_HEADERS = ['Margem R$', 'margem r$'];
const TICKET_HEADERS = ['Preco Medio Venda', 'Preco Medio', 'Ticket Medio', 'ticket'];
const ADS_HEADERS = ['Investimento (ADS)', 'investimento (ads)', 'Investment'];
const SKU_HEADERS = ['Seller Sku', 'SKU', 'sku'];
const ITEM_ID_HEADERS = ['Item Id', 'item id'];
const NAME_HEADERS = ['Anuncio', 'Produto', 'produto'];
const ROAS_HEADERS = ['ROAS', 'roas'];
const VISITS_HEADERS = ['Visitas', 'visits'];
const SALES_HEADERS = ['Un. Vendidas', 'Vendas', 'vendas'];
const CPC_HEADERS = ['CPC', 'cpc'];
const STOCK_MAIN_HEADERS = ['Estoque Principal', 'estoque principal'];
const STOCK_SELLER_HEADERS = ['Estoque Seller', 'estoque seller'];
const STOCK_FULL_HEADERS = ['Estoque Full', 'estoque full'];
const MAX_ACOS = 0.2;
const ISOLATED_REVENUE_THRESHOLD = 1;
const CURVE_A_CUMULATIVE_THRESHOLD = 80;
const CURVE_B_CUMULATIVE_THRESHOLD = 95;

export async function analyzeSpreadsheet(buffer, tacosObjetivo = 5) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(worksheet);

  if (!data || data.length === 0) {
    throw new Error('Planilha vazia ou formato invalido');
  }

  const headers = Object.keys(data[0]);
  console.log('\n[ANALYZER] Colunas encontradas na planilha:');
  console.log(`  ${headers.join(' | ')}\n`);

  const totalRevenue = data.reduce((sum, row) => sum + getNumericCell(row, REVENUE_HEADERS), 0);

  const products = data.map((row) => {
    const revenue = getNumericCell(row, REVENUE_HEADERS);
    const revenuePercentage = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;

    let margin = getNumericCell(row, MARGIN_PERCENT_HEADERS);
    if (margin === 0) {
      const marginValue = getNumericCell(row, MARGIN_VALUE_HEADERS);
      if (marginValue !== 0 && revenue > 0) {
        margin = (marginValue / revenue) * 100;
      }
    }

    const avgTicket = getNumericCell(row, TICKET_HEADERS);
    const adsInvestment = getNumericCell(row, ADS_HEADERS);
    const acos = revenue > 0 ? adsInvestment / revenue : 0;

    return {
      sku: getTextCell(row, SKU_HEADERS, 'N/A'),
      itemId: getTextCell(row, ITEM_ID_HEADERS, 'N/A'),
      name: getTextCell(row, NAME_HEADERS, 'Sem nome'),
      faturamento: revenue,
      revenuePercentage,
      margem: margin,
      ticket: avgTicket,
      acos,
      adsInvestment,
      cursor: getTextCell(row, ROAS_HEADERS, 'N/A'),
      visits: getNumericCell(row, VISITS_HEADERS),
      sales: getNumericCell(row, SALES_HEADERS),
      cpc: getNumericCell(row, CPC_HEADERS),
      estoquePrincipal: getNumericCell(row, STOCK_MAIN_HEADERS),
      estoqueSeller: getNumericCell(row, STOCK_SELLER_HEADERS),
      estoqueFull: getNumericCell(row, STOCK_FULL_HEADERS),
    };
  });

  const { curvaAThreshold, curvaBThreshold } = calculateCurveThresholds(products, totalRevenue);
  const classifiedProducts = products.map((product) => ({
    ...product,
    curve: classifyByThreshold(product.revenuePercentage, curvaAThreshold, curvaBThreshold),
  }));

  const productsRemovedByStockZero = classifiedProducts.filter(hasZeroStockInAllLocations);
  const productsZeroStockWithRevenue = productsRemovedByStockZero.filter((product) => product.faturamento > 0);
  const productsZeroStockWithoutRevenue = productsRemovedByStockZero.filter((product) => product.faturamento === 0);

  const productsWithStock = classifiedProducts.filter((product) => !hasZeroStockInAllLocations(product));
  const productsWithGoodAcos = productsWithStock.filter((product) => product.acos <= MAX_ACOS);
  const productsRemovedByHighAcos = productsWithStock.filter((product) => product.acos > MAX_ACOS);

  const productsRemovedByNegativeMargin = productsWithGoodAcos.filter((product) => product.margem < 0);
  const productsWithValidMargin = productsWithGoodAcos.filter((product) => product.margem >= 0);

  const productsRemovedByZeroRevenue = productsWithValidMargin.filter((product) => product.faturamento === 0);
  const productsWithRevenue = productsWithValidMargin.filter((product) => product.faturamento > 0);
  const opportunityProducts = productsWithRevenue.filter((product) => product.adsInvestment <= 0);

  console.log('\n[ANALYZER] Resumo da analise:');
  console.log(`  Total de produtos: ${products.length}`);
  console.log(`  Produtos sem estoque: ${productsRemovedByStockZero.length}`);
  console.log(`  Produtos com ACOS alto: ${productsRemovedByHighAcos.length}`);
  console.log(`  Produtos com margem negativa: ${productsRemovedByNegativeMargin.length}`);
  console.log(`  Produtos com faturamento zero: ${productsRemovedByZeroRevenue.length}`);
  console.log(`  Produtos validos para campanhas: ${productsWithRevenue.length}`);
  console.log(`  Produtos sem ADS com oportunidade: ${opportunityProducts.length}`);
  console.log(`  Faturamento total: R$ ${totalRevenue.toFixed(2)}`);
  console.log(`  TACOS objetivo: ${tacosObjetivo}%`);

  const campaigns = buildCampaigns(productsWithRevenue, totalRevenue, tacosObjetivo, 'campanhas');
  const opportunityRevenue = opportunityProducts.reduce((sum, product) => sum + product.faturamento, 0);
  const opportunityCampaigns = buildCampaigns(
    opportunityProducts,
    opportunityRevenue,
    tacosObjetivo,
    'oportunidades'
  );

  const totalDailyBudgetRounded = roundToTwo(
    campaigns.reduce((sum, campaign) => sum + campaign.orcamentoDiario, 0)
  );
  const totalMonthlyBudgetRounded = roundToTwo(totalDailyBudgetRounded * 30);
  const totalOpportunityBudgetRounded = roundToTwo(
    opportunityCampaigns.reduce((sum, campaign) => sum + campaign.orcamentoDiario, 0)
  );
  const totalOpportunityMonthlyBudgetRounded = roundToTwo(totalOpportunityBudgetRounded * 30);

  console.log(`  Campanhas isoladas: ${campaigns.filter((campaign) => campaign.tipo === 'Isolada').length}`);
  console.log(`  Campanhas agrupadas: ${campaigns.filter((campaign) => campaign.tipo === 'Agrupada').length}`);
  console.log(`  Campanhas de oportunidade: ${opportunityCampaigns.length}`);
  console.log(`  Orcamento diario arredondado: R$ ${totalDailyBudgetRounded.toFixed(2)}`);
  console.log(`  Orcamento diario de oportunidades: R$ ${totalOpportunityBudgetRounded.toFixed(2)}\n`);

  return {
    success: true,
    resumo: {
      totalProdutos: products.length,
      produtosAnalisados: productsWithRevenue.length,
      faturamentoTotal: roundToTwo(totalRevenue),
      campanhasIsoladas: campaigns.filter((campaign) => campaign.tipo === 'Isolada').length,
      campanhasAgrupadas: campaigns.filter((campaign) => campaign.tipo === 'Agrupada').length,
      oportunidadesProdutos: opportunityProducts.length,
      oportunidadesCampanhas: opportunityCampaigns.length,
      tacosObjetivo,
      orcamentoDiarioTotal: totalDailyBudgetRounded,
      orcamentoMensalTotal: totalMonthlyBudgetRounded,
    },
    oportunidades: {
      quantidadeProdutos: opportunityProducts.length,
      quantidadeCampanhas: opportunityCampaigns.length,
      orcamentoDiarioTotal: totalOpportunityBudgetRounded,
      orcamentoMensalTotal: totalOpportunityMonthlyBudgetRounded,
      campanhas: opportunityCampaigns,
    },
    exclusoes: {
      porMargemNegativa: annotateExcludedProducts(productsRemovedByNegativeMargin, 'margem-negativa'),
      porHighAcos: annotateExcludedProducts(productsRemovedByHighAcos, 'high-acos'),
      porFaturamentoZero: annotateExcludedProducts(productsRemovedByZeroRevenue, 'faturamento-zero'),
      porZeroStockComFaturamento: annotateExcludedProducts(
        productsZeroStockWithRevenue,
        'zero-stock-com-faturamento'
      ),
      porZeroStockSemFaturamento: annotateExcludedProducts(
        productsZeroStockWithoutRevenue,
        'zero-stock-sem-faturamento'
      ),
    },
    campanhas: campaigns,
  };
}

function buildCampaigns(productsForCampaigns, budgetBaseRevenue, tacosObjetivo, analysisType = 'campanhas') {
  const isolatedProducts = productsForCampaigns.filter(
    (product) => product.revenuePercentage >= ISOLATED_REVENUE_THRESHOLD
  );
  const groupableProducts = productsForCampaigns.filter(
    (product) => product.revenuePercentage < ISOLATED_REVENUE_THRESHOLD
  );
  const revenueByCurve = { A: 0, B: 0, C: 0 };
  const campaigns = [];

  [...isolatedProducts, ...groupableProducts].forEach((product) => {
    revenueByCurve[product.curve] = (revenueByCurve[product.curve] || 0) + product.faturamento;
  });

  isolatedProducts.forEach((product) => {
    const revenuePercentageInCurve =
      (product.faturamento / (revenueByCurve[product.curve] || product.faturamento)) * 100;

    campaigns.push({
      nome: generateCampaignName(product, true),
      roasObjetivo: getRoasTarget(product.curve, revenuePercentageInCurve),
      tipo: 'Isolada',
      products: [product.name],
      mlbs: [product.itemId],
      quantidadeProdutos: 1,
      faturamento: roundToTwo(product.faturamento),
      curva: product.curve,
      faixaTicket: getTicketRange(product.ticket || 0),
      participacaoFaturamentoTotal: roundToTwo(product.revenuePercentage),
      participacaoNaCurva: roundToTwo(revenuePercentageInCurve),
      tipoAnalise: analysisType,
    });
  });

  const groups = groupProducts(groupableProducts);
  groups.forEach((group) => {
    const groupRevenue = group.products.reduce((sum, product) => sum + product.faturamento, 0);
    const revenuePercentageInCurve =
      (groupRevenue / (revenueByCurve[group.curve] || groupRevenue)) * 100;

    campaigns.push({
      nome: generateCampaignName(group, false),
      roasObjetivo: getRoasTarget(group.curve, revenuePercentageInCurve),
      tipo: 'Agrupada',
      products: group.products.map((product) => product.name),
      mlbs: group.products.map((product) => product.itemId),
      quantidadeProdutos: group.products.length,
      faturamento: roundToTwo(groupRevenue),
      curva: group.curve,
      faixaTicket: group.ticketRange,
      participacaoFaturamentoTotal:
        budgetBaseRevenue > 0 ? roundToTwo((groupRevenue / budgetBaseRevenue) * 100) : 0,
      participacaoNaCurva: roundToTwo(revenuePercentageInCurve),
      tipoAnalise: analysisType,
    });
  });

  const totalCampaignRevenue = campaigns.reduce((sum, campaign) => sum + campaign.faturamento, 0);
  const totalDailyBudgetTarget = calculateDailyBudgetTacos(budgetBaseRevenue, tacosObjetivo);
  distributeRoundedDailyBudgets(campaigns, totalCampaignRevenue, totalDailyBudgetTarget);

  campaigns.forEach((campaign) => {
    campaign.participacaoFaturamentoCampanhas =
      totalCampaignRevenue > 0 ? roundToTwo((campaign.faturamento / totalCampaignRevenue) * 100) : 0;
    campaign.criterios = buildCampaignCriteria(campaign, tacosObjetivo, totalDailyBudgetTarget);
  });

  return campaigns.sort((a, b) => b.faturamento - a.faturamento);
}

function getNumericCell(row, candidates) {
  const rawValue = getFirstDefinedValue(row, candidates);
  return normalizeNumber(rawValue);
}

function getTextCell(row, candidates, fallback = '') {
  const rawValue = getFirstDefinedValue(row, candidates);
  if (rawValue === undefined || rawValue === null || rawValue === '') {
    return fallback;
  }

  return String(rawValue).trim() || fallback;
}

function getFirstDefinedValue(row, candidates) {
  for (const candidate of candidates) {
    const normalizedCandidate = normalizeHeader(candidate);

    for (const [key, value] of Object.entries(row)) {
      if (normalizeHeader(key) === normalizedCandidate && value !== undefined && value !== null && value !== '') {
        return value;
      }
    }
  }

  return undefined;
}

function normalizeHeader(value) {
  return String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function normalizeNumber(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  const cleaned = value.replace(/[^\d,.-]/g, '').trim();
  if (!cleaned) {
    return 0;
  }

  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  let normalized = cleaned;

  if (hasComma && hasDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  } else if (hasDot && /^-?\d{1,3}(\.\d{3})+$/.test(cleaned)) {
    normalized = cleaned.replace(/\./g, '');
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function calculateCurveThresholds(products, totalRevenue) {
  const productsForThreshold = products.filter((product) => product.faturamento > 0);
  if (productsForThreshold.length === 0 || totalRevenue <= 0) {
    return { curvaAThreshold: Infinity, curvaBThreshold: Infinity };
  }

  const sorted = [...productsForThreshold].sort((a, b) => b.faturamento - a.faturamento);
  let accumulatedRevenue = 0;
  let curvaAThreshold = Infinity;
  let curvaBThreshold = Infinity;

  for (const product of sorted) {
    accumulatedRevenue += product.faturamento;
    const accumulatedPercentage = (accumulatedRevenue / totalRevenue) * 100;
    const revenuePercentage = (product.faturamento / totalRevenue) * 100;

    if (accumulatedPercentage >= CURVE_A_CUMULATIVE_THRESHOLD && !Number.isFinite(curvaAThreshold)) {
      curvaAThreshold = revenuePercentage;
    }

    if (accumulatedPercentage >= CURVE_B_CUMULATIVE_THRESHOLD && !Number.isFinite(curvaBThreshold)) {
      curvaBThreshold = revenuePercentage;
      break;
    }
  }

  if (!Number.isFinite(curvaAThreshold)) {
    curvaAThreshold = 0;
  }

  if (!Number.isFinite(curvaBThreshold)) {
    curvaBThreshold = 0;
  }

  return { curvaAThreshold, curvaBThreshold };
}

function classifyByThreshold(revenuePercentage, curvaAThreshold, curvaBThreshold) {
  if (revenuePercentage >= curvaAThreshold) {
    return 'A';
  }

  if (revenuePercentage >= curvaBThreshold) {
    return 'B';
  }

  return 'C';
}

function hasZeroStockInAllLocations(product) {
  return product.estoquePrincipal === 0 && product.estoqueSeller === 0 && product.estoqueFull === 0;
}

function calculateDailyBudgetTacos(totalRevenue, tacosObjetivo) {
  const monthlyInvestment = (totalRevenue * tacosObjetivo) / 100;
  const dailyBudget = (monthlyInvestment / 30) * 1.2;
  return roundToTwo(dailyBudget);
}

function distributeRoundedDailyBudgets(campaigns, totalCampaignRevenue, totalDailyBudgetTarget) {
  if (campaigns.length === 0 || totalCampaignRevenue <= 0 || totalDailyBudgetTarget <= 0) {
    campaigns.forEach((campaign) => {
      campaign.orcamentoDiario = 0;
    });
    return;
  }

  campaigns.forEach((campaign) => {
    const revenueShare = campaign.faturamento / totalCampaignRevenue;
    const budgetBeforeRounding = totalDailyBudgetTarget * revenueShare;
    campaign.orcamentoDiario = Math.ceil(budgetBeforeRounding / 5) * 5;
  });
}

function annotateExcludedProducts(products, reason) {
  return products.map((product) => ({
    ...product,
    criterioDecisao: buildExclusionCriterion(product, reason),
  }));
}

function buildExclusionCriterion(product, reason) {
  switch (reason) {
    case 'margem-negativa':
      return `Margem abaixo de 0% (${formatPercentage(product.margem)}), apos manter apenas produtos com estoque disponivel e ACOS ate ${formatPercentage(MAX_ACOS * 100)}.`;
    case 'high-acos':
      return `ACOS acima de ${formatPercentage(MAX_ACOS * 100)} (${formatPercentage(product.acos * 100)}), considerando apenas produtos com estoque disponivel.`;
    case 'faturamento-zero':
      return `Faturamento igual a R$ ${formatMoney(product.faturamento)} apos passar por estoque disponivel, ACOS ate ${formatPercentage(MAX_ACOS * 100)} e margem nao negativa.`;
    case 'zero-stock-com-faturamento':
      return `Estoque zerado em todos os pontos (principal ${product.estoquePrincipal}, seller ${product.estoqueSeller} e full ${product.estoqueFull}) com faturamento acima de zero (R$ ${formatMoney(product.faturamento)}).`;
    case 'zero-stock-sem-faturamento':
      return `Estoque zerado em todos os pontos (principal ${product.estoquePrincipal}, seller ${product.estoqueSeller} e full ${product.estoqueFull}) com faturamento igual a R$ ${formatMoney(product.faturamento)}.`;
    default:
      return 'Produto fora da campanha final pelos filtros de elegibilidade da analise.';
  }
}

function buildCampaignCriteria(campaign, tacosObjetivo, totalDailyBudgetTarget) {
  const criteria = [];

  if (campaign.tipoAnalise === 'oportunidades') {
    criteria.push(
      `Oportunidade criada apenas com produtos sem investimento em ADS, que ainda mantiveram estoque disponivel, ACOS ate ${formatPercentage(
        MAX_ACOS * 100
      )}, margem nao negativa e faturamento acima de zero.`
    );
  } else {
    criteria.push(
      `Campanha final composta apenas por produtos com estoque disponivel, ACOS ate ${formatPercentage(
        MAX_ACOS * 100
      )}, margem nao negativa e faturamento acima de zero.`
    );
  }

  criteria.push(
    `Curva ${campaign.curva} definida pela classificacao ABC de faturamento acumulado: ate ${formatPercentage(
      CURVE_A_CUMULATIVE_THRESHOLD
    )} para A, ate ${formatPercentage(CURVE_B_CUMULATIVE_THRESHOLD)} para B e restante em C.`
  );

  if (campaign.tipo === 'Isolada') {
    criteria.push(
      `Campanha isolada porque o produto representa ${formatPercentage(
        campaign.participacaoFaturamentoTotal
      )} do faturamento total, atingindo o corte minimo de ${formatPercentage(
        ISOLATED_REVENUE_THRESHOLD
      )}.`
    );
  } else {
    const faixaTicketText = campaign.faixaTicket
      ? ` e compartilham a faixa de ticket ${campaign.faixaTicket}`
      : '';

    criteria.push(
      `Campanha agrupada porque os produtos do grupo ficaram abaixo de ${formatPercentage(
        ISOLATED_REVENUE_THRESHOLD
      )} do faturamento total por item${faixaTicketText}, alem da mesma curva ${campaign.curva}.`
    );
  }

  criteria.push(
    `ROAS objetivo de ${campaign.roasObjetivo}x definido pela curva ${campaign.curva} e pela participacao de ${formatPercentage(
      campaign.participacaoNaCurva
    )} dentro da propria curva.`
  );

  criteria.push(
    `Orcamento diario de R$ ${formatMoney(
      campaign.orcamentoDiario
    )} alocado proporcionalmente a ${formatPercentage(
      campaign.participacaoFaturamentoCampanhas
    )} do faturamento das campanhas, dentro do pool diario de R$ ${formatMoney(
      totalDailyBudgetTarget
    )} calculado com TACOS ${formatPercentage(tacosObjetivo)}.`
  );

  return criteria;
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatPercentage(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}
