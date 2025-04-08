// utils/cors.ts
import type { NextApiRequest, NextApiResponse } from "next";
import Cors from "cors";

// Inisialisasi middleware CORS
const cors = Cors({
  methods: ["POST", "OPTIONS"],
  origin: ["https://portofoliomukti.framer.website","https://www.portofoliomukti.framer.website"] // Ganti dengan domain Framer kamu kalau mau lebih aman
});

function runMiddleware(req: NextApiRequest, res: NextApiResponse, fn: Function) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function applyCors(req: NextApiRequest, res: NextApiResponse) {
  await runMiddleware(req, res, cors);
}
