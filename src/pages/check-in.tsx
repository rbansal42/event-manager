import { useState, useEffect, useMemo } from 'react';
import { Geist } from 'next/font/google';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const geist = Geist({ subsets: ['latin'] });

type Registrant = {
  _id: string;
  fullName: string;
  phone: string;
  type: string;
  clubName: string;
  checkedIn: boolean;
  checkInTime?: Date;
  dailyCheckIns: {
    day1: { checkedIn: boolean; checkInTime?: Date };
    day2: { checkedIn: boolean; checkInTime?: Date };
    day3: { checkedIn: boolean; checkInTime?: Date };
  };
};

export default function CheckIn() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    registrantId: string;
    day: string;
    action: 'check-in' | 'remove';
  }>({
    isOpen: false,
    registrantId: '',
    day: '',
    action: 'check-in'
  });

  useEffect(() => {
    fetchRegistrants();
    const interval = setInterval(fetchRegistrants, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchRegistrants = async () => {
    try {
      const response = await fetch('/api/registrants');
      const data = await response.json();
      setRegistrants(data);
    } catch (error) {
      console.error('Failed to fetch registrants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async (registrantId: string, day: string, action: 'check-in' | 'remove') => {
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ registrantId, day, action }),
      });

      if (!response.ok) {
        throw new Error('Failed to check in registrant');
      }

      await fetchRegistrants(); // Refresh the list
    } catch (error) {
      console.error('Check-in error:', error);
    }
  };

  const filteredRegistrants = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    return registrants.filter(registrant => {
      if (!searchTermLower) return true;
      return (
        registrant.fullName.toLowerCase().includes(searchTermLower) ||
        registrant.clubName.toLowerCase().includes(searchTermLower) ||
        registrant.type.toLowerCase().includes(searchTermLower)
      );
    });
  }, [registrants, searchTerm]);

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
          <div className="mb-8">
            <h1 className="text-2xl font-bold mb-4">Check-in</h1>
            <Input
              type="search"
              placeholder="Search by name, club..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Tabs defaultValue="day1">
            <TabsList>
              <TabsTrigger value="day1">Day 1</TabsTrigger>
              <TabsTrigger value="day2">Day 2</TabsTrigger>
              <TabsTrigger value="day3">Day 3</TabsTrigger>
            </TabsList>

            {['day1', 'day2', 'day3'].map((day) => (
              <TabsContent key={day} value={day}>
                <div className="bg-secondary rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left p-4 font-medium">Name</th>
                          <th className="text-left p-4 font-medium">Club</th>
                          <th className="text-left p-4 font-medium">Type</th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredRegistrants.map((registrant) => (
                          <tr key={registrant._id} className="border-b border-border">
                            <td className="p-4">{registrant.fullName}</td>
                            <td className="p-4">{registrant.clubName}</td>
                            <td className="p-4">{registrant.type}</td>
                            <td className="p-4">
                              {registrant.dailyCheckIns[day as keyof typeof registrant.dailyCheckIns].checkedIn ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                  Checked In
                                  {registrant.dailyCheckIns[day as keyof typeof registrant.dailyCheckIns].checkInTime && (
                                    <span className="ml-1 text-green-600">
                                      ({new Date(registrant.dailyCheckIns[day as keyof typeof registrant.dailyCheckIns].checkInTime!).toLocaleTimeString()})
                                    </span>
                                  )}
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Not Checked In
                                </span>
                              )}
                            </td>
                            <td className="p-4">
                              {registrant.dailyCheckIns[day as keyof typeof registrant.dailyCheckIns].checkedIn ? (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setConfirmDialog({
                                    isOpen: true,
                                    registrantId: registrant._id,
                                    day,
                                    action: 'remove'
                                  })}
                                >
                                  Remove Check-in
                                </Button>
                              ) : (
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => setConfirmDialog({
                                    isOpen: true,
                                    registrantId: registrant._id,
                                    day,
                                    action: 'check-in'
                                  })}
                                >
                                  Check In
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>

          <Dialog
            open={confirmDialog.isOpen}
            onOpenChange={(isOpen) => setConfirmDialog(prev => ({ ...prev, isOpen }))}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {confirmDialog.action === 'check-in' ? 'Confirm Check-in' : 'Remove Check-in'}
                </DialogTitle>
                <DialogDescription>
                  {confirmDialog.action === 'check-in'
                    ? 'Are you sure you want to check in this registrant?'
                    : 'Are you sure you want to remove the check-in for this registrant?'}
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-4">
                <Button
                  variant="outline"
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                >
                  Cancel
                </Button>
                <Button
                  variant={confirmDialog.action === 'check-in' ? 'default' : 'destructive'}
                  onClick={() => {
                    handleCheckIn(confirmDialog.registrantId, confirmDialog.day, confirmDialog.action);
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }}
                >
                  {confirmDialog.action === 'check-in' ? 'Check In' : 'Remove'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
} 