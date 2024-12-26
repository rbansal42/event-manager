import { useState } from 'react';
import { useRouter } from 'next/router';
import Papa from 'papaparse';

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
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900">
            Import Registrants
          </h2>
        </div>

        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">CSV Format Requirements</h3>
          <p className="text-sm text-gray-600 mb-2">Your CSV file should have the following columns:</p>
          <ul className="list-disc list-inside text-sm text-gray-600 mb-4">
            <li>Full Name</li>
            <li>Email</li>
            <li>Phone</li>
            <li>Type</li>
            <li>Club Name</li>
            <li>Club Designation</li>
          </ul>
          <div className="bg-gray-500 p-3 rounded text-xs font-mono mb-4">
            Example:<br />
            Full Name,Email,Phone,Type,Club Name,Club Designation<br />
            John Doe,john@example.com,1234567890,Rotarian,RC Downtown,President
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="file-upload" className="sr-only">
                Choose CSV file
              </label>
              <input
                id="file-upload"
                name="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading || !file}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
            >
              {loading ? 'Importing...' : 'Import'}
            </button>
          </div>

          {message && (
            <div className={`mt-4 text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  );
} 