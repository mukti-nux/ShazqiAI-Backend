// lib/weatherAPI.ts

export async function getWeather(city = "Yogyakarta") {
    // Sementara hardcoded untuk Jogja
    const latitude = -7.79;
    const longitude = 110.36;
  
    const response = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=-7.4706&longitude=110.2178&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_sum,precipitation_hours,uv_index_clear_sky_max&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,wind_direction_10m&timezone=Asia%2FBangkok`);
  
    if (!response.ok) {
      throw new Error("Gagal mengambil data cuaca.");
    }
  
    const data = await response.json();
    return data; // data.current_weather bisa kamu akses di tempat lain
  }
  