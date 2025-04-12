// pages/api/cuaca.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { getWeather } from '../../lib/weatherAPI';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const data = await getWeather(); // default Jogja
    res.status(200).json({ 
      success: true,
      location: "Yogyakarta",
      temperature: data.current_weather.temperature,
      windspeed: data.current_weather.windspeed,
      unit: "°C"
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
}
