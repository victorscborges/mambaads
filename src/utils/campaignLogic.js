export function generateCampaignName(productOrGroup, isIsolated) {
  const parts = ['MAMBA', productOrGroup.curve || 'A'];

  if (isIsolated) {
    const ticketRange = getTicketRange(productOrGroup.ticket || 0);
    if (ticketRange) {
      parts.push(ticketRange);
    }

    const itemId = productOrGroup.itemId;
    const sku = productOrGroup.sku;
    const primaryIdentifier = itemId && itemId !== 'N/A' ? itemId : sku;

    if (primaryIdentifier && primaryIdentifier !== 'N/A') {
      parts.push(String(primaryIdentifier).toUpperCase().substring(0, 20));
    }
  } else {
    const ticketRange = getTicketRange(productOrGroup.avgTicket || 0);
    if (ticketRange) {
      parts.push(ticketRange);
    }
  }

  return parts.join('-');
}

export function groupProducts(groupableProducts) {
  const groups = [];
  const groupMap = new Map();

  groupableProducts.forEach((product) => {
    const curve = product.curve;
    const ticketRange = getTicketRange(product.ticket);
    const key = `${curve}-${ticketRange || 'sem-ticket'}`;

    if (!groupMap.has(key)) {
      groupMap.set(key, []);
    }

    groupMap.get(key).push(product);
  });

  for (const [key, products] of groupMap.entries()) {
    const groupRevenue = products.reduce((sum, product) => sum + product.faturamento, 0);
    const avgMargin =
      products.length > 0
        ? products.reduce((sum, product) => sum + product.margem, 0) / products.length
        : 0;
    const avgTicket =
      products.length > 0
        ? products.reduce((sum, product) => sum + product.ticket, 0) / products.length
        : 0;
    const separatorIndex = key.indexOf('-');
    const curve = separatorIndex >= 0 ? key.slice(0, separatorIndex) : key;
    const ticketRange = separatorIndex >= 0 ? key.slice(separatorIndex + 1) : null;

    groups.push({
      key,
      curve,
      ticketRange: ticketRange !== 'sem-ticket' ? ticketRange : null,
      products,
      faturamento: groupRevenue,
      avgMargin,
      avgTicket,
    });
  }

  return groups;
}

export function getRoasTarget(curve, revenuePercentageInCurve = 50) {
  const roasMap = {
    A: { high: 12, medium: 11, low: 10 },
    B: { high: 8, medium: 7, low: 6 },
    C: { high: 6, medium: 5, low: 4 },
  };

  const roasOptions = roasMap[curve] || roasMap.C;
  if (revenuePercentageInCurve >= 30) {
    return roasOptions.high;
  }
  if (revenuePercentageInCurve >= 12) {
    return roasOptions.medium;
  }
  return roasOptions.low;
}

export function getTicketRange(ticket) {
  if (ticket <= 0) {
    return null;
  }

  const lower = Math.floor(ticket / 100) * 100;
  const upper = lower + 100;
  return `${lower}-${upper}`;
}
