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

    const results = {
      success: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Process each row individually to handle duplicates
    for (const row of data) {
      try {
        const registrant = {
          fullName: row.fullName || row['Full Name'] || '',
          email: row.email || row.Email || undefined,
          phone: row.phone || row['Phone'] || '',
          type: row.type || row['Type'] || '',
          clubName: row.clubName || row['Club Name'] || '',
          clubDesignation: row.clubDesignation || row['Club Designation'] || undefined,
          registrationDate: new Date(),
          checkedIn: false
        };

        // Check if phone number already exists
        const existing = await Registrant.findOne({ phone: registrant.phone });
        if (existing) {
          results.skipped++;
          continue;
        }

        await Registrant.create(registrant);
        results.success++;
      } catch (err) {
        results.errors.push(`Row error: ${err.message}`);
      }
    }

    return res.status(200).json({ 
      success: true,
      imported: results.success,
      skipped: results.skipped,
      errors: results.errors
    });

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ 
      error: 'Error importing registrants' 
    });
  }
} 