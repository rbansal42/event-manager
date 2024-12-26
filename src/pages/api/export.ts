import { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import * as XLSX from 'xlsx';
import Registrant from '@/models/Registrant';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    // Use Mongoose model instead of direct MongoDB access
    const registrants = await Registrant.find({}).lean();

    // Create a new workbook
    const workbook = XLSX.utils.book_new();

    // Sheet 1: All registrants data with check-in details
    const registrantsData = registrants.map((reg) => ({
      Name: reg.fullName,
      Email: reg.email || '',
      Phone: reg.phone,
      Type: reg.type,
      Club: reg.clubName,
      'Club Designation': reg.clubDesignation || '',
      'Check-in Day 1': reg.dailyCheckIns?.day1?.checkedIn ? 'Yes' : 'No',
      'Check-in Day 2': reg.dailyCheckIns?.day2?.checkedIn ? 'Yes' : 'No',
      'Check-in Day 3': reg.dailyCheckIns?.day3?.checkedIn ? 'Yes' : 'No',
    }));
    const registrantsSheet = XLSX.utils.json_to_sheet(registrantsData);
    XLSX.utils.book_append_sheet(workbook, registrantsSheet, 'All Registrants');

    // Day-wise check-in sheets
    const days = [1, 2, 3];
    days.forEach((day) => {
      const dayData = registrants
        .filter((reg) => reg.dailyCheckIns?.[`day${day}`]?.checkedIn)
        .map((reg) => ({
          Name: reg.fullName,
          Email: reg.email || '',
          Phone: reg.phone,
          Type: reg.type,
          Club: reg.clubName,
          'Club Designation': reg.clubDesignation || '',
          'Check-in Time': reg.dailyCheckIns?.[`day${day}`]?.checkInTime || '',
        }));
      const daySheet = XLSX.utils.json_to_sheet(dayData);
      XLSX.utils.book_append_sheet(workbook, daySheet, `Day ${day} Check-ins`);
    });

    // Club-wise attendance sheet
    const clubData: Record<string, any> = {};
    registrants.forEach((reg) => {
      if (!clubData[reg.clubName]) {
        clubData[reg.clubName] = {
          Club: reg.clubName,
          'Day 1': 0,
          'Day 2': 0,
          'Day 3': 0,
          'Total Unique': 0,
        };
      }
      if (reg.dailyCheckIns?.day1?.checkedIn) clubData[reg.clubName]['Day 1']++;
      if (reg.dailyCheckIns?.day2?.checkedIn) clubData[reg.clubName]['Day 2']++;
      if (reg.dailyCheckIns?.day3?.checkedIn) clubData[reg.clubName]['Day 3']++;
      if (reg.dailyCheckIns?.day1?.checkedIn || 
          reg.dailyCheckIns?.day2?.checkedIn || 
          reg.dailyCheckIns?.day3?.checkedIn) {
        clubData[reg.clubName]['Total Unique']++;
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