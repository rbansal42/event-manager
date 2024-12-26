import { useEffect, useState } from 'react';
import { Geist } from 'next/font/google';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowUpDown, Search, TrendingUp, Users, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const geist = Geist({ subsets: ['latin'] });

type DailyStats = {
  checkedIn: number;
  percentage: number;
};

type TypeStats = {
  total: number;
  checkedIn: number;
  percentage: number;
  dailyStats: {
    day1: DailyStats;
    day2: DailyStats;
    day3: DailyStats;
  };
};

type ClubStats = {
  total: number;
  checkedIn: number;
  percentage: number;
  types: Record<string, number>;
  dailyStats: {
    day1: DailyStats;
    day2: DailyStats;
    day3: DailyStats;
  };
};

type DashboardData = {
  totalRegistrants: number;
  checkedIn: number;
  dailyStats: {
    day1: DailyStats;
    day2: DailyStats;
    day3: DailyStats;
  };
  byType: Record<string, TypeStats>;
  byClub: Record<string, ClubStats>;
  recentCheckins: Array<{
    fullName: string;
    clubName: string;
    checkInTime: Date;
  }>;
};

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
};

const DashboardContent = ({ data, selectedDay }: { data: DashboardData, selectedDay?: string }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'total', direction: 'desc' });

  // Prepare data for attendance trends chart
  const attendanceTrendsData = [
    {
      name: 'Day 1',
      attendance: data.dailyStats.day1.checkedIn,
      percentage: data.dailyStats.day1.percentage,
    },
    {
      name: 'Day 2',
      attendance: data.dailyStats.day2.checkedIn,
      percentage: data.dailyStats.day2.percentage,
    },
    {
      name: 'Day 3',
      attendance: data.dailyStats.day3.checkedIn,
      percentage: data.dailyStats.day3.percentage,
    },
  ];

  // Prepare data for type comparison
  const typeComparisonData = Object.entries(data.byType).map(([type, stats]) => ({
    type,
    total: stats.total,
    day1: stats.dailyStats.day1.checkedIn,
    day2: stats.dailyStats.day2.checkedIn,
    day3: stats.dailyStats.day3.checkedIn,
    avgAttendance: ((stats.dailyStats.day1.checkedIn + stats.dailyStats.day2.checkedIn + stats.dailyStats.day3.checkedIn) / 3).toFixed(1),
  }));

  // Calculate top performing clubs
  const topPerformingClubs = Object.entries(data.byClub)
    .map(([club, stats]) => ({
      club,
      total: stats.total,
      avgAttendance: ((stats.dailyStats.day1.percentage + stats.dailyStats.day2.percentage + stats.dailyStats.day3.percentage) / 3).toFixed(1),
      consistency: Math.abs(
        stats.dailyStats.day1.percentage - stats.dailyStats.day2.percentage
      ) + Math.abs(
        stats.dailyStats.day2.percentage - stats.dailyStats.day3.percentage
      ),
    }))
    .sort((a, b) => parseFloat(b.avgAttendance) - parseFloat(a.avgAttendance))
    .slice(0, 5);

  const getStatsForDay = (stats: TypeStats | ClubStats) => {
    if (!selectedDay) return stats;
    return {
      ...stats,
      checkedIn: stats.dailyStats[selectedDay as keyof typeof stats.dailyStats].checkedIn,
      percentage: stats.dailyStats[selectedDay as keyof typeof stats.dailyStats].percentage,
    };
  };

  // Get unique types from all clubs
  const allTypes = Array.from(
    new Set(
      Object.values(data.byClub).flatMap(club => 
        Object.keys(club.types)
      )
    )
  ).sort();

  // Filter and sort club data
  const filteredAndSortedClubs = Object.entries(data.byClub)
    .filter(([clubName, stats]) => {
      const matchesSearch = clubName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = selectedType === 'all' || Object.keys(stats.types).includes(selectedType);
      return matchesSearch && matchesType;
    })
    .sort(([clubNameA, statsA], [clubNameB, statsB]) => {
      const a = sortConfig.key === 'club' ? clubNameA : 
               sortConfig.key === 'total' ? statsA.total :
               sortConfig.key === 'checkedIn' ? getStatsForDay(statsA).checkedIn :
               getStatsForDay(statsA).percentage;
      
      const b = sortConfig.key === 'club' ? clubNameB :
               sortConfig.key === 'total' ? statsB.total :
               sortConfig.key === 'checkedIn' ? getStatsForDay(statsB).checkedIn :
               getStatsForDay(statsB).percentage;

      return sortConfig.direction === 'asc' 
        ? (a < b ? -1 : 1)
        : (a > b ? -1 : 1);
    });

  const toggleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <>
      {!selectedDay ? (
        // All Days View - Show only the three new sections
        <>
          {/* Attendance Trends Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Attendance Trends</h2>
            </div>
            <div className="bg-secondary rounded-lg p-6">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={attendanceTrendsData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="attendance"
                    stroke="#2563eb"
                    name="Attendees"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="percentage"
                    stroke="#16a34a"
                    name="Percentage"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Type Comparison Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Attendee Type Comparison</h2>
            </div>
            <div className="bg-secondary rounded-lg p-6">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={typeComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="type" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="day1" name="Day 1" fill="#3b82f6" />
                  <Bar dataKey="day2" name="Day 2" fill="#10b981" />
                  <Bar dataKey="day3" name="Day 3" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                {typeComparisonData.map((item) => (
                  <div key={item.type} className="bg-accent/50 rounded-lg p-4">
                    <h3 className="font-medium mb-2">{item.type}</h3>
                    <p className="text-sm text-muted-foreground">
                      Average Daily Attendance: {item.avgAttendance}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Total Registered: {item.total}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top Performing Clubs Section */}
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Award className="h-5 w-5" />
              <h2 className="text-xl font-semibold">Top Performing Clubs</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {topPerformingClubs.map((club, index) => (
                <div key={club.club} className="bg-secondary rounded-lg p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-medium">{club.club}</h3>
                      <p className="text-sm text-muted-foreground">
                        Total Members: {club.total}
                      </p>
                    </div>
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground">
                      {index + 1}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Average Attendance</span>
                        <span>{club.avgAttendance}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary rounded-full h-2"
                          style={{ width: `${club.avgAttendance}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Consistency Score: {(100 - club.consistency).toFixed(1)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        // Individual Day View - Show original sections
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Total Registrants</h2>
              <p className="text-3xl font-bold">{data.totalRegistrants}</p>
            </div>
            <div className="bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Checked In</h2>
              <p className="text-3xl font-bold">
                {data.dailyStats[selectedDay as keyof typeof data.dailyStats].checkedIn} / {data.totalRegistrants}
                <span className="text-sm ml-2 text-muted-foreground">
                  ({data.dailyStats[selectedDay as keyof typeof data.dailyStats].percentage}%)
                </span>
              </p>
            </div>
            <div className="bg-secondary rounded-lg p-6">
              <h2 className="text-lg font-semibold mb-2">Check-in Progress</h2>
              <div className="w-full bg-muted rounded-full h-4 mb-2">
                <div 
                  className="bg-primary rounded-full h-4 transition-all duration-500"
                  style={{ 
                    width: `${data.dailyStats[selectedDay as keyof typeof data.dailyStats].percentage}%` 
                  }}
                />
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Registration by Type</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(data.byType).map(([type, stats]) => {
                const displayStats = getStatsForDay(stats);
                return (
                  <div key={type} className="bg-secondary rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium">{type}</h3>
                      <span className="text-xs text-muted-foreground">
                        {displayStats.percentage}% checked in
                      </span>
                    </div>
                    <p className="text-2xl font-bold mb-2">
                      {displayStats.checkedIn} / {stats.total}
                    </p>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all duration-500"
                        style={{ width: `${displayStats.percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Registration by Club</h2>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clubs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>
                <Select
                  value={selectedType}
                  onValueChange={setSelectedType}
                >
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {allTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-secondary rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-4 font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => toggleSort('club')}
                            className="hover:bg-transparent"
                          >
                            Club
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="text-left p-4 font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => toggleSort('total')}
                            className="hover:bg-transparent"
                          >
                            Total
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="text-left p-4 font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => toggleSort('checkedIn')}
                            className="hover:bg-transparent"
                          >
                            Checked In
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="text-left p-4 font-medium">
                          <Button
                            variant="ghost"
                            onClick={() => toggleSort('percentage')}
                            className="hover:bg-transparent"
                          >
                            Progress
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          </Button>
                        </th>
                        <th className="text-left p-4 font-medium">Types</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAndSortedClubs.map(([club, stats]) => {
                        const displayStats = getStatsForDay(stats);
                        return (
                          <tr key={club} className="border-b border-border">
                            <td className="p-4">{club}</td>
                            <td className="p-4">{stats.total}</td>
                            <td className="p-4">
                              {displayStats.checkedIn}
                              <span className="text-xs text-muted-foreground ml-1">
                                ({displayStats.percentage}%)
                              </span>
                            </td>
                            <td className="p-4">
                              <div className="w-32 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary rounded-full h-2 transition-all duration-500"
                                  style={{ width: `${displayStats.percentage}%` }}
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

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
              {data.recentCheckins.map((checkin, index) => (
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
    </>
  );
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

  if (!data) return null;

  return (
    <div className={geist.className}>
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="all" className="mb-8">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Days</TabsTrigger>
              <TabsTrigger value="day1">Day 1</TabsTrigger>
              <TabsTrigger value="day2">Day 2</TabsTrigger>
              <TabsTrigger value="day3">Day 3</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
              <DashboardContent data={data} />
            </TabsContent>
            <TabsContent value="day1">
              <DashboardContent data={data} selectedDay="day1" />
            </TabsContent>
            <TabsContent value="day2">
              <DashboardContent data={data} selectedDay="day2" />
            </TabsContent>
            <TabsContent value="day3">
              <DashboardContent data={data} selectedDay="day3" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
