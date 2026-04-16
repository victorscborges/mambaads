/**
 * Classifica um produto em uma curva (A, B ou C) baseado no Pareto
 * Curva A: 20% dos produtos que geram ~80% do faturamento
 * Curva B: Intermediários
 * Curva C: Longa cauda
 */
export function classifyCurve(product, totalRevenue) {
  const revenuePercentage = (product.faturamento / totalRevenue) * 100;

  // Acumulado de 80% = Curva A
  if (revenuePercentage >= 5) {
    return 'A';
  }

  // Intermediário = Curva B
  if (revenuePercentage >= 1) {
    return 'B';
  }

  // Resto = Curva C
  return 'C';
}

/**
 * Gera o nome da campanha seguindo as regras:
 * MAMBA + Curva + Ticket (se relevante) + Categoria/Family (se relevante) + SKU (apenas isoladas)
 * Exemplo: MAMBA-A-150-200 ou MAMBA-A-SKU123
 */
export function generateCampaignName(productOrGroup, isIsolated) {
  let parts = ['MAMBA'];

  // Adicionar Curva
  const curve = productOrGroup.curve || 'A';
  parts.push(curve);

  if (isIsolated) {
    // Para campanhas isoladas: incluir o ticket se significativo
    const ticket = productOrGroup.ticket || 0;
    if (ticket > 0) {
      const ticketRange = getTicketRange(ticket);
      parts.push(ticketRange);
    }

    // Adicionar Item Id para isoladas (não SKU)
    const itemId = productOrGroup.itemId;
    if (itemId && itemId !== 'N/A') {
      parts.push(itemId.toUpperCase().substring(0, 20));
    } else {
      // Fallback para SKU se não tiver Item Id
      const sku = productOrGroup.sku;
      if (sku && sku !== 'N/A') {
        parts.push(sku.toUpperCase().substring(0, 20));
      }
    }
  } else {
    // Para campanhas agrupadas: usar ticket range
    const avgTicket = productOrGroup.avgTicket || 0;
    if (avgTicket > 0) {
      const ticketRange = getTicketRange(avgTicket);
      parts.push(ticketRange);
    }
  }

  return parts.join('-');
}

/**
 * Determina a faixa de ticket (100 em 100 reais)
 * R$ 0-99 = 0-100
 * R$ 100-199 = 100-200
 * etc.
 */
function getTicketRange(ticket) {
  if (ticket <= 0) return null;

  const lower = Math.floor(ticket / 100) * 100;
  const upper = lower + 100;

  return `${lower}-${upper}`;
}

/**
 * Agrupa produtos que não serão isolados conforme regras:
 * - Mesma curva
 * - Ticket similar (mesma faixa de 100)
 * - Sem requisito de mínimo 1% (todos os produtos agrupáveis são incluídos)
 */
export function groupProducts(groupableProducts, totalRevenue) {
  const groups = [];

  // Agrupar por curva e ticket range
  const groupMap = {};

  groupableProducts.forEach((product) => {
    const curve = product.curve;
    const ticketRange = getTicketRange(product.ticket);
    const key = `${curve}-${ticketRange || 'sem-ticket'}`;

    if (!groupMap[key]) {
      groupMap[key] = [];
    }

    groupMap[key].push(product);
  });

  // Processar grupos - SEM requisito de mínimo 1%
  Object.entries(groupMap).forEach(([key, products]) => {
    const groupRevenue = products.reduce((sum, p) => sum + p.faturamento, 0);
    const avgMargin = products.length > 0
      ? products.reduce((sum, p) => sum + p.margem, 0) / products.length
      : 0;
    const avgTicket = products.length > 0
      ? products.reduce((sum, p) => sum + p.ticket, 0) / products.length
      : 0;

    // Incluir TODOS os grupos, mesmo < 1%
    const [curve, ticketRange] = key.split('-');

    groups.push({
      key,
      curve,
      ticketRange: ticketRange !== 'sem-ticket' ? ticketRange : null,
      products,
      faturamento: groupRevenue,
      avgMargin,
      avgTicket,
    });
  });

  return groups;
}

/**
 * Retorna ROAS objetivo baseado na curva
 * ROAS Alto = Melhor retorno por investimento
 * Curva A: Principais, alta rentabilidade → ROAS alto (12x)
 * Curva B: Intermediários → ROAS equilibrado (8x)
 * Curva C: Longa cauda, baixa rentabilidade → ROAS baixo
 * 
 * ROAS DINÂMICO por faturamento relativo dentro da curva:
 * A: 12x (top 30% da curva), 11x (30-65%), 10x (resto)
 * B: 8x (top 30% da curva), 7x (30-65%), 6x (resto)
 * C: 6x (top 30% da curva), 5x (30-65%), 4x (resto)
 */
export function getRoasTarget(curve, revenuePercentageInCurve = 50) {
  const roasMap = {
    A: { high: 12, medium: 11, low: 10 },
    B: { high: 8, medium: 7, low: 6 },
    C: { high: 6, medium: 5, low: 4 },
  };

  const roasOptions = roasMap[curve] || roasMap.C;
  
  // Dinâmico baseado em percentual dentro da curva
  if (revenuePercentageInCurve >= 30) return roasOptions.high;
  if (revenuePercentageInCurve >= 12) return roasOptions.medium;
  return roasOptions.low;
}
