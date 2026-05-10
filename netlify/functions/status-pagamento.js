const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  const paymentId = event.queryStringParameters && event.queryStringParameters.id;

  if (!paymentId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Payment ID required' }) };
  }

  try {
    const response = await fetch('https://api.mercadopago.com/v1/payments/' + paymentId, {
      headers: {
        'Authorization': 'Bearer ' + MP_ACCESS_TOKEN
      }
    });

    const data = await response.json();

    if (!response.ok) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Erro ao consultar pagamento' }) };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: data.id,
        status: data.status, // pending, approved, rejected, cancelled
        status_detail: data.status_detail,
        amount: data.transaction_amount,
        payer_email: data.payer && data.payer.email
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno' })
    };
  }
};
