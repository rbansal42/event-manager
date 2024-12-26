import { useEffect, useState } from 'react';
import { Geist } from 'next/font/google';
import { Header } from '@/components/Header';

const geist = Geist({ subsets: ['latin'] });

type TypeStats = {
  total: number;
  checkedIn: number;
  percentage: number;
};

type ClubStats = {
  total: number;
  checkedIn: number;
  percentage: number;
  types: Record<string, number>;
};

type DashboardData = {
  totalRegistrants: number;
  checkedIn: number;
  byType: Record<string, TypeStats>;
  byClub: Record<string, ClubStats>;
  recentCheckins: Array<{
    fullName: string;
    clubName: string;
    checkInTime: Date;
  }>;
};

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/dashboard');
        const dashboardData = await response.json();
        setData(dashboardData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foreground"></div>
      </div>
    );
  }

  return (
    <div className={geist.className}>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Total Registrants</h2>
              <p className="text-3xl font-bold">{data?.totalRegistrants}</p>
            </div>
            <div className="bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Checked In</h2>
              <p className="text-3xl font-bold">
                {data?.checkedIn} / {data?.totalRegistrants}
                <span className="text-sm ml-2 text-muted-foreground">
                  ({((data?.checkedIn || 0) / (data?.totalRegistrants || 1) * 100).toFixed(1)}%)
                </span>
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Check-in Progress</h2>
              <div className="w-full bg-muted rounded-full h-4 mb-2">
                <div 
                  className="bg-primary rounded-full h-4 transition-all duration-500"
                  style={{ width: `${((data?.checkedIn || 0) / (data?.totalRegistrants || 1) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Registration by Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data?.byType && Object.entries(data.byType).map(([type, stats]) => (
                <div key={type} className="bg-secondary rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">{type}</h3>
                    <span className="text-xs text-muted-foreground">
                      {stats.percentage}% checked in
                    </span>
                  </div>
                  <p className="text-2xl font-bold mb-2">
                    {stats.checkedIn} / {stats.total}
                  </p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="bg-primary rounded-full h-2 transition-all duration-500"
                      style={{ width: `${stats.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Registration by Club</h2>
            <div className="bg-secondary rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-medium">Club</th>
                      <th className="text-left p-4 font-medium">Total</th>
                      <th className="text-left p-4 font-medium">Checked In</th>
                      <th className="text-left p-4 font-medium">Progress</th>
                      <th className="text-left p-4 font-medium">Types</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data?.byClub && Object.entries(data.byClub)
                      .sort(([, a], [, b]) => b.total - a.total)
                      .map(([club, stats]) => (
                        <tr key={club} className="border-b border-border">
                          <td className="p-4">{club}</td>
                          <td className="p-4">{stats.total}</td>
                          <td className="p-4">
                            {stats.checkedIn}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({stats.percentage}%)
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="w-32 bg-muted rounded-full h-2">
                              <div 
                                className="bg-primary rounded-full h-2 transition-all duration-500"
                                style={{ width: `${stats.percentage}%` }}
                              />
                            </div>
                          </td>
                          <td className="p-4">
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(stats.types).map(([type, count]) => (
                                <span 
                                  key={type}
                                  className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-accent text-accent-foreground"
                                >
                                  {type}: {count}
                                </span>
                              ))}
                            </div>
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="bg-secondary rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Check-ins</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-border">
                    <th className="pb-2 font-semibold">Name</th>
                    <th className="pb-2 font-semibold">Club</th>
                    <th className="pb-2 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.recentCheckins.map((checkin, index) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-3">{checkin.fullName}</td>
                      <td className="py-3 text-muted-foreground">{checkin.clubName}</td>
                      <td className="py-3 text-muted-foreground">
                        {new Date(checkin.checkInTime).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
