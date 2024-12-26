import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { email } = req.body;

    const registrant = await Registrant.findOne({ email });
    
    if (!registrant) {
      return res.status(404).json({ message: 'Registrant not found' });
    }

    if (registrant.checkedIn) {
      return res.status(400).json({ message: 'Registrant already checked in' });
    }

    registrant.checkedIn = true;
    registrant.checkInTime = new Date();
    await registrant.save();

    return res.status(200).json(registrant);
  } catch (error) {
    console.error('Check-in error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
} 