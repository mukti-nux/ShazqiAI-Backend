// lib/braveSearch.js

export async function searchBrave(query) {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
      headers: {
        "Accept": "application/json",
        "X-Subscription-Token": process.env.BRAVE_API_KEY,
      },
    });
  
    if (!response.ok) {
      throw new Error(`Gagal fetch dari Brave: ${response.status}`);
    }
  
    const data = await response.json();
    return data?.web?.slice(0, 3) || [];
  }
  