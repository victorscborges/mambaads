# Instruções de Projeto - Mamba Ads

## Descrição
Serviço full-stack para análise automatizada de campanhas de publicidade em marketplaces usando a metodologia Mamba.

## Stack Tecnológico
- **Backend**: Node.js + Express.js
- **Frontend**: React
- **Processamento**: XLSX (Excel parsing)
- **Padrão**: REST API

## Checklist de Desenvolvimento

- [x] Criar estrutura de diretórios (backend + frontend)
- [x] Configurar Backend (Express + rotas)
- [x] Implementar lógica de análise (campaignLogic.js)
- [x] Criar interface React
- [x] Implementar componentes UI
- [x] Documentação (README.md)
- [ ] Instalar dependências
- [ ] Testar endpoints API
- [ ] Validar lógica com planilha de exemplo
- [ ] Implementar download de Excel (futuro)
- [ ] Deployar em produção

## Configuração do Ambiente

### Backend
- PORT: 5000 (padrão)
- NODE_ENV: development

### Frontend
- PORT: 3000 (padrão)
- PROXY: http://localhost:5000

## Comandos Principais

```bash
# Instalar dependências
npm install
cd client && npm install && cd ..

# Desenvolvimento
npm run dev          # Backend
npm run client       # Frontend em outra aba
npm run concurrently # Ambos simultaneamente

# Build
npm run build

# Produção
NODE_ENV=production npm start
```

## Estrutura de Arquivos

```
src/
├── server.js                 # Servidor Express
├── services/
│   └── analyzer.js          # Lógica de análise
└── utils/
    └── campaignLogic.js     # Regras de campanhas

client/
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx   # Upload de arquivo
│   │   ├── Summary.jsx      # Resumo de análise
│   │   └── CampaignTable.jsx # Tabela de campanhas
│   ├── App.jsx              # App principal
│   └── index.js             # Entry point
└── public/
    └── index.html
```

## Regras de Nomenclatura de Campanhas

Padrão: `MAMBA-[CURVA]-[TICKET]-[SKU]?`

- **MAMBA**: Prefixo obrigatório
- **CURVA**: A, B ou C (obrigatório)
- **TICKET**: Faixa de 100 em 100 reais (ex: 100-200, 300-400)
- **SKU**: Apenas para campanhas isoladas

Exemplos:
- `MAMBA-A-100-200` (Curva A, agrupada)
- `MAMBA-A-100-200-SKU123` (Curva A, isolada)
- `MAMBA-B-300-400` (Curva B, agrupada)

## Critérios de Isolamento

Um produto é isolado quando:
- ✓ Faturamento >= 1% do faturamento total
- ✓ Margem > 0
- ✓ Potencial de otimização específica

## ROAS Objetivo

| Curva | ROAS | Descrição |
|-------|------|-----------|
| A | 12x | Principais, máxima rentabilidade |
| B | 8x | Crescimento equilibrado |
| C | 4x | Longa cauda, testagem |

## Fluxo de Dados

1. **Upload**: Usuário envia Excel
2. **Parsing**: Analyzer.js lê o arquivo
3. **Classificação**: campaignLogic.js classifica por curva
4. **Isolamento/Agrupamento**: Define estrutura de campanhas
5. **Nomenclatura**: Gera nomes conforme padrão
6. **ROAS**: Calcula objetivo por curva
7. **Orçamento**: Calcula orçamento diário
8. **Response**: Retorna campanhas ao frontend

## Métricas de Sucesso

- ✓ Análise processada em < 2 segundos
- ✓ 100% de produtos classificados
- ✓ Nomes de campanha válidos
- ✓ Agrupamentos respeitam mínimo de 1%
- ✓ Interface responsiva

## Próximos Passos

1. Instalar dependências
2. Testar com planilha de exemplo
3. Validar lógica de agrupamento
4. Implementar download de Excel
5. Adicionar validações robustas
6. Implementar filtros na UI
7. Adicionar autenticação (futuro)

## Notas Importantes

- Margem é filtro universal: produtos com margem <= 0 são ignorados
- Curva é dinâmica: recalcular sempre que houver novos dados
- Agrupamento por curva + ticket: respeita ordem Pareto
- Nomenclatura: deve ser única e imutável
