import React, { useMemo, useState } from 'react';

function CampaignTable({ campaigns }) {
  const [showReport, setShowReport] = useState(false);

  const totalBudget = useMemo(() => {
    return campaigns.reduce((sum, campaign) => sum + campaign.orcamentoDiario, 0);
  }, [campaigns]);

  const totalRevenue = useMemo(() => {
    return campaigns.reduce((sum, campaign) => sum + campaign.faturamento, 0);
  }, [campaigns]);

  const report = useMemo(() => {
    let nextReport = '='.repeat(60) + '\n';
    nextReport += 'RELATORIO DE CAMPANHAS\n';
    nextReport += '='.repeat(60) + '\n\n';
    nextReport += `Total de Campanhas: ${campaigns.length}\n`;
    nextReport += `Orcamento Diario Total: R$ ${totalBudget.toFixed(2)}\n`;
    nextReport += `Faturamento Total: R$ ${totalRevenue.toFixed(2)}\n\n`;
    nextReport += '-'.repeat(60) + '\n\n';

    campaigns.forEach((campaign, index) => {
      nextReport += `${index + 1}. ${campaign.nome}\n`;
      nextReport += `   Tipo: ${campaign.tipo}\n`;
      nextReport += `   ROAS Objetivo: ${campaign.roasObjetivo}x\n`;
      nextReport += `   Orcamento Diario: R$ ${campaign.orcamentoDiario.toFixed(2)}\n`;
      nextReport += `   Quantidade de Produtos: ${campaign.quantidadeProdutos}\n`;
      nextReport += '   MLBs:\n';
      campaign.mlbs.forEach((mlb) => {
        nextReport += `      - ${mlb}\n`;
      });
      nextReport += '\n';
    });

    nextReport += '-'.repeat(60) + '\n';
    nextReport += `Orcamento Diario TOTAL: R$ ${totalBudget.toFixed(2)}\n`;
    nextReport += `Orcamento Mensal (30 dias): R$ ${(totalBudget * 30).toFixed(2)}\n`;
    nextReport += '='.repeat(60) + '\n';

    return nextReport;
  }, [campaigns, totalBudget, totalRevenue]);

  const handleCopyReport = async () => {
    await navigator.clipboard.writeText(report);
  };

  return (
    <div className="campaigns-container">
      <div className="campaigns-header">
        <h2>Campanhas Geradas ({campaigns.length})</h2>
        <button className="report-button" onClick={() => setShowReport((value) => !value)}>
          {showReport ? 'Fechar relatorio' : 'Ver relatorio'}
        </button>
        <button className="copy-report-button" onClick={handleCopyReport}>
          Copiar relatorio
        </button>
      </div>

      {showReport ? (
        <div className="report-box">
          <pre>{report}</pre>
        </div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Nome da Campanha</th>
              <th>Tipo</th>
              <th>ROAS Objetivo</th>
              <th>Orcamento Diario</th>
              <th>Faturamento</th>
              <th>Produtos</th>
            </tr>
          </thead>
          <tbody>
            {campaigns.map((campaign, index) => (
              <tr key={`${campaign.nome}-${index}`}>
                <td>
                  <span className="campaign-name">{campaign.nome}</span>
                  {campaign.criterios?.length > 0 && (
                    <ul className="decision-criteria campaign-criteria">
                      {campaign.criterios.map((criterion, criteriaIndex) => (
                        <li key={`${campaign.nome}-criterion-${criteriaIndex}`}>{criterion}</li>
                      ))}
                    </ul>
                  )}
                </td>
                <td>
                  <span className={`campaign-type ${campaign.tipo.toLowerCase()}`}>{campaign.tipo}</span>
                </td>
                <td>
                  <span className="roas-badge">{campaign.roasObjetivo}x</span>
                </td>
                <td>
                  <span className="budget-value">R$ {campaign.orcamentoDiario.toFixed(2)}</span>
                </td>
                <td>R$ {campaign.faturamento.toFixed(2)}</td>
                <td>
                  <small>
                    {campaign.quantidadeProdutos}{' '}
                    {campaign.quantidadeProdutos === 1 ? 'produto' : 'produtos'}
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
