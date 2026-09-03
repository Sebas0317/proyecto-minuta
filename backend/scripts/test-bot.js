const controller = require('./src/controllers/chatbotController');

async function test() {
  const queries = [
    'orario de la picina',
    'a que hora pasa la basura',
    'donde pago la administracion',
    'tengo paquete para el apto 101?',
    'hay parqueadero libre?',
    'cual es el telefono de la policia'
  ];

  for (const q of queries) {
    let result;
    const req = { body: { message: q } };
    const res = { json: (data) => { result = data; } };
    await controller.queryChatbot(req, res);
    console.log(`\n--- QUERY: "${q}" ---`);
    console.log(`SOURCE: ${result.source}`);
    console.log(`ANSWER:\n${result.answer.slice(0, 120)}...`);
  }
}

test().catch(console.error);