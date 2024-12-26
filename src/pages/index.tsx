import { useEffect, useState } from 'react';
import { Geist } from 'next/font/google';
import Link from 'next/link';

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
    <div className={`${geist.className} min-h-screen bg-background p-8`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Event Dashboard</h1>
          <Link 
            href="/check-in"
            className="bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90"
          >
            Go to Check-in
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-foreground/5 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Total Registrants</h2>
            <p className="text-3xl font-bold">{data?.totalRegistrants}</p>
          </div>
          <div className="bg-foreground/5 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">Checked In</h2>
            <p className="text-3xl font-bold">
              {data?.checkedIn} / {data?.totalRegistrants}
              <span className="text-sm ml-2">
                ({((data?.checkedIn || 0) / (data?.totalRegistrants || 1) * 100).toFixed(1)}%)
              </span>
            </p>
          </div>
          <div className="bg-foreground/5 p-6 rounded-lg">
            <h2 className="text-lg font-semibold mb-2">By Type</h2>
            <div className="space-y-2">
              {Object.entries(data?.byType || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between">
                  <span>{type}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-foreground/5 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Recent Check-ins</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left border-b border-foreground/10">
                  <th className="pb-2">Name</th>
                  <th className="pb-2">Club</th>
                  <th className="pb-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentCheckins.map((checkin, index) => (
                  <tr key={index} className="border-b border-foreground/5">
                    <td className="py-3">{checkin.fullName}</td>
                    <td className="py-3">{checkin.clubName}</td>
                    <td className="py-3">
                      {new Date(checkin.checkInTime).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
