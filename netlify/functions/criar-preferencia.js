const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  };

  try {
    const body = JSON.parse(event.body);
    const { nome, email, descricao, valor } = body;

    if (!nome || !email || !valor) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Dados incompletos' }) };
    }

    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + MP_ACCESS_TOKEN,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        items: [
          {
            title: descricao || 'Raver Lab — Pedido',
            quantity: 1,
            currency_id: 'BRL',
            unit_price: parseFloat(valor)
          }
        ],
        payer: {
          email: email,
          name: nome
        },
        payment_methods: {
          excluded_payment_types: [{ id: 'ticket' }]
        },
        back_urls: {
          success: 'https://sage-pika-6b6a4b.netlify.app/?pagamento=sucesso',
          failure: 'https://sage-pika-6b6a4b.netlify.app/?pagamento=erro',
          pending: 'https://sage-pika-6b6a4b.netlify.app/?pagamento=pendente'
        },
        auto_return: 'approved',
        statement_descriptor: 'RAVER LAB',
        external_reference: 'RL-' + Date.now()
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP Preference Error:', JSON.stringify(data));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || 'Erro ao criar preferencia' })
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: data.id,
        init_point: data.init_point,
        sandbox_init_point: data.sandbox_init_point
      })
    };

  } catch (err) {
    console.error('Function error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Erro interno. Tente novamente.' })
    };
  }
};
