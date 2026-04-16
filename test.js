/**
 * Script de teste para validar a lógica de campanhas
 * Execute com: node test.js
 */

import { classifyCurve, generateCampaignName, groupProducts, getRoasTarget } from './src/utils/campaignLogic.js';

// Dados de teste
const testProducts = [
  { sku: 'SKU001', name: 'Produto Premium', faturamento: 100000, margem: 35, ticket: 500, curve: 'A' },
  { sku: 'SKU002', name: 'Produto Intermediário', faturamento: 30000, margem: 20, ticket: 200, curve: 'B' },
  { sku: 'SKU003', name: 'Produto Básico', faturamento: 5000, margem: 10, ticket: 50, curve: 'C' },
  { sku: 'SKU004', name: 'Outro Premium', faturamento: 80000, margem: 32, ticket: 480, curve: 'A' },
];

const totalRevenue = testProducts.reduce((sum, p) => sum + p.faturamento, 0);

console.log('\n🧪 TESTE DE LÓGICA DE CAMPANHAS\n');
console.log('='.repeat(60));

// Teste 1: Classificação de Curva
console.log('\n📊 TESTE 1: Classificação de Curvas ABC');
console.log('-'.repeat(60));

testProducts.forEach((product) => {
  const revenuePercentage = (product.faturamento / totalRevenue) * 100;
  const curve = classifyCurve(product, totalRevenue);
  console.log(
    `${product.name.padEnd(25)} | ${revenuePercentage.toFixed(2)}% | Curva ${curve}`
  );
});

// Teste 2: Geração de Nomes
console.log('\n🏷️  TESTE 2: Geração de Nomes de Campanhas');
console.log('-'.repeat(60));

testProducts.forEach((product) => {
  const isolatedName = generateCampaignName(product, true);
  console.log(`Isolada: ${isolatedName}`);
});

const groupedProduct = {
  curve: 'A',
  avgTicket: 250,
  products: testProducts.slice(0, 2),
};
const groupedName = generateCampaignName(groupedProduct, false);
console.log(`Agrupada: ${groupedName}`);

// Teste 3: ROAS Objetivo
console.log('\n🎯 TESTE 3: ROAS Objetivo por Curva');
console.log('-'.repeat(60));

['A', 'B', 'C'].forEach((curve) => {
  const roas = getRoasTarget(curve);
  console.log(`Curva ${curve}: ${roas}x`);
});

// Teste 4: Agrupamento
console.log('\n📦 TESTE 4: Agrupamento de Produtos');
console.log('-'.repeat(60));

const groupableProducts = testProducts.filter((p) => p.faturamento < totalRevenue * 0.05);
const groups = groupProducts(groupableProducts, totalRevenue);

console.log(`Produtos agrupáveis: ${groupableProducts.length}`);
console.log(`Grupos formados: ${groups.length}\n`);

groups.forEach((group, idx) => {
  console.log(`Grupo ${idx + 1}: ${group.key}`);
  console.log(
    `  - Faturamento: R$ ${group.faturamento.toFixed(2)} (${((group.faturamento / totalRevenue) * 100).toFixed(2)}%)`
  );
  console.log(`  - Margem média: ${group.avgMargin.toFixed(1)}%`);
  console.log(`  - Produtos: ${group.products.map((p) => p.name).join(', ')}`);
});

console.log('\n' + '='.repeat(60));
console.log('✅ Teste concluído com sucesso!\n');
