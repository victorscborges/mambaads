import React, { useState } from 'react';

function Summary({ data, exclusoes }) {
  const [showExclusoesReport, setShowExclusoesReport] = useState(false);

  const generateExclusoesReport = () => {
    if (!exclusoes) return '';

    let report = '📋 RELATÓRIO DE EXCLUSÕES\n';
    report += '=' .repeat(60) + '\n\n';

    if (exclusoes.porMargemNegativa?.length > 0) {
      report += `🚫 MARGEM NEGATIVA (${exclusoes.porMargemNegativa.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porMargemNegativa.forEach((p) => {
        report += `• ${p.name}\n`;
        report += `  Item Id: ${p.itemId}\n`;
        report += `  Margem: ${p.margem?.toFixed(2)}% | Faturamento: R$ ${p.faturamento?.toFixed(2)}\n\n`;
      });
    }

    if (exclusoes.porHighAcos?.length > 0) {
      report += `🚫 ACOS ALTO > 20% (${exclusoes.porHighAcos.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porHighAcos.forEach((p) => {
        report += `• ${p.name}\n`;
        report += `  Item Id: ${p.itemId}\n`;
        report += `  ACOS: ${(p.acos * 100)?.toFixed(2)}% | Faturamento: R$ ${p.faturamento?.toFixed(2)}\n\n`;
      });
    }

    if (exclusoes.porZeroStockComFaturamento?.length > 0) {
      report += `🚫 ESTOQUE ZERADO (COM FATURAMENTO) (${exclusoes.porZeroStockComFaturamento.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porZeroStockComFaturamento.forEach((p) => {
        report += `• ${p.name}\n`;
        report += `  Item Id: ${p.itemId}\n`;
        report += `  Faturamento: R$ ${p.faturamento?.toFixed(2)}\n\n`;
      });
    }

    if (exclusoes.porZeroStockSemFaturamento?.length > 0) {
      report += `🚫 ESTOQUE ZERADO (SEM FATURAMENTO) (${exclusoes.porZeroStockSemFaturamento.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porZeroStockSemFaturamento.forEach((p) => {
        report += `• ${p.name}\n`;
        report += `  Item Id: ${p.itemId}\n\n`;
      });
    }

    if (exclusoes.porFaturamentoZero?.length > 0) {
      report += `🚫 FATURAMENTO ZERO (${exclusoes.porFaturamentoZero.length})\n`;
      report += '-'.repeat(60) + '\n';
      exclusoes.porFaturamentoZero.forEach((p) => {
        report += `• ${p.name}\n`;
        report += `  Item Id: ${p.itemId}\n\n`;
      });
    }

    return report;
  };

  const handleCopyExclusoesReport = () => {
    const report = generateExclusoesReport();
    navigator.clipboard.writeText(report);
  };

  return (
    <div className="summary-container">
      <h2>📈 Resumo da Análise</h2>
      <div className="summary-grid">
        <div className="summary-card">
          <h3>Total de Produtos</h3>
          <div className="value">{data.totalProdutos}</div>
          <div className="subtitle">Arquivo</div>
        </div>
        <div className="summary-card">
          <h3>Analisados</h3>
          <div className="value">{data.produtosAnalisados}</div>
          <div className="subtitle">Campanhas</div>
        </div>
        <div className="summary-card">
          <h3>Faturamento Total</h3>
          <div className="value">
            R$ {(data.faturamentoTotal / 1000).toFixed(1)}k
          </div>
        </div>
        <div className="summary-card">
          <h3>Campanhas</h3>
          <div className="value">{data.campanhasIsoladas + data.campanhasAgrupadas}</div>
          <div className="subtitle">{data.campanhasIsoladas} Isoladas + {data.campanhasAgrupadas} Agrupadas</div>
        </div>
      </div>

      {/* Seção de Exclusões */}
      {exclusoes && (exclusoes.porMargemNegativa?.length > 0 || exclusoes.porHighAcos?.length > 0 || exclusoes.porZeroStockComFaturamento?.length > 0 || exclusoes.porZeroStockSemFaturamento?.length > 0 || exclusoes.porFaturamentoZero?.length > 0) && (
        <div className="exclusoes-section">
          <div className="exclusoes-header">
            <h3>⚠️ Análise de Exclusões</h3>
            <div className="exclusoes-buttons">
              <button
                className="report-button-small"
                onClick={() => setShowExclusoesReport(!showExclusoesReport)}
              >
                {showExclusoesReport ? '✕ Fechar Relatório' : '📄 Ver Relatório'}
              </button>
              {showExclusoesReport && (
                <button
                  className="copy-report-button-small"
                  onClick={handleCopyExclusoesReport}
                >
                  📋 Copiar Relatório
                </button>
              )}
            </div>
          </div>

          {showExclusoesReport ? (
            <div className="report-box">
              <pre>{generateExclusoesReport()}</pre>
            </div>
          ) : (
            <>
              {exclusoes.porMargemNegativa?.length > 0 && (
                <div className="exclusao-grupo">
                  <h4>🚫 Margem Negativa ({exclusoes.porMargemNegativa.length})</h4>
                  <ul>
                    {exclusoes.porMargemNegativa.map((p, idx) => (
                      <li key={idx}>
                        <strong>{p.name}</strong> | Item Id: {p.itemId} | Margem: {p.margem?.toFixed(2)}% | R$ {p.faturamento?.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exclusoes.porHighAcos?.length > 0 && (
                <div className="exclusao-grupo">
                  <h4>🚫 ACOS Alto &gt; 20% ({exclusoes.porHighAcos.length})</h4>
                  <ul>
                    {exclusoes.porHighAcos.map((p, idx) => (
                      <li key={idx}>
                        <strong>{p.name}</strong> | Item Id: {p.itemId} | ACOS {(p.acos * 100)?.toFixed(2)}% | R$ {p.faturamento?.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exclusoes.porZeroStockComFaturamento?.length > 0 && (
                <div className="exclusao-grupo">
                  <h4>🚫 Estoque Zerado (com Faturamento) ({exclusoes.porZeroStockComFaturamento.length})</h4>
                  <ul>
                    {exclusoes.porZeroStockComFaturamento.map((p, idx) => (
                      <li key={idx}>
                        <strong>{p.name}</strong> | Item Id: {p.itemId} | R$ {p.faturamento?.toFixed(2)}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exclusoes.porZeroStockSemFaturamento?.length > 0 && (
                <div className="exclusao-grupo">
                  <h4>🚫 Estoque Zerado (sem Faturamento) ({exclusoes.porZeroStockSemFaturamento.length})</h4>
                  <ul>
                    {exclusoes.porZeroStockSemFaturamento.map((p, idx) => (
                      <li key={idx}>
                        <strong>{p.name}</strong> | Item Id: {p.itemId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {exclusoes.porFaturamentoZero?.length > 0 && (
                <div className="exclusao-grupo">
                  <h4>🚫 Faturamento Zero ({exclusoes.porFaturamentoZero.length})</h4>
                  <ul>
                    {exclusoes.porFaturamentoZero.map((p, idx) => (
                      <li key={idx}>
                        <strong>{p.name}</strong> | Item Id: {p.itemId}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default Summary;
