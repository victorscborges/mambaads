import React, { useMemo, useState } from 'react';

function Summary({ data, exclusoes }) {
  const [showExclusoesReport, setShowExclusoesReport] = useState(false);
  const [showExclusoes, setShowExclusoes] = useState(false);

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
      report += `ESTOQUE ZERADO (SEM FATURAMENTO) (${exclusoes.porZeroStockSemFaturamento.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porZeroStockSemFaturamento.forEach((product) => {
        report += `- ${product.name}\n`;
        report += `  Item Id: ${product.itemId}\n\n`;
      });
    }

    if (exclusoes.porFaturamentoZero?.length > 0) {
      report += `FATURAMENTO ZERO (${exclusoes.porFaturamentoZero.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porFaturamentoZero.forEach((product) => {
        report += `- ${product.name}\n`;
        report += `  Item Id: ${product.itemId}\n\n`;
      });
    }

    return report;
  }, [exclusoes]);

  const handleCopyExclusoesReport = async () => {
    await navigator.clipboard.writeText(exclusoesReport);
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
                      <ul>
                        {exclusoes.porZeroStockSemFaturamento.map((product, index) => (
                          <li key={`zero-stock-empty-${index}`}>
                            <strong>{product.name}</strong> | Item Id: {product.itemId}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {exclusoes.porFaturamentoZero?.length > 0 && (
                    <div className="exclusao-grupo">
                      <h4>Faturamento Zero ({exclusoes.porFaturamentoZero.length})</h4>
                      <ul>
                        {exclusoes.porFaturamentoZero.map((product, index) => (
                          <li key={`revenue-zero-${index}`}>
                            <strong>{product.name}</strong> | Item Id: {product.itemId}
                          </li>
                        ))}
                      </ul>
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

export default Summary;
