import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';
import type { Document, Types } from 'mongoose';

interface DailyCheckIn {
  checkedIn: boolean;
  checkInTime?: Date;
}

interface RegistrantDocument extends Document {
  fullName: string;
  phone: string;
  type: string;
  clubName: string;
  dailyCheckIns: {
    day1: DailyCheckIn;
    day2: DailyCheckIn;
    day3: DailyCheckIn;
  };
}

interface LeanRegistrant {
  _id: string;
  fullName: string;
  phone: string;
  type: string;
  clubName: string; 
  dailyCheckIns: {
    day1: DailyCheckIn;
    day2: DailyCheckIn;
    day3: DailyCheckIn;
  };
}

type ApiResponse = {
  success: boolean;
  message: string;
  registrant?: LeanRegistrant;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { registrantId, day, action } = req.body;

    if (!registrantId || !day || !action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: registrantId, day, and action',
      });
    }

    // Validate day parameter
    if (!['day1', 'day2', 'day3'].includes(day)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid day parameter. Must be day1, day2, or day3',
      });
    }

    const registrant = await Registrant.findById(registrantId);

    if (!registrant) {
      return res.status(404).json({
        success: false,
        message: 'Registrant not found',
      });
    }

    // Update the daily check-in status
    const updatePath = `dailyCheckIns.${day}`;
    const update = action === 'check-in' 
      ? { 
          [`${updatePath}.checkedIn`]: true,
          [`${updatePath}.checkInTime`]: new Date(),
          // Also update the overall check-in status if not already checked in
          ...(registrant.checkedIn ? {} : {
            checkedIn: true,
            checkInTime: new Date()
          })
        }
      : {
          [`${updatePath}.checkedIn`]: false,
          [`${updatePath}.checkInTime`]: null
        };

    const doc = await Registrant.findByIdAndUpdate(
      registrantId,
      update,
      { new: true }
    );

    if (!doc) {
      throw new Error('Failed to update registrant');
    }

    const response: LeanRegistrant = {
      _id: doc._id.toString(),
      fullName: doc.fullName,
      phone: doc.phone,
      type: doc.type,
      clubName: doc.clubName,
      dailyCheckIns: doc.dailyCheckIns,
    };

    return res.status(200).json({
      success: true,
      message: `Successfully ${action === 'check-in' ? 'checked in' : 'removed check-in for'} registrant for ${day}`,
      registrant: response,
    });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error during check-in',
    });
  }
} 