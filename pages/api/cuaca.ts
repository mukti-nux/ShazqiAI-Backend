// pages/api/cuaca.ts
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const response = await fetch("https://api.open-meteo.com/v1/forecast?latitude=-7.4706&longitude=110.2178&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_hours,uv_index_clear_sky_max&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FBangkok");
    const data = await response.json();

    return res.status(200).json({ cuaca: data });
  } catch (error: any) {
    console.error("Cuaca Error:", error.message);
    return res.status(500).json({ error: "Gagal mengambil data cuaca" });
  }
}
