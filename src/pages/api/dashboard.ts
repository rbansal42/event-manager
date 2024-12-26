import type { NextApiRequest, NextApiResponse } from 'next';
import dbConnect from '@/lib/mongodb';
import Registrant from '@/models/Registrant';

interface CheckInData {
  fullName: string;
  clubName: string;
  checkInTime: Date;
}

interface TypeStats {
  total: number;
  checkedIn: number;
  percentage: number;
  dailyStats: {
    day1: { checkedIn: number; percentage: number };
    day2: { checkedIn: number; percentage: number };
    day3: { checkedIn: number; percentage: number };
  };
}

interface ClubStats {
  total: number;
  checkedIn: number;
  percentage: number;
  types: Record<string, number>;
  dailyStats: {
    day1: { checkedIn: number; percentage: number };
    day2: { checkedIn: number; percentage: number };
    day3: { checkedIn: number; percentage: number };
  };
}

type DashboardData = {
  totalRegistrants: number;
  checkedIn: number;
  dailyStats: {
    day1: { checkedIn: number; percentage: number };
    day2: { checkedIn: number; percentage: number };
    day3: { checkedIn: number; percentage: number };
  };
  byType: Record<string, TypeStats>;
  byClub: Record<string, ClubStats>;
  recentCheckins: CheckInData[];
};

type ApiResponse = DashboardData | { error: string };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get total registrants
    const totalRegistrants = await Registrant.countDocuments();
    
    // Get checked in count
    const checkedIn = await Registrant.countDocuments({ checkedIn: true });

    // Get daily check-in counts
    const dailyStats = {
      day1: {
        checkedIn: await Registrant.countDocuments({ 'dailyCheckIns.day1.checkedIn': true }),
        percentage: 0
      },
      day2: {
        checkedIn: await Registrant.countDocuments({ 'dailyCheckIns.day2.checkedIn': true }),
        percentage: 0
      },
      day3: {
        checkedIn: await Registrant.countDocuments({ 'dailyCheckIns.day3.checkedIn': true }),
        percentage: 0
      }
    };

    // Calculate daily percentages
    dailyStats.day1.percentage = Math.round((dailyStats.day1.checkedIn / totalRegistrants) * 100);
    dailyStats.day2.percentage = Math.round((dailyStats.day2.checkedIn / totalRegistrants) * 100);
    dailyStats.day3.percentage = Math.round((dailyStats.day3.checkedIn / totalRegistrants) * 100);
    
    // Get stats by type with daily check-ins
    const typeStats = await Registrant.aggregate([
      {
        $group: {
          _id: '$type',
          total: { $sum: 1 },
          checkedIn: { 
            $sum: { $cond: [{ $eq: ['$checkedIn', true] }, 1, 0] }
          },
          day1CheckedIn: {
            $sum: { $cond: [{ $eq: ['$dailyCheckIns.day1.checkedIn', true] }, 1, 0] }
          },
          day2CheckedIn: {
            $sum: { $cond: [{ $eq: ['$dailyCheckIns.day2.checkedIn', true] }, 1, 0] }
          },
          day3CheckedIn: {
            $sum: { $cond: [{ $eq: ['$dailyCheckIns.day3.checkedIn', true] }, 1, 0] }
          }
        }
      }
    ]).exec();

    // Get stats by club with daily check-ins
    const clubStats = await Registrant.aggregate([
      {
        $group: {
          _id: '$clubName',
          total: { $sum: 1 },
          checkedIn: { 
            $sum: { $cond: [{ $eq: ['$checkedIn', true] }, 1, 0] }
          },
          day1CheckedIn: {
            $sum: { $cond: [{ $eq: ['$dailyCheckIns.day1.checkedIn', true] }, 1, 0] }
          },
          day2CheckedIn: {
            $sum: { $cond: [{ $eq: ['$dailyCheckIns.day2.checkedIn', true] }, 1, 0] }
          },
          day3CheckedIn: {
            $sum: { $cond: [{ $eq: ['$dailyCheckIns.day3.checkedIn', true] }, 1, 0] }
          },
          types: {
            $push: '$type'
          }
        }
      }
    ]).exec();

    // Get recent check-ins
    const rawCheckins = await Registrant.find(
      { checkedIn: true },
      { fullName: 1, clubName: 1, checkInTime: 1, _id: 0 }
    )
      .sort({ checkInTime: -1 })
      .limit(10)
      .lean();

    const recentCheckins = rawCheckins.map(checkin => ({
      fullName: checkin.fullName,
      clubName: checkin.clubName,
      checkInTime: checkin.checkInTime
    }));

    // Process type statistics
    const byType = typeStats.reduce<Record<string, TypeStats>>((acc, { 
      _id, total, checkedIn, day1CheckedIn, day2CheckedIn, day3CheckedIn 
    }) => ({
      ...acc,
      [_id as string]: {
        total,
        checkedIn,
        percentage: Math.round((checkedIn / total) * 100),
        dailyStats: {
          day1: {
            checkedIn: day1CheckedIn,
            percentage: Math.round((day1CheckedIn / total) * 100)
          },
          day2: {
            checkedIn: day2CheckedIn,
            percentage: Math.round((day2CheckedIn / total) * 100)
          },
          day3: {
            checkedIn: day3CheckedIn,
            percentage: Math.round((day3CheckedIn / total) * 100)
          }
        }
      }
    }), {});

    // Process club statistics
    const byClub = clubStats.reduce<Record<string, ClubStats>>((acc, { 
      _id, total, checkedIn, day1CheckedIn, day2CheckedIn, day3CheckedIn, types 
    }) => {
      // Count types for this club
      const typeCount = types.reduce((typeAcc: Record<string, number>, type: string) => ({
        ...typeAcc,
        [type]: (typeAcc[type] || 0) + 1
      }), {} as Record<string, number>);

      return {
        ...acc,
        [_id as string]: {
          total,
          checkedIn,
          percentage: Math.round((checkedIn / total) * 100),
          types: typeCount,
          dailyStats: {
            day1: {
              checkedIn: day1CheckedIn,
              percentage: Math.round((day1CheckedIn / total) * 100)
            },
            day2: {
              checkedIn: day2CheckedIn,
              percentage: Math.round((day2CheckedIn / total) * 100)
            },
            day3: {
              checkedIn: day3CheckedIn,
              percentage: Math.round((day3CheckedIn / total) * 100)
            }
          }
        }
      };
    }, {});

    return res.status(200).json({
      totalRegistrants,
      checkedIn,
      dailyStats,
      byType,
      byClub,
      recentCheckins
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
} 