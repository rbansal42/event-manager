import { useState, useEffect, useMemo } from 'react';
import { Geist } from 'next/font/google';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronsUpDown, ChevronUp, ChevronDown } from 'lucide-react';

const geist = Geist({ subsets: ['latin'] });

type SortField = 'fullName' | 'clubName' | 'type';
type SortDirection = 'asc' | 'desc';

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
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ field: SortField; direction: SortDirection }>({
    field: 'fullName',
    direction: 'asc'
  });
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

  const handleSort = (field: SortField) => {
    setSortConfig(current => ({
      field,
      direction: current.field === field && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const getSortIcon = (field: SortField) => {
    if (sortConfig.field !== field) return <ChevronsUpDown className="h-4 w-4" />;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="h-4 w-4" /> : 
      <ChevronDown className="h-4 w-4" />;
  };

  const filteredAndSortedRegistrants = useMemo(() => {
    const searchTermLower = searchTerm.toLowerCase().trim();
    
    return registrants
      .filter(registrant => {
        const matchesSearch = !searchTermLower || 
          registrant.fullName.toLowerCase().includes(searchTermLower) ||
          registrant.clubName.toLowerCase().includes(searchTermLower) ||
          registrant.type.toLowerCase().includes(searchTermLower);
        
        const matchesType = selectedType === 'all' || registrant.type === selectedType;
        
        return matchesSearch && matchesType;
      })
      .sort((a, b) => {
        const direction = sortConfig.direction === 'asc' ? 1 : -1;
        const field = sortConfig.field;
        
        if (a[field] < b[field]) return -1 * direction;
        if (a[field] > b[field]) return 1 * direction;
        return 0;
      });
  }, [registrants, searchTerm, selectedType, sortConfig]);

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
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <Input
              type="search"
              placeholder="Search by name, club..."
              className="max-w-md"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="Rotarian">Rotarian</SelectItem>
                <SelectItem value="Rotaractor">Rotaractor</SelectItem>
                <SelectItem value="Interactor">Interactor</SelectItem>
                <SelectItem value="Guardian">Guardian</SelectItem>
              </SelectContent>
            </Select>
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
                          <th className="text-left p-4 font-medium">
                            <button
                              className="flex items-center gap-1 hover:opacity-80"
                              onClick={() => handleSort('fullName')}
                            >
                              Name {getSortIcon('fullName')}
                            </button>
                          </th>
                          <th className="text-left p-4 font-medium">
                            <button
                              className="flex items-center gap-1 hover:opacity-80"
                              onClick={() => handleSort('clubName')}
                            >
                              Club {getSortIcon('clubName')}
                            </button>
                          </th>
                          <th className="text-left p-4 font-medium">
                            <button
                              className="flex items-center gap-1 hover:opacity-80"
                              onClick={() => handleSort('type')}
                            >
                              Type {getSortIcon('type')}
                            </button>
                          </th>
                          <th className="text-left p-4 font-medium">Status</th>
                          <th className="text-left p-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredAndSortedRegistrants.map((registrant) => (
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
                                  onClick={() => handleCheckIn(registrant._id, day, 'check-in')}
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
                <DialogTitle>Remove Check-in</DialogTitle>
                <DialogDescription>
                  Are you sure you want to remove the check-in for this registrant?
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
                  variant="destructive"
                  onClick={() => {
                    handleCheckIn(confirmDialog.registrantId, confirmDialog.day, 'remove');
                    setConfirmDialog(prev => ({ ...prev, isOpen: false }));
                  }}
                >
                  Remove
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
} 