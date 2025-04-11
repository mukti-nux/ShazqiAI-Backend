export async function searchBrave(query) {
  const response = await fetch('https://api.search.brave.com/res/v1/web/search', {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'X-Subscription-Token': process.env.BRAVE_API_KEY,
    },
    // Brave API pakai query di params
    next: { revalidate: 3600 }, // Optional
  });

  const data = await response.json();

  // Ambil hanya bagian web results
  return data.web?.results || [];
}
