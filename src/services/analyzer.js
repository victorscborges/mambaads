import * as XLSX from 'xlsx';
import { generateCampaignName, getRoasTarget, groupProducts } from '../utils/campaignLogic.js';

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
  const productsWithGoodAcos = productsWithStock.filter((product) => product.acos <= 0.2);
  const productsRemovedByHighAcos = productsWithStock.filter((product) => product.acos > 0.2);

  const productsRemovedByNegativeMargin = productsWithGoodAcos.filter((product) => product.margem < 0);
  const productsWithValidMargin = productsWithGoodAcos.filter((product) => product.margem >= 0);

  const productsRemovedByZeroRevenue = productsWithValidMargin.filter((product) => product.faturamento === 0);
  const productsWithRevenue = productsWithValidMargin.filter((product) => product.faturamento > 0);

  const isolatedProducts = productsWithRevenue.filter((product) => product.revenuePercentage >= 1);
  const groupableProducts = productsWithRevenue.filter((product) => product.revenuePercentage < 1);

  console.log('\n[ANALYZER] Resumo da analise:');
  console.log(`  Total de produtos: ${products.length}`);
  console.log(`  Produtos sem estoque: ${productsRemovedByStockZero.length}`);
  console.log(`  Produtos com ACOS alto: ${productsRemovedByHighAcos.length}`);
  console.log(`  Produtos com margem negativa: ${productsRemovedByNegativeMargin.length}`);
  console.log(`  Produtos com faturamento zero: ${productsRemovedByZeroRevenue.length}`);
  console.log(`  Produtos validos para campanhas: ${productsWithRevenue.length}`);
  console.log(`  Faturamento total: R$ ${totalRevenue.toFixed(2)}`);
  console.log(`  TACOS objetivo: ${tacosObjetivo}%`);

  const revenueByCurve = { A: 0, B: 0, C: 0 };
  [...isolatedProducts, ...groupableProducts].forEach((product) => {
    revenueByCurve[product.curve] = (revenueByCurve[product.curve] || 0) + product.faturamento;
  });

  const campaigns = [];

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
    });
  });

  const totalCampaignRevenue = campaigns.reduce((sum, campaign) => sum + campaign.faturamento, 0);
  const totalDailyBudgetTarget = calculateDailyBudgetTacos(totalRevenue, tacosObjetivo);
  distributeRoundedDailyBudgets(campaigns, totalCampaignRevenue, totalDailyBudgetTarget);

  const totalDailyBudgetRounded = roundToTwo(
    campaigns.reduce((sum, campaign) => sum + campaign.orcamentoDiario, 0)
  );
  const totalMonthlyBudgetRounded = roundToTwo(totalDailyBudgetRounded * 30);

  console.log(`  Campanhas isoladas: ${campaigns.filter((campaign) => campaign.tipo === 'Isolada').length}`);
  console.log(`  Campanhas agrupadas: ${campaigns.filter((campaign) => campaign.tipo === 'Agrupada').length}`);
  console.log(`  Orçamento diario alvo: R$ ${totalDailyBudgetTarget.toFixed(2)}`);
  console.log(`  Orçamento diario arredondado: R$ ${totalDailyBudgetRounded.toFixed(2)}\n`);

  return {
    success: true,
    resumo: {
      totalProdutos: products.length,
      produtosAnalisados: productsWithRevenue.length,
      faturamentoTotal: roundToTwo(totalRevenue),
      campanhasIsoladas: isolatedProducts.length,
      campanhasAgrupadas: campaigns.filter((campaign) => campaign.tipo === 'Agrupada').length,
      tacosObjetivo,
      orcamentoDiarioTotal: totalDailyBudgetRounded,
      orcamentoMensalTotal: totalMonthlyBudgetRounded,
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

    if (accumulatedPercentage >= 80 && !Number.isFinite(curvaAThreshold)) {
      curvaAThreshold = revenuePercentage;
    }

    if (accumulatedPercentage >= 95 && !Number.isFinite(curvaBThreshold)) {
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

function roundToTwo(value) {
  return Math.round(value * 100) / 100;
}
