import React, { useState } from 'react';

function CampaignTable({ campaigns }) {
  const [showReport, setShowReport] = useState(false);

  const generateReport = () => {
    let report = '═══════════════════════════════════════════════════════════\n';
    report += '                    RELATÓRIO DE CAMPANHAS\n';
    report += '═══════════════════════════════════════════════════════════\n\n';

    const totalBudget = campaigns.reduce((sum, c) => sum + c.orcamentoDiario, 0);
    
    report += `Total de Campanhas: ${campaigns.length}\n`;
    report += `Orçamento Diário Total: R$ ${totalBudget.toFixed(2)}\n`;
    report += `Faturamento Total: R$ ${campaigns.reduce((sum, c) => sum + c.faturamento, 0).toFixed(2)}\n\n`;
    report += '───────────────────────────────────────────────────────────\n\n';

    campaigns.forEach((campaign, idx) => {
      report += `${idx + 1}. ${campaign.nome}\n`;
      report += `   Tipo: ${campaign.tipo}\n`;
      report += `   ROAS Objetivo: ${campaign.roasObjetivo}x\n`;
      report += `   Orçamento Diário: R$ ${campaign.orcamentoDiario.toFixed(2)}\n`;
      report += `   Quantidade de Produtos: ${campaign.quantidadeProdutos}\n`;
      report += `   MLBs:\n`;
      
      campaign.mlbs.forEach((mlb) => {
        report += `      - ${mlb}\n`;
      });
      
      report += '\n';
    });

    report += '───────────────────────────────────────────────────────────\n';
    report += `Orçamento Diário TOTAL: R$ ${totalBudget.toFixed(2)}\n`;
    report += `Orçamento Mensal (30 dias): R$ ${(totalBudget * 30).toFixed(2)}\n`;
    report += '═══════════════════════════════════════════════════════════\n';

    return report;
  };

  const handleCopyReport = () => {
    const report = generateReport();
    navigator.clipboard.writeText(report).then(() => {
      alert('Relatório copiado para clipboard!');
    });
  };

  const handleOpenReport = () => {
    setShowReport(!showReport);
  };

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h2>🚀 Campanhas Geradas ({campaigns.length})</h2>
        <button className="report-button" onClick={handleOpenReport}>
          📋 {showReport ? 'Fechar' : 'Ver'} Relatório
        </button>
        <button className="copy-report-button" onClick={handleCopyReport}>
          📋 Copiar Relatório
        </button>
      </div>

      {showReport ? (
        <div className="report-box">
          <pre>{generateReport()}</pre>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome da Campanha</th>
              <th>Tipo</th>
              <th>ROAS Objetivo</th>
              <th>Orçamento Diário</th>
              <th>Faturamento</th>
              <th>Produtos</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, idx) => (
              <tr key={idx}>
                <td>
                  <span className="campaign-name">{campaign.nome}</span>
                </td>
                <td>
                  <span className={`campaign-type ${campaign.tipo.toLowerCase()}`}>
                    {campaign.tipo}
                  </span>
                </td>
                <td>
                  <span className="roas-badge">{campaign.roasObjetivo}x</span>
                </td>
                <td>
                  <span className="budget-value">
                    R$ {campaign.orcamentoDiario.toFixed(2)}
                  </span>
                </td>
                <td>R$ {campaign.faturamento.toFixed(2)}</td>
                <td>
                  <small>
                    {campaign.quantidadeProdutos} {campaign.quantidadeProdutos === 1 ? 'produto' : 'produtos'}
                  </small>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default CampaignTable;
