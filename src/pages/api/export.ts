import { NextApiRequest, NextApiResponse } from 'next';
import { connectToDatabase } from '@/lib/mongodb';
import * as XLSX from 'xlsx';
import { Registrant } from '@/models/Registrant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const registrants = await db.collection('registrants').find({}).toArray();

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: All registrants data with check-in details
    const registrantsData = registrants.map((reg: any) => ({
      Name: reg.name,
      Email: reg.email,
      Phone: reg.phone,
      Club: reg.club,
      'Check-in Day 1': reg.checkInDay1 ? 'Yes' : 'No',
      'Check-in Day 2': reg.checkInDay2 ? 'Yes' : 'No',
      'Check-in Day 3': reg.checkInDay3 ? 'Yes' : 'No',
    }));
    const registrantsSheet = XLSX.utils.json_to_sheet(registrantsData);
    XLSX.utils.book_append_sheet(workbook, registrantsSheet, 'All Registrants');

    // Day-wise check-in sheets
    const days = [1, 2, 3];
    days.forEach((day) => {
      const dayData = registrants
        .filter((reg: any) => reg[`checkInDay${day}`])
        .map((reg: any) => ({
          Name: reg.name,
          Email: reg.email,
          Phone: reg.phone,
          Club: reg.club,
          'Check-in Time': reg[`checkInDay${day}Time`] || '',
        }));
      const daySheet = XLSX.utils.json_to_sheet(dayData);
      XLSX.utils.book_append_sheet(workbook, daySheet, `Day ${day} Check-ins`);
    });

    // Club-wise attendance sheet
    const clubData: any = {};
    registrants.forEach((reg: any) => {
      if (!clubData[reg.club]) {
        clubData[reg.club] = {
          Club: reg.club,
          'Day 1': 0,
          'Day 2': 0,
          'Day 3': 0,
          'Total Unique': 0,
        };
      }
      if (reg.checkInDay1) clubData[reg.club]['Day 1']++;
      if (reg.checkInDay2) clubData[reg.club]['Day 2']++;
      if (reg.checkInDay3) clubData[reg.club]['Day 3']++;
      if (reg.checkInDay1 || reg.checkInDay2 || reg.checkInDay3) {
        clubData[reg.club]['Total Unique']++;
      }
    });

    const clubSheet = XLSX.utils.json_to_sheet(Object.values(clubData));
    XLSX.utils.book_append_sheet(workbook, clubSheet, 'Club-wise Attendance');

    // Generate Excel file
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    // Set headers for file download
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=event-data.xlsx');
    
    return res.status(200).send(buffer);
  } catch (error) {
    console.error('Export error:', error);
    return res.status(500).json({ message: 'Error exporting data' });
  }
} 