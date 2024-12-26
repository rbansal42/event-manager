import { useState, useEffect, useMemo } from 'react';
import { Geist } from 'next/font/google';
import { Header } from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogClose } from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

const geist = Geist({ subsets: ['latin'] });

interface Registrant {
  _id: string;
  fullName: string;
  email: string;
  phone: string;
  type: string;
  clubName: string;
  checkedIn: boolean;
  checkInTime?: Date;
}

type SortField = 'fullName' | 'clubName' | 'type' | 'checkInTime';
type SortOrder = 'asc' | 'desc';

function FilterTrigger({ label, icon, count = 0 }: { label: string; icon: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 hover:bg-accent rounded-md">
      <span className="font-medium">{label}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className="w-5 h-5 text-muted-foreground"
      >
        <path
          fillRule="evenodd"
          d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z"
          clipRule="evenodd"
        />
      </svg>
      {count > 0 && (
        <span className="flex items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-medium px-2 py-0.5 min-w-[20px]">
          {count}
        </span>
      )}
    </div>
  );
}

export default function CheckIn() {
  const [registrants, setRegistrants] = useState<Registrant[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'success' | 'error' | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ show: boolean; registrantId: string }>({
    show: false,
    registrantId: '',
  });
  
  // Filtering states
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>([]);
  
  // Sorting states
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  useEffect(() => {
    fetchRegistrants();
  }, []);

  const fetchRegistrants = async () => {
    try {
      const response = await fetch('/api/registrants');
      if (response.ok) {
        const data = await response.json();
        setRegistrants(data);
      }
    } catch (error) {
      console.error('Error fetching registrants:', error);
    }
  };

  const handleCheckIn = async (registrantId: string) => {
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrantId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.message);
        return;
      }

      setStatus('success');
      setMessage('Check-in successful!');
      fetchRegistrants();
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred');
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const uniqueClubs = useMemo(() => 
    Array.from(new Set(registrants.map(r => r.clubName))).sort()
  , [registrants]);

  const uniqueTypes = useMemo(() => 
    Array.from(new Set(registrants.map(r => r.type))).sort()
  , [registrants]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️';
    return sortOrder === 'asc' ? '↑' : '↓';
  };

  const filteredAndSortedRegistrants = useMemo(() => {
    let filtered = registrants;

    // Apply search filter
    const searchTermTrimmed = searchTerm.trim().toLowerCase();
    if (searchTermTrimmed) {
      filtered = filtered.filter(registrant => {
        const fullName = registrant.fullName?.toLowerCase() || '';
        const email = registrant.email?.toLowerCase() || '';
        const clubName = registrant.clubName?.toLowerCase() || '';
        const type = registrant.type?.toLowerCase() || '';
        const phone = registrant.phone?.toLowerCase() || '';

        return (
          fullName.includes(searchTermTrimmed) ||
          email.includes(searchTermTrimmed) ||
          clubName.includes(searchTermTrimmed) ||
          type.includes(searchTermTrimmed) ||
          phone.includes(searchTermTrimmed)
        );
      });
    }

    // Apply dropdown filters
    if (selectedClubs.length > 0) {
      filtered = filtered.filter(r => selectedClubs.includes(r.clubName));
    }
    if (selectedTypes.length > 0) {
      filtered = filtered.filter(r => selectedTypes.includes(r.type));
    }
    if (selectedStatus.length > 0) {
      filtered = filtered.filter(r => 
        (selectedStatus.includes('Checked In') && r.checkedIn) ||
        (selectedStatus.includes('Not Checked In') && !r.checkedIn)
      );
    }

    // Apply sorting
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'fullName':
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case 'clubName':
          comparison = a.clubName.localeCompare(b.clubName);
          break;
        case 'type':
          comparison = a.type.localeCompare(b.type);
          break;
        case 'checkInTime':
          if (!a.checkInTime && !b.checkInTime) comparison = 0;
          else if (!a.checkInTime) comparison = 1;
          else if (!b.checkInTime) comparison = -1;
          else comparison = new Date(a.checkInTime).getTime() - new Date(b.checkInTime).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [registrants, searchTerm, selectedClubs, selectedTypes, selectedStatus, sortField, sortOrder]);

  const handleUndoCheckIn = async (registrantId: string) => {
    try {
      const response = await fetch('/api/check-in/undo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ registrantId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.message);
        return;
      }

      setStatus('success');
      setMessage('Check-in removed successfully');
      fetchRegistrants();
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred');
    } finally {
      setConfirmDialog({ show: false, registrantId: '' });
    }
  };

  return (
    <div className={geist.className}>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="relative">
              <Input
                type="text"
                value={searchTerm}
                onChange={handleSearch}
                className="pl-10"
                placeholder="Search by name, email, club, type, or phone..."
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-muted-foreground"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z"
                  clipRule="evenodd"
                />
              </svg>
              {searchTerm && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-1.5 top-1.5 h-6 w-6 text-muted-foreground hover:text-foreground"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </Button>
              )}
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              {filteredAndSortedRegistrants.length} {filteredAndSortedRegistrants.length === 1 ? 'registrant' : 'registrants'} found
            </div>
          </div>

          {message && (
            <div
              className={`mb-4 p-4 rounded-md ${
                status === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
                  : 'bg-destructive/10 text-destructive border border-destructive/20'
              }`}
            >
              {message}
            </div>
          )}

          <div className="rounded-lg border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th 
                      className="h-12 px-4 text-left align-middle font-medium cursor-pointer hover:bg-accent/50 rounded-md"
                      onClick={() => toggleSort('fullName')}
                    >
                      <div className="flex items-center gap-2">
                        <span>Name</span>
                        <span className="text-muted-foreground">{getSortIcon('fullName')}</span>
                      </div>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-full">
                          <FilterTrigger 
                            label="Club" 
                            icon={getSortIcon('clubName')}
                            count={selectedClubs.length}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[300px]">
                          <div className="flex flex-col gap-2 p-2">
                            <div className="flex items-center justify-between">
                              <DropdownMenuLabel className="px-0">Filter by Club</DropdownMenuLabel>
                              {selectedClubs.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedClubs([])}
                                  className="h-8 px-2 text-xs"
                                >
                                  Clear
                                </Button>
                              )}
                            </div>
                            <Input
                              placeholder="Search clubs..."
                              className="h-8 text-xs"
                              value={searchTerm}
                              onChange={handleSearch}
                            />
                          </div>
                          <DropdownMenuSeparator />
                          <div className="max-h-[200px] overflow-y-auto">
                            {uniqueClubs.map(club => (
                              <DropdownMenuCheckboxItem
                                key={club}
                                checked={selectedClubs.includes(club)}
                                onCheckedChange={(checked) => {
                                  setSelectedClubs(prev => 
                                    checked ? [...prev, club] : prev.filter(c => c !== club)
                                  );
                                }}
                                className="cursor-pointer"
                              >
                                {club}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-full">
                          <FilterTrigger 
                            label="Type" 
                            icon={getSortIcon('type')}
                            count={selectedTypes.length}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[300px]">
                          <div className="flex items-center justify-between p-2">
                            <DropdownMenuLabel className="px-0">Filter by Type</DropdownMenuLabel>
                            {selectedTypes.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedTypes([])}
                                className="h-8 px-2 text-xs"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <div className="max-h-[200px] overflow-y-auto">
                            {uniqueTypes.map(type => (
                              <DropdownMenuCheckboxItem
                                key={type}
                                checked={selectedTypes.includes(type)}
                                onCheckedChange={(checked) => {
                                  setSelectedTypes(prev => 
                                    checked ? [...prev, type] : prev.filter(t => t !== type)
                                  );
                                }}
                                className="cursor-pointer"
                              >
                                {type}
                              </DropdownMenuCheckboxItem>
                            ))}
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">
                      <DropdownMenu>
                        <DropdownMenuTrigger className="w-full">
                          <FilterTrigger 
                            label="Status" 
                            icon={getSortIcon('checkInTime')}
                            count={selectedStatus.length}
                          />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start" className="w-[300px]">
                          <div className="flex items-center justify-between p-2">
                            <DropdownMenuLabel className="px-0">Filter by Status</DropdownMenuLabel>
                            {selectedStatus.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedStatus([])}
                                className="h-8 px-2 text-xs"
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                          <DropdownMenuSeparator />
                          <div className="p-1">
                            <DropdownMenuCheckboxItem
                              checked={selectedStatus.includes('Checked In')}
                              onCheckedChange={(checked) => {
                                setSelectedStatus(prev => 
                                  checked 
                                    ? [...prev, 'Checked In']
                                    : prev.filter(s => s !== 'Checked In')
                                );
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span>Checked In</span>
                                <span className="flex h-2 w-2 rounded-full bg-emerald-500" />
                              </div>
                            </DropdownMenuCheckboxItem>
                            <DropdownMenuCheckboxItem
                              checked={selectedStatus.includes('Not Checked In')}
                              onCheckedChange={(checked) => {
                                setSelectedStatus(prev => 
                                  checked 
                                    ? [...prev, 'Not Checked In']
                                    : prev.filter(s => s !== 'Not Checked In')
                                );
                              }}
                              className="cursor-pointer"
                            >
                              <div className="flex items-center gap-2">
                                <span>Not Checked In</span>
                                <span className="flex h-2 w-2 rounded-full bg-muted-foreground" />
                              </div>
                            </DropdownMenuCheckboxItem>
                          </div>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </th>
                    <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRegistrants.map((registrant) => (
                    <tr key={registrant._id} className="border-b transition-colors hover:bg-muted/50">
                      <td className="p-4 align-middle">{registrant.fullName}</td>
                      <td className="p-4 align-middle text-muted-foreground">{registrant.email}</td>
                      <td className="p-4 align-middle text-muted-foreground">{registrant.clubName}</td>
                      <td className="p-4 align-middle text-muted-foreground">{registrant.type}</td>
                      <td className="p-4 align-middle">
                        {registrant.checkedIn ? (
                          <span className="text-emerald-500 font-medium">
                            Checked In {registrant.checkInTime && new Date(registrant.checkInTime).toLocaleTimeString()}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Not Checked In</span>
                        )}
                      </td>
                      <td className="p-4 align-middle">
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleCheckIn(registrant._id)}
                            disabled={registrant.checkedIn}
                            variant={registrant.checkedIn ? "secondary" : "default"}
                            size="sm"
                          >
                            {registrant.checkedIn ? 'Checked In' : 'Check In'}
                          </Button>
                          {registrant.checkedIn && (
                            <Button
                              onClick={() => setConfirmDialog({ show: true, registrantId: registrant._id })}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              Undo
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <Dialog 
        open={confirmDialog.show} 
        onOpenChange={(open: boolean) => !open && setConfirmDialog({ show: false, registrantId: '' })}
      >
        <DialogContent>
          <div className="grid gap-4">
            <h2 className="text-lg font-semibold">Confirm Undo Check-in</h2>
            <p className="text-muted-foreground">
              Are you sure you want to remove this check-in? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button
                variant="destructive"
                onClick={() => handleUndoCheckIn(confirmDialog.registrantId)}
              >
                Remove Check-in
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 