// lib/braveSearch.js

export async function searchBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;

  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
    next: { revalidate: 3600 }, // Optional: untuk caching (kalau pakai Next.js)
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data dari Brave API");
  }

  const data = await response.json();
  return data.web?.results || [];
}
