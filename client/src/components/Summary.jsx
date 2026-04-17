import React, { useMemo, useState } from 'react';

function Summary({ data, oportunidades, exclusoes }) {
  const [showOpportunities, setShowOpportunities] = useState(false);
  const [showOpportunitiesReport, setShowOpportunitiesReport] = useState(false);
  const [showExclusoesReport, setShowExclusoesReport] = useState(false);
  const [showExclusoes, setShowExclusoes] = useState(false);

  const hasOportunidades = useMemo(() => {
    return Boolean(oportunidades?.quantidadeProdutos > 0 && oportunidades?.campanhas?.length > 0);
  }, [oportunidades]);

  const hasExclusoes = useMemo(() => {
    if (!exclusoes) {
      return false;
    }

    return Object.values(exclusoes).some((items) => Array.isArray(items) && items.length > 0);
  }, [exclusoes]);

  const totalExclusoes = useMemo(() => {
    if (!exclusoes) {
      return 0;
    }

    return Object.values(exclusoes).reduce((total, items) => {
      return total + (Array.isArray(items) ? items.length : 0);
    }, 0);
  }, [exclusoes]);

  const opportunitiesReport = useMemo(() => {
    if (!hasOportunidades) {
      return '';
    }

    return buildCampaignsReport('RELATORIO DE OPORTUNIDADES', oportunidades.campanhas, {
      quantidadeProdutos: oportunidades.quantidadeProdutos,
      orcamentoDiarioTotal: oportunidades.orcamentoDiarioTotal,
      orcamentoMensalTotal: oportunidades.orcamentoMensalTotal,
    });
  }, [hasOportunidades, oportunidades]);

  const exclusoesReport = useMemo(() => {
    if (!exclusoes) {
      return '';
    }

    let report = 'RELATORIO DE EXCLUSOES\n';
    report += '='.repeat(60) + '\n\n';

    if (exclusoes.porMargemNegativa?.length > 0) {
      report += `MARGEM NEGATIVA (${exclusoes.porMargemNegativa.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porMargemNegativa.forEach((product) => {
        report += `- ${product.name}\n`;
        report += `  Item Id: ${product.itemId}\n`;
        report += `  Margem: ${product.margem?.toFixed(2)}% | Faturamento: R$ ${product.faturamento?.toFixed(2)}\n\n`;
      });
    }

    if (exclusoes.porHighAcos?.length > 0) {
      report += `ACOS ALTO > 20% (${exclusoes.porHighAcos.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porHighAcos.forEach((product) => {
        report += `- ${product.name}\n`;
        report += `  Item Id: ${product.itemId}\n`;
        report += `  ACOS: ${(product.acos * 100).toFixed(2)}% | Faturamento: R$ ${product.faturamento?.toFixed(2)}\n\n`;
      });
    }

    if (exclusoes.porZeroStockComFaturamento?.length > 0) {
      report += `ESTOQUE ZERADO (COM FATURAMENTO) (${exclusoes.porZeroStockComFaturamento.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porZeroStockComFaturamento.forEach((product) => {
        report += `- ${product.name}\n`;
        report += `  Item Id: ${product.itemId}\n`;
        report += `  Faturamento: R$ ${product.faturamento?.toFixed(2)}\n\n`;
      });
    }

    if (exclusoes.porZeroStockSemFaturamento?.length > 0) {
      report += `ESTOQUE ZERADO (SEM FATURAMENTO) (${exclusoes.porZeroStockSemFaturamento.length})\n\n`;
    }

    if (exclusoes.porFaturamentoZero?.length > 0) {
      report += `FATURAMENTO ZERO (${exclusoes.porFaturamentoZero.length})\n\n`;
    }

    return report;
  }, [exclusoes]);

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
                  {oportunidades.campanhas.map((campaign, index) => (
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
                  {exclusoes.porMargemNegativa?.length > 0 && (
                    <div className="exclusao-grupo">
                      <h4>Margem Negativa ({exclusoes.porMargemNegativa.length})</h4>
                      <ul>
                        {exclusoes.porMargemNegativa.map((product, index) => (
                          <li key={`margem-${index}`}>
                            <strong>{product.name}</strong> | Item Id: {product.itemId} | Margem:{' '}
                            {product.margem?.toFixed(2)}% | R$ {product.faturamento?.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusoes.porHighAcos?.length > 0 && (
                    <div className="exclusao-grupo">
                      <h4>ACOS Alto &gt; 20% ({exclusoes.porHighAcos.length})</h4>
                      <ul>
                        {exclusoes.porHighAcos.map((product, index) => (
                          <li key={`acos-${index}`}>
                            <strong>{product.name}</strong> | Item Id: {product.itemId} | ACOS{' '}
                            {(product.acos * 100).toFixed(2)}% | R$ {product.faturamento?.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusoes.porZeroStockComFaturamento?.length > 0 && (
                    <div className="exclusao-grupo">
                      <h4>Estoque Zerado (com Faturamento) ({exclusoes.porZeroStockComFaturamento.length})</h4>
                      <ul>
                        {exclusoes.porZeroStockComFaturamento.map((product, index) => (
                          <li key={`zero-stock-revenue-${index}`}>
                            <strong>{product.name}</strong> | Item Id: {product.itemId} | R$ {product.faturamento?.toFixed(2)}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusoes.porZeroStockSemFaturamento?.length > 0 && (
                    <div className="exclusao-grupo">
                      <h4>Estoque Zerado (sem Faturamento) ({exclusoes.porZeroStockSemFaturamento.length})</h4>
                    </div>
                  )}

                  {exclusoes.porFaturamentoZero?.length > 0 && (
                    <div className="exclusao-grupo">
                      <h4>Faturamento Zero ({exclusoes.porFaturamentoZero.length})</h4>
                    </div>
                  )}
                </>
              ))}
          </div>
        </div>
      )}
    </div>
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

export default Summary;
