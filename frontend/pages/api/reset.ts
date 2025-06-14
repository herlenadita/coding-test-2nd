import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const backendRes = await axios.post('http://localhost:8000/api/reset');
    return res.status(backendRes.status).json(backendRes.data);
  } catch (error: any) {
    const msg =
      error.response?.data?.detail || error.message || 'Failed to reset on backend.';
    return res.status(500).json({ error: msg });
  }
}
