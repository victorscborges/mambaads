# 🚀 Lógica Mamba Ads - Explicação Completa

## 1️⃣ CLASSIFICAÇÃO DE CURVA (ABC - Pareto)

A classificação em curvas segue a **regra de Pareto** (20% dos produtos geram ~80% do faturamento):

```
┌─────────────────────────────────────────────────────┐
│ FATURAMENTO DO PRODUTO / FATURAMENTO TOTAL          │
├─────────────────────────────────────────────────────┤
│ ≥ 5%           → CURVA A (Principais)               │
│ 1% a 4,99%     → CURVA B (Intermediários)           │
│ < 1%           → CURVA C (Longa cauda)              │
└─────────────────────────────────────────────────────┘
```

### Exemplo com R$ 60.147,49 de faturamento total:

- **Produto Premium 1**: R$ 30.000 = **50%** → **CURVA A** ✅
- **Produto Premium 2**: R$ 25.000 = **41,5%** → **CURVA A** ✅
- **Produto Básico 1**: R$ 3.000 = **5%** → **CURVA B** ✅
- **Produto Básico 2**: R$ 2.147 = **3,5%** → **CURVA B** ✅

---

## 2️⃣ ISOLAMENTO vs AGRUPAMENTO

### Isolamento (Campanha Dedicada)

✅ Um produto é **isolado** quando atinge **≥ 1%** do faturamento total

- Exemplo: R$ 600 em R$ 60.000 = 1% = **ISOLADO**
- **Todas as curvas** podem ter isolados (A, B e C)
- Cada isolado = 1 campanha própria
- Nome: `MAMBA-[Curva]-[Ticket]-[SKU]`

### Agrupamento (Campanha Coletiva)

✅ Produtos com **< 1%** são agrupados

- Mesma curva
- Mesma faixa de preço (ticket)
- A soma do grupo deve ser ≥ 1% para ser viável

❌ Se a soma não atingir 1%, o grupo é descartado (sem faturamento suficiente)

#### Por que 4 produtos de Curva C em um grupo?

Porque:
1. Cada um tem < 1% isoladamente
2. A soma dos 4 = ≥ 1% do total
3. Todos têm margem > 0 (obrigatório)
4. Formam um grupo viável para campanha única

---

## 3️⃣ ROAS OBJETIVO DINÂMICO 🎯

### Lógica de Curva A, B, C com ROAS Variável

O ROAS não é mais fixo! Agora é **dinâmico baseado no faturamento relativo dentro de cada curva**.

#### Como funciona:

```
DENTRO DE CADA CURVA, calcular quanto cada produto representa:

Exemplo - Curva A com 2 produtos:
- Produto 1: R$ 30.000
- Produto 2: R$ 25.000
- Total Curva A: R$ 55.000

% do Produto 1 dentro da Curva A: 30.000 / 55.000 = 54,5% → TOP 30% → ROAS 12x
% do Produto 2 dentro da Curva A: 25.000 / 55.000 = 45,5% → TOP 30% → ROAS 12x
```

#### Tabela de ROAS Dinâmico:

| Curva | Top 30% | 30-65% | Resto | Descrição |
|-------|---------|--------|-------|-----------|
| **A** | 12x | 11x | 10x | Principais produtos |
| **B** | 8x | 7x | 6x | Crescimento |
| **C** | 6x | 5x | 4x | Testagem/Long tail |

#### Exemplo Prático:

Se você tem 3 produtos de Curva B:
- R$ 5.000 (50% da Curva B) → **8x ROAS**
- R$ 3.000 (30% da Curva B) → **7x ROAS**
- R$ 2.000 (20% da Curva B) → **6x ROAS**

---

## 4️⃣ ORÇAMENTO DISTRIBUÍDO PROPORCIONALMENTE 💰

### Cálculo do Orçamento Total

```
POOL TOTAL = (Faturamento Total × TACOS%) / 30 dias × 1,2 (buffer 20%)

Exemplo com 5% TACOS e R$ 60.147,49:
= (60.147,49 × 5) / 100 / 30 × 1,2
= 3.007,37 / 30 × 1,2
= 100,25 × 1,2
= R$ 120,29 / dia (POOL TOTAL)
```

### Distribuição por Campanha

```
Orçamento Campanha = POOL TOTAL × (Faturamento Campanha / Faturamento Total)

Exemplo:
- Campanha 1: R$ 30.000 (50%) → 50% de R$ 120,29 = R$ 60,15/dia
- Campanha 2: R$ 25.000 (41,5%) → 41,5% de R$ 120,29 = R$ 49,92/dia
- Campanha 3: R$ 3.000 (5%) → 5% de R$ 120,29 = R$ 6,01/dia
- Campanha 4: R$ 2.147 (3,5%) → 3,5% de R$ 120,29 = R$ 4,21/dia

TOTAL: R$ 120,29/dia ✅ (soma exata)
```

---

## 5️⃣ FLUXO COMPLETO DE ANÁLISE

```
┌─────────────────────────────────────────────────────────┐
│                   ARQUIVO EXCEL                         │
│   (Anúncio, Item Id, Faturamento, Margem)              │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 1. VALIDAÇÃO                                             │
│    - Margem > 0? Sim → Incluir                          │
│                Não  → Descartar                          │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 2. CLASSIFICAÇÃO (Curva ABC)                            │
│    - Calcular % do faturamento total                    │
│    - Atribuir A, B ou C                                 │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 3. ISOLAMENTO ou AGRUPAMENTO                            │
│    - ≥ 1%? → Isolado (campanha dedicada)               │
│    - < 1%? → Tenta agrupar com mesmo grupo              │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 4. NOMEAÇÃO DE CAMPANHAS                                │
│    Isolada: MAMBA-[Curva]-[Ticket]-[SKU]               │
│    Agrupada: MAMBA-[Curva]-[Ticket]                    │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 5. ROAS DINÂMICO                                        │
│    - % dentro da curva → Faixa ROAS                    │
│    - Atribuir 12x, 11x ou 10x (A)                      │
│    - Atribuir 8x, 7x ou 6x (B)                         │
│    - Atribuir 6x, 5x ou 4x (C)                         │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│ 6. ORÇAMENTO PROPORCIONAL                               │
│    - Pool Total = (Total × TACOS) / 30 × 1,2           │
│    - Por Campanha = Pool × (Faturamento / Total)       │
└────────────────────┬────────────────────────────────────┘
                     ↓
┌─────────────────────────────────────────────────────────┐
│                RELATÓRIO FINAL                          │
│ - Nome, Tipo, ROAS, Orçamento, MLBs, Faturamento       │
└─────────────────────────────────────────────────────────┘
```

---

## 6️⃣ CORES LAKERS 🟣💛

- **Roxo Principal**: #552583 (fundo principal)
- **Roxo Secundário**: #1d428a (gradientes)
- **Amarelo Lakers**: #FDB927 (destaques, botões)
- **Preto**: #000 / #1a1a1a (texto)

A nova paleta melhora:
- ✅ Contraste entre elementos
- ✅ Legibilidade das campanhas
- ✅ Identidade visual Lakers
- ✅ Experiência do usuário

---

## 🎯 Resumo Rápido

| Aspecto | Funcionamento |
|---------|---------------|
| **Curvas** | A ≥5%, B 1-5%, C <1% do faturamento |
| **Isolamento** | ≥ 1% do total = campanha própria |
| **Agrupamento** | < 1% agrupados por curva/ticket, mín 1% |
| **ROAS** | Dinâmico: 12/11/10 (A), 8/7/6 (B), 6/5/4 (C) |
| **Orçamento** | Proporcional: (total TACOS) × (% faturamento) |
| **Nomeação** | MAMBA-[Curva]-[Ticket]-[SKU se isolado] |

---

## 📋 Próximas Melhorias

- [ ] Validação de margem mínima configurável
- [ ] Histórico de campanhas
- [ ] Otimização de orçamento em tempo real
- [ ] Integração direta com Mercado Livre
