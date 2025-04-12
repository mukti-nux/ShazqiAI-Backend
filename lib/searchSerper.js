export async function searchSerper(query) {
  const response = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": process.env.SERPER_API_KEY,
    },
    body: JSON.stringify({ q: query }),
  });

  if (!response.ok) {
    throw new Error("Gagal mengambil data dari Serper API");
  }

  const data = await response.json();
  return data.organic || [];
}
