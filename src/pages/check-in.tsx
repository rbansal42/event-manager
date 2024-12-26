import { useState } from 'react';
import { Geist } from 'next/font/google';

const geist = Geist({ subsets: ['latin'] });

export default function CheckIn() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState<'success' | 'error' | null>(null);

  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus('error');
        setMessage(data.message);
        return;
      }

      setStatus('success');
      setMessage('Check-in successful!');
      setEmail('');
    } catch (error) {
      setStatus('error');
      setMessage('An error occurred');
    }
  };

  return (
    <div className={`${geist.className} min-h-screen bg-background p-8`}>
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-8">Event Check-in</h1>
        
        <form onSubmit={handleCheckIn} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-2 border rounded-md"
              placeholder="Enter registrant's email"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-foreground text-background p-2 rounded-md hover:opacity-90"
          >
            Check In
          </button>
        </form>

        {message && (
          <div
            className={`mt-4 p-4 rounded-md ${
              status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 