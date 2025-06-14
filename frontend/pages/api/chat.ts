import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Only POST allowed' });

  const { question, chatHistory } = req.body;

  try {
    const response = await fetch('http://localhost:8000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, chat_history: chatHistory || [] })
    });

    const result = await response.json();
    res.status(response.status).json(result);
  } catch (error: any) {
    res.status(500).json({ error: 'Chat failed: ' + error.message });
  }
}
