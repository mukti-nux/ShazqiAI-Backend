import axios from 'axios';

export async function searchSerper(query) {
  try {
    const response = await axios.post(
      'https://google.serper.dev/search',
      { q: query, gl: "id" },
      {
        headers: {
          'X-API-KEY': process.env.SERPER_API_KEY,
          'Content-Type': 'application/json',
        },
        maxBodyLength: Infinity,
      }
    );

    return response.data.organic || [];
  } catch (error) {
    console.error("❌ Gagal mengambil data dari Serper:", error.message);
    throw new Error("Gagal mengambil data dari Serper");
  }
}
