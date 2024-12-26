import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const registrants = data.map(row => ({
      fullName: row.fullName || row['Full Name'] || '',
      email: row.email || row.Email || undefined,
      phone: row.phone || row.Phone || '',
      type: row.type || row['Type'] || '',
      clubName: row.clubName || row['Club Name'] || '',
      clubDesignation: row.clubDesignation || row['Club Designation'] || '',
      registrationDate: new Date(),
      checkedIn: false
    }));

    const result = await Registrant.insertMany(registrants);

    return res.status(200).json({ 
      success: true, 
      count: result.length 
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ 
      error: 'Error importing registrants' 
    });
  }
} 