import type { NextApiRequest, NextApiResponse } from 'next';
import { IncomingForm, File as FormidableFile } from 'formidable';
import fs from 'fs';
import axios from 'axios';
import FormData from 'form-data';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const form = new IncomingForm({ multiples: false, keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err || !files.file) {
      return res.status(400).json({ error: 'No file uploaded or failed to parse form.' });
    }

    const uploadedFile = Array.isArray(files.file)
      ? files.file[0]
      : (files.file as FormidableFile);

    const formData = new FormData();
    formData.append(
      'file',
      fs.createReadStream(uploadedFile.filepath),
      uploadedFile.originalFilename
    );

    try {
      const backendRes = await axios.post(
        'http://localhost:8000/api/upload',
        formData,
        {
          headers: formData.getHeaders(),
        }
      );

      return res.status(backendRes.status).json(backendRes.data);
    } catch (error: any) {
      const msg =
        error.response?.data?.detail ||
        error.message ||
        'Failed to upload to backend.';
      return res.status(500).json({ error: msg });
    }
  });
}
