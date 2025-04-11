// lib/braveSearch.js
export async function searchBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;
  // ...
}
export async function searchBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    console.error("❌ BRAVE_API_KEY tidak ditemukan di .env");
    throw new Error("Brave API key tidak tersedia.");
  }

  const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-Subscription-Token": apiKey
    }
  });

  const data = await response.json();

  if (!data.web || !data.web.results) {
    console.warn("⚠️ Tidak ada hasil dari Brave:", data);
    return [{
      title: "Tidak ditemukan",
      description: "Brave tidak mengembalikan hasil yang relevan.",
      url: ""
    }];
  }

  // Format hasilnya biar rapi
  return data.web.results.map((item) => ({
    title: item.title,
    description: item.description,
    url: item.url
  }));
}
