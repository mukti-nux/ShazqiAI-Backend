export async function searchBrave(query) {
  const apiKey = process.env.BRAVE_API_KEY;
  if (!apiKey) {
    console.error("❌ Brave API Key tidak ditemukan!");
    throw new Error("Brave API Key hilang");
  }

  try {
    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Accept': 'application/json',
        'X-Subscription-Token': apiKey,
      }
    });

    const data = await response.json();

    if (!data.web || data.web.results.length === 0) {
      console.warn("⚠️ Tidak ada hasil dari Brave:", data);
      return [
        {
          title: "Tidak ada hasil ditemukan",
          description: "Brave Search tidak menemukan hasil untuk pencarianmu.",
          url: "https://search.brave.com",
        }
      ];
    }

    return data.web.results.map(result => ({
      title: result.title,
      description: result.description || "(Tidak ada deskripsi)",
      url: result.url
    }));
  } catch (error) {
    console.error("❌ Error saat fetch dari Brave:", error);
    throw error;
  }
}
