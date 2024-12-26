import { useState } from 'react';
import { useRouter } from 'next/router';
import { Geist } from 'next/font/google';
import Papa from 'papaparse';
import { Header } from '@/components/Header';

const geist = Geist({ subsets: ['latin'] });

export default function ImportRegistrants() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const text = await file.text();
      const result = Papa.parse(text, { header: true });
      
      const response = await fetch('/api/import-registrants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: result.data }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setMessage(`Successfully imported ${data.count} registrants`);
      } else {
        setMessage(`Error: ${data.error}`);
      }
    } catch (error) {
      setMessage('Error processing file');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={geist.className}>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-secondary rounded-lg p-6 shadow-sm">
            <h2 className="text-2xl font-semibold mb-6">
              Import Registrants
            </h2>

            <div className="mb-8">
              <h3 className="text-lg font-medium mb-4">CSV Format Requirements</h3>
              <p className="text-muted-foreground mb-2">Your CSV file should have the following columns:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 mb-4">
                <li>Full Name (required)</li>
                <li>Email (optional)</li>
                <li>Phone (required)</li>
                <li>Type (required)</li>
                <li>Club Name (required)</li>
                <li>Club Designation (required)</li>
              </ul>
              <div className="bg-accent p-3 rounded text-xs font-mono mb-4 text-accent-foreground">
                Example:<br />
                Full Name,Email,Phone,Type,Club Name,Club Designation<br />
                John Doe,,1234567890,Rotarian,RC Downtown,President
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="file-upload" className="block text-sm font-medium mb-2">
                  Choose CSV file
                </label>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="w-full px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={loading || !file}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring disabled:bg-primary/50 disabled:cursor-not-allowed"
              >
                {loading ? 'Importing...' : 'Import'}
              </button>

              {message && (
                <div className={`mt-4 p-4 rounded-md text-sm ${
                  message.includes('Error')
                    ? 'bg-error-muted text-error border border-error'
                    : 'bg-success-muted text-success border border-success'
                }`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
} 