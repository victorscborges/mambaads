import React, { useMemo, useState } from 'react';

function Summary({ data, oportunidades, exclusoes }) {
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [showOpportunitiesReport, setShowOpportunitiesReport] = useState(false);
  const [showExclusoesReport, setShowExclusoesReport] = useState(false);
  const [showExclusoes, setShowExclusoes] = useState(false);

  const opportunityCampaigns = useMemo(() => {
    return oportunidades?.campanhas || [];
  }, [oportunidades]);

  const hasOportunidades = useMemo(() => {
    return Boolean(oportunidades?.quantidadeProdutos > 0 && opportunityCampaigns.length > 0);
  }, [oportunidades, opportunityCampaigns]);

  const exclusionGroups = useMemo(() => buildExclusionGroups(exclusoes), [exclusoes]);

  const hasExclusoes = exclusionGroups.length > 0;

  const totalExclusoes = useMemo(() => {
    return exclusionGroups.reduce((total, group) => total + group.items.length, 0);
  }, [exclusionGroups]);

  const opportunitiesReport = useMemo(() => {
    if (!hasOportunidades) {
      return '';
    }

    return buildCampaignsReport('RELATORIO DE OPORTUNIDADES', opportunityCampaigns, {
      quantidadeProdutos: oportunidades.quantidadeProdutos,
      orcamentoDiarioTotal: oportunidades.orcamentoDiarioTotal,
      orcamentoMensalTotal: oportunidades.orcamentoMensalTotal,
    });
  }, [hasOportunidades, oportunidades, opportunityCampaigns]);

  const exclusoesReport = useMemo(() => {
    return buildExclusionsReport(exclusionGroups);
  }, [exclusionGroups]);

  const handleCopyExclusoesReport = async () => {
    await navigator.clipboard.writeText(exclusoesReport);
  };

  const handleCopyOpportunitiesReport = async () => {
    await navigator.clipboard.writeText(opportunitiesReport);
  };

  return (
    <div className="summary-container">
      <h2>Resumo da Analise</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <h3>Total de Produtos</h3>
          <div className="value">{data.totalProdutos}</div>
          <div className="subtitle">Arquivo enviado</div>
        </div>
        <div className="summary-card">
          <h3>Analisados</h3>
          <div className="value">{data.produtosAnalisados}</div>
          <div className="subtitle">Produtos com campanha</div>
        </div>
        <div className="summary-card">
          <h3>Faturamento Total</h3>
          <div className="value">R$ {(data.faturamentoTotal / 1000).toFixed(1)}k</div>
          <div className="subtitle">Base da analise</div>
        </div>
        <div className="summary-card">
          <h3>Campanhas</h3>
          <div className="value">{data.campanhasIsoladas + data.campanhasAgrupadas}</div>
          <div className="subtitle">{data.campanhasIsoladas} isoladas + {data.campanhasAgrupadas} agrupadas</div>
        </div>
        <div className="summary-card">
          <h3>Oportunidades</h3>
          <div className="value">{data.oportunidadesProdutos}</div>
          <div className="subtitle">Produtos que podem entrar em ADS</div>
        </div>
        <div className="summary-card">
          <h3>TACOS Objetivo</h3>
          <div className="value">{Number(data.tacosObjetivo).toFixed(1)}%</div>
          <div className="subtitle">Valor considerado no calculo</div>
        </div>
        <div className="summary-card">
          <h3>Orcamento Diario</h3>
          <div className="value">R$ {Number(data.orcamentoDiarioTotal).toFixed(2)}</div>
          <div className="subtitle">Soma dos valores arredondados</div>
        </div>
      </div>

      {hasOportunidades && (
        <div className="exclusoes-section">
          <div className="exclusoes-header">
            <div>
              <h3>Analise de Oportunidades</h3>
              <p className="exclusoes-meta">
                {oportunidades.quantidadeProdutos} produtos sem ADS podem entrar em publicidade em{' '}
                {oportunidades.quantidadeCampanhas} novas campanhas
              </p>
            </div>

            <div className="exclusoes-actions">
              <button
                className="toggle-exclusoes-btn"
                onClick={() => setShowOpportunities((value) => !value)}
              >
                {showOpportunities ? 'Ocultar lista' : 'Exibir lista'}
              </button>

              {showOpportunities && (
                <>
                  <button
                    className="report-button-small"
                    onClick={() => setShowOpportunitiesReport((value) => !value)}
                  >
                    {showOpportunitiesReport ? 'Fechar relatorio' : 'Ver relatorio'}
                  </button>
                  {showOpportunitiesReport && (
                    <button
                      className="copy-report-button-small"
                      onClick={handleCopyOpportunitiesReport}
                    >
                      Copiar relatorio
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={`exclusoes-content ${showOpportunities ? 'expanded' : 'collapsed'}`}>
            {showOpportunities &&
              (showOpportunitiesReport ? (
                <div className="report-box">
                  <pre>{opportunitiesReport}</pre>
                </div>
              ) : (
                <>
                  {opportunityCampaigns.map((campaign, index) => (
                    <div className="oportunidade-grupo" key={`${campaign.nome}-${index}`}>
                      <h4>{campaign.nome}</h4>
                      <p>
                        Tipo: {campaign.tipo} | ROAS Objetivo: {campaign.roasObjetivo}x | Orcamento Diario: R${' '}
                        {campaign.orcamentoDiario.toFixed(2)}
                      </p>
                      <p>
                        Produtos: {campaign.quantidadeProdutos} | Faturamento: R$ {campaign.faturamento.toFixed(2)}
                      </p>
                      <p>MLBs: {campaign.mlbs.join(', ')}</p>
                      {renderCriteriaList(campaign.criterios, `opportunity-${index}`)}
                    </div>
                  ))}
                </>
              ))}
          </div>
        </div>
      )}

      {hasExclusoes && (
        <div className="exclusoes-section">
          <div className="exclusoes-header">
            <div>
              <h3>Analise de Exclusoes</h3>
              <p className="exclusoes-meta">{totalExclusoes} anuncios fora da campanha final</p>
            </div>

            <div className="exclusoes-actions">
              <button
                className="toggle-exclusoes-btn"
                onClick={() => setShowExclusoes((value) => !value)}
              >
                {showExclusoes ? 'Ocultar lista' : 'Exibir lista'}
              </button>

              {showExclusoes && (
                <>
                  <button
                    className="report-button-small"
                    onClick={() => setShowExclusoesReport((value) => !value)}
                  >
                    {showExclusoesReport ? 'Fechar relatorio' : 'Ver relatorio'}
                  </button>
                  {showExclusoesReport && (
                    <button
                      className="copy-report-button-small"
                      onClick={handleCopyExclusoesReport}
                    >
                      Copiar relatorio
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <div className={`exclusoes-content ${showExclusoes ? 'expanded' : 'collapsed'}`}>
            {showExclusoes &&
              (showExclusoesReport ? (
                <div className="report-box">
                  <pre>{exclusoesReport}</pre>
                </div>
              ) : (
                <>
                  {exclusionGroups.map((group) => (
                    <div className="exclusao-grupo" key={group.key}>
                      <h4>
                        {group.title} ({group.items.length})
                      </h4>
                      <p className="decision-group-criterion">
                        <strong>Criterio base:</strong> {group.groupCriterion}
                      </p>
                      <ul>
                        {group.items.map((product, index) => (
                          <li key={`${group.key}-${product.itemId}-${index}`}>
                            <span className="decision-item-label">{group.describe(product)}</span>
                            <span className="decision-item-criterion">
                              <strong>Criterio:</strong> {product.criterioDecisao || group.groupCriterion}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderCriteriaList(criteria, keyPrefix) {
  if (!criteria?.length) {
    return null;
  }

  return (
    <ul className="decision-criteria">
      {criteria.map((criterion, index) => (
        <li key={`${keyPrefix}-${index}`}>{criterion}</li>
      ))}
    </ul>
  );
}

function buildCampaignsReport(title, campaigns, totals) {
  let report = '='.repeat(60) + '\n';
  report += `${title}\n`;
  report += '='.repeat(60) + '\n\n';
  report += `Total de Campanhas: ${campaigns.length}\n`;
  report += `Produtos Elegiveis: ${totals.quantidadeProdutos}\n`;
  report += `Orcamento Diario Total: R$ ${Number(totals.orcamentoDiarioTotal).toFixed(2)}\n`;
  report += `Orcamento Mensal Total: R$ ${Number(totals.orcamentoMensalTotal).toFixed(2)}\n`;
  report += `Faturamento Total: R$ ${campaigns.reduce((sum, campaign) => sum + campaign.faturamento, 0).toFixed(2)}\n\n`;
  report += '-'.repeat(60) + '\n\n';

  campaigns.forEach((campaign, index) => {
    report += `${index + 1}. ${campaign.nome}\n`;
    report += `   Tipo: ${campaign.tipo}\n`;
    report += `   ROAS Objetivo: ${campaign.roasObjetivo}x\n`;
    report += `   Orcamento Diario: R$ ${campaign.orcamentoDiario.toFixed(2)}\n`;
    report += `   Quantidade de Produtos: ${campaign.quantidadeProdutos}\n`;
    report += '   MLBs:\n';
    campaign.mlbs.forEach((mlb) => {
      report += `      - ${mlb}\n`;
    });
    report += '\n';
  });

  report += '-'.repeat(60) + '\n';
  report += `Orcamento Diario TOTAL: R$ ${Number(totals.orcamentoDiarioTotal).toFixed(2)}\n`;
  report += `Orcamento Mensal TOTAL: R$ ${Number(totals.orcamentoMensalTotal).toFixed(2)}\n`;
  report += '='.repeat(60) + '\n';

  return report;
}

function buildExclusionsReport(groups) {
  if (!groups.length) {
    return '';
  }

  let report = 'RELATORIO DE EXCLUSOES\n';
  report += '='.repeat(60) + '\n\n';

  groups.forEach((group) => {
    report += `${group.title} (${group.items.length})\n`;
    report += '-'.repeat(60) + '\n';

    group.items.forEach((product) => {
      report += `- ${group.describe(product)}\n`;
      report += '\n';
    });
  });

  return report;
}

function buildExclusionGroups(exclusoes) {
  if (!exclusoes) {
    return [];
  }

  return [
    {
      key: 'porMargemNegativa',
      title: 'Margem Negativa',
      groupCriterion:
        'Margem abaixo de 0% apos o produto passar por estoque disponivel e ACOS ate 20%.',
      items: exclusoes.porMargemNegativa || [],
      describe: (product) =>
        `${product.name} | Item Id: ${product.itemId} | Margem: ${formatPercent(product.margem)} | R$ ${formatMoney(product.faturamento)}`,
    },
    {
      key: 'porHighAcos',
      title: 'ACOS Alto > 20%',
      groupCriterion: 'ACOS acima de 20% entre produtos com estoque disponivel.',
      items: exclusoes.porHighAcos || [],
      describe: (product) =>
        `${product.name} | Item Id: ${product.itemId} | ACOS: ${formatPercent(product.acos * 100)} | R$ ${formatMoney(product.faturamento)}`,
    },
    {
      key: 'porZeroStockComFaturamento',
      title: 'Estoque Zerado (com Faturamento)',
      groupCriterion:
        'Estoque principal, seller e full zerados ao mesmo tempo, mesmo com faturamento acima de zero.',
      items: exclusoes.porZeroStockComFaturamento || [],
      describe: (product) =>
        `${product.name} | Item Id: ${product.itemId} | R$ ${formatMoney(product.faturamento)}`,
    },
    {
      key: 'porZeroStockSemFaturamento',
      title: 'Estoque Zerado (sem Faturamento)',
      groupCriterion:
        'Estoque principal, seller e full zerados ao mesmo tempo, com faturamento igual a zero.',
      items: exclusoes.porZeroStockSemFaturamento || [],
      describe: (product) => `${product.name} | Item Id: ${product.itemId}`,
    },
    {
      key: 'porFaturamentoZero',
      title: 'Faturamento Zero',
      groupCriterion:
        'Faturamento igual a zero depois de passar por estoque disponivel, ACOS ate 20% e margem nao negativa.',
      items: exclusoes.porFaturamentoZero || [],
      describe: (product) =>
        `${product.name} | Item Id: ${product.itemId} | Margem: ${formatPercent(product.margem)}`,
    },
  ].filter((group) => group.items.length > 0);
}

function formatMoney(value) {
  return Number(value || 0).toFixed(2);
}

function formatPercent(value) {
  return `${Number(value || 0).toFixed(2)}%`;
}

export default Summary;
