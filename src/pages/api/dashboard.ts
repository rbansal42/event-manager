import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';

type DashboardData = {
  totalRegistrants: number;
  checkedIn: number;
  byType: {
    Rotarian: number;
    Rotaractor: number;
    Interactor: number;
  };
  recentCheckins: Array<{
    fullName: string;
    clubName: string;
    checkInTime: Date;
  }>;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<DashboardData>
) {
  if (req.method !== 'GET') {
    return res.status(405).end();
  }

  try {
    await dbConnect();

    const [totalRegistrants, checkedIn, byType, recentCheckins] = await Promise.all([
      Registrant.countDocuments(),
      Registrant.countDocuments({ checkedIn: true }),
      Registrant.aggregate([
        { $unwind: '$type' },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ]),
      Registrant.find({ checkedIn: true })
        .sort({ checkInTime: -1 })
        .limit(5)
        .select('fullName clubName checkInTime')
    ]);

    const typeCount = {
      Rotarian: 0,
      Rotaractor: 0,
      Interactor: 0
    };

    byType.forEach(({ _id, count }) => {
      typeCount[_id] = count;
    });

    res.status(200).json({
      totalRegistrants,
      checkedIn,
      byType: typeCount,
      recentCheckins
    });
  } catch (error) {
    res.status(500).end();
  }
} 