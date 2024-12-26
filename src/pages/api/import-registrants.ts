import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data } = req.body;

    if (!Array.isArray(data)) {
      return res.status(400).json({ error: 'Invalid data format' });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection(process.env.MONGODB_COLLECTION_REGISTRATIONS!);

    // Transform the data to match your schema
    const registrants = data.map(row => ({
      firstName: row.firstName || row['First Name'] || '',
      lastName: row.lastName || row['Last Name'] || '',
      email: row.email || row.Email || '',
      phone: row.phone || row.Phone || '',
      rotaryClub: row.rotaryClub || row['Rotary Club'] || '',
      createdAt: new Date(),
      updatedAt: new Date()
    }));

    // Insert the data
    const result = await collection.insertMany(registrants);

    return res.status(200).json({ 
      success: true, 
      count: result.insertedCount 
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ 
      error: 'Error importing registrants' 
    });
  }
} 