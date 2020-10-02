const fetch = require('node-fetch');

exports.handler = function(event, context, callback) {
  const api_key = process.env.SENDINBLUE_API_KEY;

  (async () => {
    const { name, email } = JSON.parse(event.body);

    const body = {
      attributes: { NOM: name },
      listIds: [2],
      email: email,
    };

    const response = await fetch('https://api.sendinblue.com/v3/contacts', {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', 'api-key': api_key },
    });

    const res = await response.json();
    callback(null, {
      statusCode: 200,
      body: JSON.stringify({
        error: res.id ? false : true,
        message: res.message ? res.message : '',
      }),
    });
  })();
};
