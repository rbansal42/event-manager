import type { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import Registrant from '@/models/Registrant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const collection = db.collection(process.env.MONGODB_COLLECTION_REGISTRATIONS!);
    const { email } = req.body;

    const registrant = await collection.findOne({ email });
    
    if (!registrant) {
      return res.status(404).json({ message: 'Registrant not found' });
    }

    if (registrant.checkedIn) {
      return res.status(400).json({ message: 'Registrant already checked in' });
    }

    await collection.updateOne({ email }, { $set: { checkedIn: true, checkInTime: new Date() } });

    return res.status(200).json(registrant);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
} 