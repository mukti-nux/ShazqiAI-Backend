export async function searchBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    console.error("❌ BRAVE_API_KEY tidak ditemukan di environment.");
    throw new Error("BRAVE_API_KEY tidak tersedia.");
  }

  const url = `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`;

  console.log("🌐 Mengirim permintaan ke Brave API dengan query:", query);

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("❌ Gagal ambil data dari Brave:", errText);
    throw new Error("Gagal mengambil data dari Brave API");
  }

  const data = await response.json();
  console.log("✅ Hasil dari Brave:", data.web?.results?.slice(0, 3)); // tampilkan 3 hasil teratas

  return data.web?.results || [];
}
