import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  if (req.method === 'GET') {
    try {
      const registrants = await Registrant.find({}).sort({ fullName: 1 });
      return res.status(200).json(registrants);
    } catch (error) {
      console.error('Error fetching registrants:', error);
      return res.status(500).json({ error: 'Failed to fetch registrants' });
    }
  }

  if (req.method === 'POST') {
    try {
      const { fullName, phone, type, clubName } = req.body;

      // Validate required fields
      if (!fullName || !phone || !type || !clubName) {
        return res.status(400).json({ error: 'All fields are required' });
      }

      // Validate type enum
      const validTypes = ['Rotarian', 'Rotaractor', 'Interactor', 'Guardian'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({ error: 'Invalid type' });
      }

      // Check for duplicate phone number
      const existingRegistrant = await Registrant.findOne({ phone });
      if (existingRegistrant) {
        return res.status(400).json({ error: 'A registrant with this phone number already exists' });
      }

      // Create new registrant
      const registrant = await Registrant.create({
        fullName,
        phone,
        type,
        clubName,
        dailyCheckIns: {
          day1: { checkedIn: false },
          day2: { checkedIn: false },
          day3: { checkedIn: false },
        },
      });

      return res.status(201).json(registrant);
    } catch (error) {
      console.error('Error creating registrant:', error);
      return res.status(500).json({ error: 'Failed to create registrant' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
} 