import React, { useRef, useState } from 'react';
import './FileUpload.css';

function FileUpload({ onUpload, loading }) {
  const fileInputRef = useRef(null);
  const [tacos, setTacos] = useState('5');

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const tacosValue = Number(tacos);
        if (!Number.isFinite(tacosValue) || tacosValue <= 0 || tacosValue > 100) {
          alert('Informe um TACOS valido entre 0.1 e 100 antes de enviar.');
          return;
        }

        onUpload(file, tacosValue);
      } else {
        alert('Por favor, envie um arquivo Excel (.xlsx ou .xls)');
      }
    }
  };

  const handleClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="file-upload">
      <div className="tacos-notice">
        Preencha o <strong>TACOS ALINHADO (%)</strong> antes de enviar a planilha
      </div>
      <div className="upload-box" onClick={handleClick}>
        {loading ? (
          <>
            <div className="spinner"></div>
            <p>Processando arquivo...</p>
          </>
        ) : (
          <>
            <div className="upload-icon">📊</div>
            <h2>Envie sua planilha de rentabilidade</h2>
            <p>Clique para selecionar um arquivo .xlsx</p>
            <span className="file-info">Formato aceito: Excel (.xlsx, .xls)</span>
          </>
        )}
      </div>

      <div className="tacos-section">
        <label htmlFor="tacos-input">
          <strong>TACOS Objetivo (%):</strong>
        </label>
        <div className="tacos-input-group">
          <input
            id="tacos-input"
            type="number"
            min="0.1"
            max="100"
            step="0.5"
            value={tacos}
            onChange={(e) => setTacos(e.target.value)}
            disabled={loading}
          />
          <span className="tacos-help">% do faturamento total a investir mensalmente em ADS</span>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".xlsx,.xls"
        style={{ display: 'none' }}
      />
    </div>
  );
}

export default FileUpload;
