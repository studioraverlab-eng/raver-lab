const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

exports.handler = async (event) => {
  // Só aceita POST
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

    // Criar pagamento Pix no Mercado Pago
    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + MP_ACCESS_TOKEN,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': email + '-' + Date.now()
      },
      body: JSON.stringify({
        transaction_amount: parseFloat(valor),
        description: descricao || 'Raver Lab — Ativação do Lab',
        payment_method_id: 'pix',
        payer: {
          email: email,
          first_name: nome.split(' ')[0],
          last_name: nome.split(' ').slice(1).join(' ') || 'Cliente'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('MP Error:', JSON.stringify(data));
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: data.message || 'Erro ao criar pagamento' })
      };
    }

    // Retornar só o que o frontend precisa
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        id: data.id,
        status: data.status,
        qr_code: data.point_of_interaction?.transaction_data?.qr_code,
        qr_code_base64: data.point_of_interaction?.transaction_data?.qr_code_base64,
        valor: data.transaction_amount
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
