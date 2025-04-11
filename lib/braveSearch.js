// lib/braveSearch.js
export async function searchBrave(query) {
  console.log("🔍 Memulai Brave Search dengan query:", query);

  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    console.error("❌ BRAVE_API_KEY tidak ditemukan di environment!");
    throw new Error("API key Brave tidak tersedia.");
  }

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`;
  const headers = {
    Accept: "application/json",
    "X-Subscription-Token": apiKey,
  };

  const response = await fetch(url, { headers });

  if (!response.ok) {
    console.error("❌ Gagal melakukan fetch dari Brave:", response.status, response.statusText);
    throw new Error(`Brave API error: ${response.statusText}`);
  }

  const data = await response.json();
  console.log("✅ Data Brave Search berhasil didapat:", JSON.stringify(data, null, 2));

  const results = data.web?.results || [];
  return results.map((item) => ({
    title: item.title,
    url: item.url,
    description: item.description,
  }));
}
