/**
 * France Travail API Source (ex-Pôle Emploi)
 * Via proxy Node.js pour contourner les restrictions de Cloudflare Workers
 * Doc: https://pole-emploi.io/data/api/offres-emploi
 */

export async function fetchFranceTravailJobs({ query = '', location = '', limit = 500, env }) {
  const proxyUrl = env.FRANCE_TRAVAIL_PROXY_URL?.trim();

  if (!proxyUrl) {
    console.warn('France Travail: FRANCE_TRAVAIL_PROXY_URL non défini');
    return [];
  }

  try {
    const params = new URLSearchParams({
      query: query || '',
      location: location || '',
      limit: limit.toString()
    });

    console.log(`France Travail: appel du proxy ${proxyUrl}...`);

    const response = await fetch(`${proxyUrl}/api/jobs?${params}`, {
      headers: {
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('France Travail proxy error:', response.status, errorText);
      return [];
    }

    const data = await response.json();

    if (!data.success) {
      console.error('France Travail proxy returned error:', data.error);
      return [];
    }

    console.log(`France Travail: ${data.count} jobs reçus via proxy`);

    return data.jobs || [];
  } catch (error) {
    console.error('Erreur France Travail proxy:', error.message);
    return [];
  }
}
