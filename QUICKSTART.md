# 🚀 Quick Start - Mamba Ads

## ⚡ Executar o Projeto em Desenvolvimento

### Opção 1: Ambos os servidores simultaneamente
```bash
npm run concurrently
```

**Resultado esperado**:
- Backend: http://localhost:5000
- Frontend: http://localhost:3000

### Opção 2: Separadamente (em terminais diferentes)

**Terminal 1 - Backend**:
```bash
npm run dev
```
Aguarde: `🚀 Servidor rodando em http://localhost:5000`

**Terminal 2 - Frontend**:
```bash
cd client
npm start
```
Aguarde a abertura automática de http://localhost:3000

## 📋 Fluxo de Uso

1. **Abra** http://localhost:3000 no navegador
2. **Upload** sua planilha de rentabilidade (formato Excel .xlsx)
3. **Aguarde** o processamento (< 2 segundos)
4. **Visualize** as campanhas geradas com nomes, ROAS objetivo e orçamento
5. **Exporte** para Excel (em desenvolvimento)

## 📊 Formato de Entrada Esperado

Coloque estes dados na sua planilha Excel:
- **SKU** - Identificador único
- **Produto** - Nome do produto
- **Faturamento** - Faturamento mensal
- **Margem** - Margem de lucro (%)
- **Ticket Médio** - Preço médio
- **Visitas** - Número de visitas
- **Vendas** - Número de vendas
- **CPC** - Custo por clique

## 🧪 Testar a Lógica de Campainha

```bash
node test.js
```

Mostrará todos os componentes funcionando:
✅ Classificação em Curvas ABC
✅ Geração automática de nomes
✅ ROAS objetivo por curva
✅ Agrupamento inteligente de produtos

## 🔗 URLs Importantes

| Recurso | URL |
|---------|-----|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:5000 |
| API Upload | POST http://localhost:5000/api/upload |

## 📁 Estrutura Criada

```
mambaads/
├── .env                  # Configurações locais
├── .env.example          # Template de configuração
├── .gitignore            # Arquivos ignorados
├── package.json          # Dependências backend
├── test.js              # Teste da lógica
├── README.md            # Documentação completa
│
├── .github/
│   └── copilot-instructions.md  # Instruções do projeto
│
├── src/
│   ├── server.js        # Servidor Express
│   ├── services/
│   │   └── analyzer.js  # Processador de Excel
│   └── utils/
│       └── campaignLogic.js  # Lógica de campanhas
│
└── client/
    ├── package.json     # Dependências React
    ├── public/
    │   └── index.html
    └── src/
        ├── App.jsx      # App principal
        ├── App.css      # Estilos
        ├── index.js     # Entry point
        ├── index.css    # Estilos globais
        └── components/
            ├── FileUpload.jsx    # Componente upload
            ├── FileUpload.css    # Estilos upload
            ├── Summary.jsx       # Resumo análise
            └── CampaignTable.jsx # Tabela campanhas
```

## 🐛 Troubleshooting

| Erro | Solução |
|------|---------|
| "Cannot POST /api/upload" | Backend não está rodando. Execute `npm run dev` |
| "CORS error" | Frontend em porta diferente. Verifique proxy em `client/package.json` |
| "Module not found" | Execute `npm install` em ambas as pastas |
| "Arquivo não processado" | Verifique se o Excel tem as colunas obrigatórias |

## 💡 O que Funciona

✅ Upload de Excel
✅ Classificação automática em Curva A/B/C
✅ Geração de nomes conforme padrão MAMBA
✅ Cálculo automático de ROAS objetivo (A=12x, B=8x, C=4x)
✅ Cálculo de orçamento diário
✅ Isolamento vs Agrupamento de campanhas (1% mínimo obrigatório)
✅ **Botão COPIAR**: Copia SKUs/MLBs para clipboard
✅ Interface responsiva
✅ Detalhes completos: Nome, Tipo, ROAS, Orçamento, Faturamento, Quantidade Produtos

## 🔮 Próximas Funcionalidades

🔜 Download do resultado em Excel
🔜 Integração com relatório do Mercado Livre
🔜 Autenticação de usuários
🔜 Histórico de análises
🔜 Filtros e busca avançada

---

**Qualquer dúvida?** Consulte o [README.md](./README.md) para documentação completa.
