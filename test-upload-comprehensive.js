import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Try different files
const fileNames = ['test-data.xlsx', 'rentabilidade_real.xlsx'];
let filePath = '';

async function testUpload() {
  try {
    // Find the first file that exists and has content
    for (const fileName of fileNames) {
      const testPath = path.join(__dirname, fileName);
      if (fs.existsSync(testPath)) {
        const stats = fs.statSync(testPath);
        if (stats.size > 1000) {  // At least 1KB
          filePath = testPath;
          console.log('?? Using file: ' + fileName);
          console.log('?? File size: ' + (stats.size / 1024).toFixed(2) + ' KB\n');
          break;
        }
      }
    }

    if (!filePath) {
      console.error('? No suitable Excel file found');
      console.log('\nAvailable Excel files:');
      const files = fs.readdirSync('.').filter(f => f.endsWith('.xlsx'));
      files.forEach(f => {
        const stats = fs.statSync(path.join(__dirname, f));
        console.log('  - ' + f + ' (' + (stats.size / 1024).toFixed(2) + ' KB)');
      });
      return;
    }

    // Prepare FormData
    const form = new FormData();
    form.append('file', fs.createReadStream(filePath));
    form.append('TACOS', '8');

    console.log('?? Sending POST request to http://localhost:5000/api/upload...\n');

    // Send the file
    const response = await axios.post(
      'http://localhost:5000/api/upload',
      form,
      {
        headers: form.getHeaders(),
        timeout: 30000
      }
    );

    const data = response.data;
    console.log('? Upload successful!\n');
    console.log('========== RESPONSE SUMMARY ==========\n');

    // Display summary data
    if (data.resumo) {
      const resumo = data.resumo;
      console.log('?? Total Products in File: ' + (resumo.totalProdutos || 0));
      console.log('??  Products Analyzed: ' + (resumo.produtosAnalisados || 0));
      console.log('??  Products Excluded: ' + ((resumo.totalProdutos || 0) - (resumo.produtosAnalisados || 0)));
      console.log('?? Total Revenue: R\$ ' + (resumo.faturamentoTotal || 0));
      console.log('?? Campaigns (Isolated): ' + (resumo.campanhasIsoladas || 0));
      console.log('?? Campaigns (Grouped): ' + (resumo.campanhasAgrupadas || 0));
    }

    // Show exclusion breakdown
    if (data.exclusoes) {
      console.log('\n   Exclusion Breakdown:');
      const exclusoes = data.exclusoes;
      if (exclusoes.porZeroMargin && exclusoes.porZeroMargin.length > 0) {
        console.log('     - Zero Margin: ' + exclusoes.porZeroMargin.length);
      }
      if (exclusoes.porHighAcos && exclusoes.porHighAcos.length > 0) {
        console.log('     - High ACOS: ' + exclusoes.porHighAcos.length);
      }
      if (exclusoes.porZeroStock && exclusoes.porZeroStock.length > 0) {
        console.log('     - Zero Stock: ' + exclusoes.porZeroStock.length);
      }
    }

    if (data.campanhas && Array.isArray(data.campanhas)) {
      const numCampaigns = data.campanhas.length;
      console.log('\n?? Campaigns Created: ' + numCampaigns);
      if (numCampaigns > 0) {
        console.log('\n?? Sample Campaigns (showing first 3):');
        data.campanhas.slice(0, 3).forEach((campaign, idx) => {
          console.log('\n   Campaign ' + (idx + 1) + ':');
          if (campaign.name) console.log('     - Name: ' + campaign.name);
          if (campaign.tactic) console.log('     - Tactic: ' + campaign.tactic);
          if (campaign.products) console.log('     - Products: ' + campaign.products);
          if (campaign.roi) console.log('     - ROI: ' + campaign.roi);
          if (campaign.profit) console.log('     - Profit: ' + campaign.profit);
        });
      }
    }

    console.log('\n=====================================\n');
    console.log('Full Response:');
    console.log(JSON.stringify(data, null, 2));

  } catch (error) {
    console.error('? Error during upload:');
    if (error.response) {
      console.error('Status: ' + error.response.status);
      console.error('Data:', error.response.data);
    } else if (error.code === 'ECONNREFUSED') {
      console.error('Connection refused - is the server running on http://localhost:5000?');
    } else {
      console.error(error.message);
    }
  }
}

testUpload();
