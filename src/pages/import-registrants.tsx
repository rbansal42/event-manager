import { useState } from 'react';
import { Geist } from 'next/font/google';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

const geist = Geist({ subsets: ['latin'] });

interface ImportResults {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  logs: string[];
}

export default function ImportRegistrants() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResults | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setFile(null);
      setError('Please select a valid CSV file');
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file first');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const csvData = await file.text();
      
      const response = await fetch('/api/import-registrants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ csvData }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to import registrants');
      }

      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during import');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={geist.className}>
      <Header />
      <main className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <CardHeader>
              <CardTitle>Import Registrants</CardTitle>
              <CardDescription>
                Upload a CSV file containing registrant information. Required fields: Full Name, 
                Phone, Type (Rotarian/Rotaractor/Interactor/Guardian), and Club Name. 
                Optional fields: Club Designation.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-muted-foreground
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-medium
                      file:bg-primary file:text-primary-foreground
                      hover:file:bg-primary/90"
                  />
                  <Button
                    onClick={handleImport}
                    disabled={!file || loading}
                  >
                    {loading ? 'Importing...' : 'Import'}
                  </Button>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {results && (
                  <Alert variant={results.errors.length > 0 ? 'warning' : 'default'}>
                    <AlertTitle>Import Results</AlertTitle>
                    <AlertDescription>
                      <div className="space-y-2">
                        <p>Successfully imported: {results.imported} registrants</p>
                        <p>Skipped (duplicates): {results.skipped} registrants</p>
                        <div className="mt-4">
                          <p className="font-medium mb-2">Import Log:</p>
                          <div className="bg-muted p-3 rounded-md max-h-60 overflow-y-auto">
                            <ul className="space-y-1 text-sm">
                              {results.logs.map((log, index) => (
                                <li key={index} className={`${
                                  log.includes('Successfully') ? 'text-green-600' :
                                  log.includes('Skipped') ? 'text-yellow-600' :
                                  'text-red-600'
                                }`}>
                                  {log}
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                        {results.errors.length > 0 && (
                          <>
                            <p className="font-medium">Errors:</p>
                            <ul className="list-disc pl-4 space-y-1">
                              {results.errors.map((error, index) => (
                                <li key={index} className="text-sm">{error}</li>
                              ))}
                            </ul>
                          </>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 