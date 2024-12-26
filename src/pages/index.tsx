import { useEffect, useState } from 'react';
import { Geist } from 'next/font/google';
import { Header } from '@/components/Header';

const geist = Geist({ subsets: ['latin'] });

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
              <h2 className="text-lg font-semibold mb-2">By Type</h2>
              <div className="space-y-2">
                {Object.entries(data?.byType || {}).map(([type, count]) => (
                  <div key={type} className="flex justify-between">
                    <span className="text-muted-foreground">{type}</span>
                    <span className="font-semibold">{count}</span>
                  </div>
                ))}
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
