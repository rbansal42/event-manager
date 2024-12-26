import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const registrants = await Registrant.find({}).sort({ registrationDate: -1 });
    return res.status(200).json(registrants);
  } catch (error) {
    console.error('Fetch registrants error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
} 