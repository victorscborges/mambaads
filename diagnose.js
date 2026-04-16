/**
 * Diagnóstico - Identifica por que nenhuma campanha foi gerada
 * Execute com: node diagnose.js
 */

import * as XLSX from 'xlsx';
import { classifyCurve } from './src/utils/campaignLogic.js';

async function diagnose() {
  console.log('\n🔍 DIAGNÓSTICO - CAMPANHA NÃO GERADA\n');
  console.log('='.repeat(70));

  try {
    // Procurar por arquivos Excel recentes
    const fs = await import('fs');
    const path = await import('path');
    const files = fs.readdirSync('.')
      .filter(f => f.endsWith('.xlsx') || f.endsWith('.xls'))
      .sort((a, b) => {
        const statA = fs.statSync(a);
        const statB = fs.statSync(b);
        return statB.mtime - statA.mtime;
      });

    if (files.length === 0) {
      console.log('\n❌ Nenhum arquivo Excel encontrado!');
      console.log('\n📝 Solução:');
      console.log('   1. Coloque o arquivo Excel na pasta raiz');
      console.log('   2. Use a interface em http://localhost:5001');
      console.log('   3. Envie o arquivo pelo upload\n');
      return;
    }

    const excelFile = files[0];
    console.log(`\n📊 Analisando arquivo: ${excelFile}\n`);

    const workbook = XLSX.read(fs.readFileSync(excelFile), { type: 'buffer' });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`✓ Produtos encontrados: ${data.length}`);

    if (data.length === 0) {
      console.log('❌ Planilha está vazia!');
      return;
    }

    // Verificar colunas
    const headers = Object.keys(data[0]);
    console.log(`✓ Colunas: ${headers.join(', ')}\n`);

    const totalRevenue = data.reduce((sum, row) => {
      const revenue = parseFloat(row['Faturamento'] || row['faturamento'] || 0);
      return sum + revenue;
    }, 0);

    console.log(`💰 Faturamento Total: R$ ${totalRevenue.toFixed(2)}`);
    console.log(`   1% do total = R$ ${(totalRevenue * 0.01).toFixed(2)}\n`);

    // Analisar cada produto
    console.log('📋 ANÁLISE POR PRODUTO:\n');
    console.log('-'.repeat(70));

    let isolatedCount = 0;
    let groupableCount = 0;
    let ignoredCount = 0;

    const products = data.map((row) => {
      const revenue = parseFloat(row['Faturamento'] || row['faturamento'] || 0);
      const margin = parseFloat(row['Margem'] || row['margem'] || 0);
      const revenuePercentage = (revenue / totalRevenue) * 100;

      const isIsolated = revenuePercentage >= 1 && margin > 0;
      const isGroupable = revenuePercentage < 1 && margin > 0;
      const isIgnored = margin <= 0;

      if (isIsolated) isolatedCount++;
      if (isGroupable) groupableCount++;
      if (isIgnored) ignoredCount++;

      const status = isIsolated ? '✓ ISOLADA' : isGroupable ? '○ AGRUPÁVEL' : '✗ IGNORADA';

      console.log(`${status} | ${(row['Produto'] || 'N/A').substring(0, 20).padEnd(20)} | ${revenuePercentage.toFixed(2)}% | Margem: ${margin}%`);

      return {
        name: row['Produto'] || 'N/A',
        revenue,
        revenuePercentage,
        margin,
        isIsolated,
        isGroupable,
        isIgnored,
      };
    });

    console.log('-'.repeat(70));
    console.log(`\n📊 RESUMO:\n`);
    console.log(`✓ Isoladas: ${isolatedCount}`);
    console.log(`○ Agrupáveis: ${groupableCount}`);
    console.log(`✗ Ignoradas (margem ≤ 0): ${ignoredCount}\n`);

    // Verificar por que não há campanhas
    if (isolatedCount === 0 && groupableCount === 0) {
      console.log('❌ PROBLEMA: Nenhum produto pode ser utilizado!\n');
      if (ignoredCount > 0) {
        console.log('💡 Todos os produtos têm margem ≤ 0');
        console.log('   Verifique a coluna de Margem na planilha\n');
      } else {
        console.log('💡 Verifique as colunas: "Faturamento" e "Margem"\n');
      }
      return;
    }

    if (isolatedCount === 0) {
      console.log('⚠️  AVISO: Nenhuma campanha isolada (todos < 1%)\n');
      console.log('Verificando agrupamentos...\n');

      // Simular agrupamento
      const groupMap = {};
      const groupableProducts = products.filter(p => p.isGroupable);

      groupableProducts.forEach((product) => {
        const key = 'grupo-teste';
        if (!groupMap[key]) groupMap[key] = [];
        groupMap[key].push(product);
      });

      let groupsCreated = 0;
      Object.entries(groupMap).forEach(([key, prods]) => {
        const groupRevenue = prods.reduce((sum, p) => sum + p.revenue, 0);
        const groupPercentage = (groupRevenue / totalRevenue) * 100;
        
        if (groupRevenue >= totalRevenue * 0.01) {
          groupsCreated++;
          console.log(`✓ Grupo formado: ${groupPercentage.toFixed(2)}% (${prods.length} produtos)`);
        } else {
          console.log(`✗ Grupo rejeitado: ${groupPercentage.toFixed(2)}% (precisa 1%)`);
        }
      });

      if (groupsCreated === 0) {
        console.log('\n❌ Nenhum grupo atingiu 1% do faturamento!\n');
        console.log('💡 Solução: Adicionar mais produtos à planilha ou aumentar faturamento dos produtos pequenos\n');
      }
    } else {
      console.log('✅ Campanhas DEVERIAM ter sido geradas!\n');
      console.log('💡 Possíveis problemas:');
      console.log('   - Atualizar a página (F5)');
      console.log('   - Verificar console do navegador (F12)');
      console.log('   - Revisar o arquivo enviado\n');
    }

    console.log('='.repeat(70));

  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    console.log('\n💡 Dica: Coloque um arquivo .xlsx na pasta raiz\n');
  }
}

diagnose();
