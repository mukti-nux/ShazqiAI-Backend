// pages/api/search.js
import { searchBrave } from '@/lib/searchSerper';

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: 'Query kosong!' });
  }

  try {
    const results = await searchBrave(query);
    res.status(200).json({ results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
