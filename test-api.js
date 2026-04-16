/**
 * Teste de integração - Verifica se os servidores estão rodando
 * Execute com: node test-api.js
 */

import http from 'http';

function testServer(port, name) {
  return new Promise((resolve) => {
    const req = http.get(`http://localhost:${port}`, (res) => {
      resolve({ name, port, status: 'OK', code: res.statusCode });
      req.abort();
    });

    req.on('error', () => {
      resolve({ name, port, status: 'ERRO', code: null });
    });

    req.setTimeout(3000);
  });
}

async function runTests() {
  console.log('\n🧪 TESTE DE INTEGRAÇÃO - SERVIDORES\n');
  console.log('='.repeat(60));

  console.log('\n🔍 Verificando conexão com servidores...\n');

  const backendTest = await testServer(5000, 'Backend');
  const frontendTest = await testServer(5001, 'Frontend');

  console.log(`${backendTest.status === 'OK' ? '✅' : '❌'} Backend (5000): ${backendTest.status}`);
  console.log(`${frontendTest.status === 'OK' ? '✅' : '❌'} Frontend (5001): ${frontendTest.status}`);

  console.log('\n' + '='.repeat(60));

  if (backendTest.status === 'OK' && frontendTest.status === 'OK') {
    console.log('\n✅ TUDO FUNCIONANDO!\n');
    console.log('📝 Próximos passos para testar:\n');
    console.log('   1. Abra: http://localhost:5001');
    console.log('   2. Envie uma planilha Excel com:');
    console.log('      - SKU, Produto, Faturamento, Margem, Ticket Médio');
    console.log('      - Visitas, Vendas, CPC');
    console.log('   3. Aguarde análise e visualize campanhas geradas\n');
  } else {
    console.log('\n❌ Algum servidor não está respondendo!\n');
    if (backendTest.status !== 'OK') {
      console.log('   Execute em outro terminal: npm run dev\n');
    }
    if (frontendTest.status !== 'OK') {
      console.log('   Execute em outro terminal: cd client && npm start\n');
    }
  }
}

runTests();
