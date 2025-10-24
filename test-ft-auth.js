const clientId = 'PAR_ftapi_2feb28ee0c191f5e08bbea1d27a972d0f04534552272ddf6cc7f5ddf7b2fc116';
const clientSecret = '3292ef4d296afdb4ea5b775db37b26597acc76f65c6cf17c702a249b1729c108';

async function testAuth() {
  console.log('Testing France Travail OAuth2...');
  console.log('Client ID:', clientId);

  // CORRECTION: Ajouter le préfixe application_ au scope
  const scope = `application_${clientId} api_offresdemploiv2 o2dsoffre`;
  console.log('Scope:', scope);

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
    scope: scope,
  }).toString();

  console.log('\nRequest body:', body);

  try {
    const response = await fetch('https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'alternant-talent-app/1.0 (+https://alternant-talent.app)',
        'Accept': 'application/json',
      },
      body
    });

    console.log('\nStatus:', response.status);
    console.log('Status text:', response.statusText);

    const text = await response.text();
    console.log('\nResponse:', text);

    if (response.ok) {
      const data = JSON.parse(text);
      console.log('\n✅ Authentication successful!');
      console.log('Access token:', data.access_token?.substring(0, 20) + '...');
      console.log('Token type:', data.token_type);
      console.log('Expires in:', data.expires_in, 'seconds');
    } else {
      console.log('\n❌ Authentication failed');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

testAuth();
