import React, { useState } from 'react';
import axios from 'axios';
import './App.css';
import FileUpload from './components/FileUpload';
import CampaignTable from './components/CampaignTable';
import Summary from './components/Summary';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function App() {
  const [campaigns, setCampaigns] = useState([]);
  const [summary, setSummary] = useState(null);
  const [opportunities, setOpportunities] = useState(null);
  const [exclusoes, setExclusoes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileUpload = async (file, tacos) => {
    setLoading(true);
    setError(null);
    setCampaigns([]);
    setSummary(null);
    setOpportunities(null);
    setExclusoes(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tacos', tacos);

      const response = await axios.post(`${API_URL}/api/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        setCampaigns(response.data.campanhas);
        setSummary(response.data.resumo);
        setOpportunities(response.data.oportunidades);
        setExclusoes(response.data.exclusoes);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao processar arquivo');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>🧠 Mamba Ads</h1>
        <p>Análise inteligente de campanhas de publicidade</p>
      </header>

      <main className="App-main">
        <FileUpload onUpload={handleFileUpload} loading={loading} />

        {error && <div className="error-message">{error}</div>}

        {summary && <Summary data={summary} oportunidades={opportunities} exclusoes={exclusoes} />}

        {campaigns.length > 0 && <CampaignTable campaigns={campaigns} />}
      </main>
    </div>
  );
}

export default App;
