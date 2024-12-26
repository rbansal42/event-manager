import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState } from "react";
import { Download } from "lucide-react";

export default function ExportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleExport = async () => {
    try {
      setIsLoading(true);
      setError("");
      
      const response = await fetch('/api/export');
      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'event-data.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Failed to export data. Please try again.");
      console.error('Export error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Export Event Data</CardTitle>
          <CardDescription>
            Download event data in Excel format with multiple sheets containing registrant information,
            check-in details, and club-wise attendance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">The Excel file will contain:</h3>
              <ul className="list-disc pl-6 text-sm text-muted-foreground">
                <li>Complete registrant data with check-in status for all days</li>
                <li>Separate sheets for each day&apos;s check-in details</li>
                <li>Club-wise attendance summary</li>
              </ul>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleExport}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {isLoading ? (
                "Exporting..."
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Excel File
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 