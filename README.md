# 🧠 Mamba Ads - Análise Inteligente de Campanhas

Serviço automatizado para análise e geração de campanhas de publicidade em marketplaces usando a metodologia Mamba de tomada de decisão.

## 🎯 Funcionalidades

- **Upload de planilha**: Envie sua planilha de rentabilidade em Excel
- **Análise automática**: Processa dados aplicando toda a lógica da metodologia Mamba
- **Classificação de curvas**: Produtos classificados em Curva A, B ou C automaticamente
- **Geração de campanhas**: Cria campanhas isoladas e agrupadas conforme regras
- **Nomes automáticos**: Segue padrão MAMBA + Curva + Ticket + SKU (quando isolado)
- **ROAS objetivo**: Define ROAS alvo por curva
- **Orçamento calculado**: Calcula orçamento diário baseado em faturamento e margem

## 📋 Estrutura do Projeto

```
mambaads/
├── src/                        # Backend (Node.js/Express)
│   ├── server.js              # Servidor principal
│   ├── services/
│   │   └── analyzer.js        # Lógica de análise
│   └── utils/
│       └── campaignLogic.js   # Regras de campanhas
├── client/                     # Frontend (React)
│   ├── src/
│   │   ├── components/        # Componentes React
│   │   ├── App.jsx           # App principal
│   │   └── index.js          # Entry point
│   └── public/               # Assets estáticos
├── package.json              # Dependências backend
└── README.md                 # Este arquivo
```

## 🚀 Quickstart

### Requisitos
- Node.js 16+
- npm ou yarn

### Instalação e Execução

1. **Instalar dependências do backend**:
```bash
npm install
```

2. **Instalar dependências do frontend**:
```bash
cd client
npm install
cd ..
```

3. **Executar em desenvolvimento** (backend + frontend simultaneamente):
```bash
npm run concurrently
```

Ou separadamente:

**Terminal 1 - Backend**:
```bash
npm run dev
```

**Terminal 2 - Frontend**:
```bash
npm run client
```

## 📊 Formato de Entrada (Excel)

A planilha deve conter as seguintes colunas:

| Coluna | Descrição | Obrigatório |
|--------|-----------|-------------|
| SKU | Identificador do produto | ✓ |
| Produto | Nome do produto | ✓ |
| Faturamento | Faturamento mensal | ✓ |
| Margem | Margem de lucro (%) | ✓ |
| Ticket Médio | Preço médio de venda | ✓ |
| Visitas | Número de visitas | ✓ |
| Vendas | Número de vendas | ✓ |
| CPC | Custo por clique | ✓ |
| ROAS | ROAS atual (para referência) | ✗ |

## 🧠 Regras de Classificação

### Curva ABC
- **Curva A**: >= 5% do faturamento total (alta prioridade)
- **Curva B**: 1% a 4.9% do faturamento total (intermediário)
- **Curva C**: < 1% do faturamento total (longa cauda)

### Isolamento vs Agrupamento

**Isoladas** (campanhas próprias):
- Faturamento >= 1% do total (OBRIGATÓRIO)
- Margem > 0
- Incluem SKU no nome
- Ex: `MAMBA-A-150-200-SKU123`

**Agrupadas**:
- Faturamento < 1% do total
- Mesma curva
- Ticket similar (faixa de 100 em 100 reais)
- Faturamento agrupado >= 1% do total
- Ex: `MAMBA-B-300-400`

## 📝 Nomenclatura de Campanhas

Padrão: `MAMBA-[Curva]-[Ticket]-[SKU]`

Exemplos:
- `MAMBA-A-150-200` (Curva A, ticket 150-200, agrupada)
- `MAMBA-A-100-200-SKU123` (Curva A, ticket 100-200, isolada com SKU)
- `MAMBA-B-300-400` (Curva B, ticket 300-400)

## 🎯 ROAS Objetivo por Curva

| Curva | ROAS Objetivo | Estratégia |
|-------|---------------|-----------|
| A | 12x | Principais e alta rentabilidade |
| B | 8x | Equilíbrio crescimento/retorno |
| C | 4x | Longa cauda e testagem |

## 💡 Metodologia Aplicada

O sistema aplica os seguintes conceitos da metodologia Mamba:

1. **Margem como filtro universal**: Apenas produtos com margem positiva
2. **Pareto (Curva ABC)**: 20% dos produtos geram 80% do faturamento
3. **1% de faturamento**: Critério mínimo para isolamento ou agrupamento viável
4. **ROAS objetivo por curva**: Diferentes metas conforme o segmento
5. **Orçamento dinâmico**: Baseado em faturamento e margem

## 🔧 API Endpoints

### POST /api/upload
Analisa um arquivo Excel e retorna campanhas geradas.

**Request**:
```
Content-Type: multipart/form-data
Body:
  - file: [arquivo.xlsx]
```

**Response**:
```json
{
  "success": true,
  "resumo": {
    "totalProdutos": 150,
    "faturamentoTotal": 500000,
    "campanhasIsoladas": 15,
    "campanhasAgrupadas": 12
  },
  "campanhas": [
    {
      "nome": "MAMBA-A-100-200",
      "roasObjetivo": 12,
      "orcamentoDiario": 250.00,
      "tipo": "Isolada",
      "products": ["Produto A"],
      "skus": ["SKU001"],
      "quantidadeProdutos": 1,
      "faturamento": 50000
    },
    {
      "nome": "MAMBA-B-300-400",
      "roasObjetivo": 8,
      "orcamentoDiario": 150.00,
      "tipo": "Agrupada",
      "products": ["Produto B", "Produto C"],
      "skus": ["SKU002", "SKU003"],
      "quantidadeProdutos": 2,
      "faturamento": 30000
    }
  ]
}
```

## 🎨 Frontend

Realizado em React com interface intuitiva:
- Drag-and-drop para upload
- Visualização em tempo real
- Tabela responsiva com campanhas geradas
- **Botão COPIAR**: Copia SKUs/MLBs da campanha para clipboard
- Resumo de métricas com detalhes completos

## 📦 Build para Produção

```bash
# Build frontend
npm run build

# Iniciar servidor (produção)
NODE_ENV=production npm start
```

## 🐛 Troubleshooting

**Erro: "Arquivo vazio ou formato inválido"**
- Certifique-se de que o arquivo Excel tem dados
- Verifique se as colunas estão nomeadas corretamente

**Erro: "Cannot POST /api/upload"**
- Backend não está rodando na porta 5000
- Execute: `npm run dev`

**Erro: "CORS error"**
- Frontend em porta diferente de 3000
- Verifique a variável `proxy` em `client/package.json`

## 📖 Documentação Completa

Veja o arquivo `Manual da Metodologia.txt` para entender todos os conceitos e estratégias utilizadas.

## 🤝 Contribuição

Este projeto é mantido pela equipe Mamba.

## 📝 Licença

Propriedade exclusiva - Metodologia Mamba
