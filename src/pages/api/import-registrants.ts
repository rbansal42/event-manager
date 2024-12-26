import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';
import csv from 'csv-parser';
import { Readable } from 'stream';

interface ImportRegistrant {
  fullName: string;
  phone: string;
  type: 'Rotarian' | 'Rotaractor' | 'Interactor' | 'Guardian';
  clubName: string;
  clubDesignation?: string;
}

interface ImportResults {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
}

type ApiResponse = ImportResults | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    const results = {
      success: true,
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    };

    // Create a readable stream from the request body
    const bufferStream = new Readable();
    bufferStream.push(req.body.csvData);
    bufferStream.push(null);

    // Process the CSV stream
    const processStream = () => {
      return new Promise((resolve) => {
        bufferStream
          .pipe(csv({
            mapValues: ({ header, value }) => value.trim()
          }))
          .on('data', async (row) => {
            try {
              // Validate required fields
              if (!row.fullName && !row['Full Name']) {
                throw new Error('Full name is required');
              }
              if (!row.phone && !row['Phone']) {
                throw new Error('Phone number is required');
              }
              if (!row.type && !row['Type']) {
                throw new Error('Type is required');
              }
              if (!row.clubName && !row['Club Name']) {
                throw new Error('Club name is required');
              }

              const registrant: ImportRegistrant = {
                fullName: row.fullName || row['Full Name'],
                phone: row.phone || row['Phone'],
                type: row.type || row['Type'],
                clubName: row.clubName || row['Club Name'],
              };

              // Handle optional fields
              const clubDesignation = row.clubDesignation || row['Club Designation'];
              if (clubDesignation) {
                registrant.clubDesignation = clubDesignation;
              }

              // Validate type enum
              if (!['Rotarian', 'Rotaractor', 'Interactor', 'Guardian'].includes(registrant.type)) {
                throw new Error(`Invalid type: ${registrant.type}`);
              }

              // Check for duplicate phone
              const existingPhone = await Registrant.findOne({ phone: registrant.phone });
              if (existingPhone) {
                results.skipped++;
                return;
              }

              // Create new registrant
              await Registrant.create({
                ...registrant,
                checkedIn: false,
                dailyCheckIns: {
                  day1: { checkedIn: false },
                  day2: { checkedIn: false },
                  day3: { checkedIn: false }
                }
              });
              results.imported++;
            } catch (error) {
              if (error instanceof Error) {
                results.errors.push(`Row error: ${error.message}`);
              }
            }
          })
          .on('end', () => {
            resolve(results);
          });
      });
    };

    const finalResults = await processStream();
    return res.status(200).json(finalResults);

  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Failed to import registrants' });
  }
} 