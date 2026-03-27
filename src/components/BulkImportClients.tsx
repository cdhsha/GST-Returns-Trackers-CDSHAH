import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, FileText, Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { addClient } from '@/lib/storage';
import { Client } from '@/types/gst';
import { GoogleGenAI, Type } from '@google/genai';

interface BulkImportClientsProps {
  onImportComplete: () => void;
}

export default function BulkImportClients({ onImportComplete }: BulkImportClientsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const downloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,Name,GSTIN,Email,Phone,ReturnFrequency\nAcme Corp,22AAAAA0000A1Z5,contact@acme.com,9876543210,Monthly\nGlobex Inc,27BBBBB1111B2Z6,info@globex.com,9123456780,Quarterly";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "sample_clients.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        let addedCount = 0;
        results.data.forEach((row: any) => {
          if (row.Name && row.GSTIN) {
            addClient({
              name: row.Name,
              gstin: row.GSTIN,
              email: row.Email || '',
              phone: row.Phone || '',
              returnFrequency: row.ReturnFrequency === 'Quarterly' ? 'Quarterly' : 'Monthly'
            });
            addedCount++;
          }
        });
        
        setIsProcessing(false);
        setIsOpen(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
        
        if (addedCount > 0) {
          toast.success(`Successfully imported ${addedCount} clients`);
          onImportComplete();
        } else {
          toast.error('No valid clients found in the file. Please check the format.');
        }
      },
      error: (error) => {
        setIsProcessing(false);
        toast.error(`Error parsing file: ${error.message}`);
      }
    });
  };

  const handleSmartImport = async () => {
    if (!aiInput.trim()) {
      toast.error('Please enter some text to extract clients from');
      return;
    }

    setIsProcessing(true);
    try {
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || '' });
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Extract client information from the following text. Return a JSON array of objects, where each object has 'name', 'gstin', 'email', 'phone', and 'returnFrequency' properties. If a property is not found, leave it as an empty string. 'returnFrequency' should be either 'Monthly' or 'Quarterly' (default to 'Monthly' if not specified). Text: ${aiInput}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING, description: "Client or company name" },
                gstin: { type: Type.STRING, description: "GSTIN number (15 characters)" },
                email: { type: Type.STRING, description: "Email address" },
                phone: { type: Type.STRING, description: "Phone number" },
                returnFrequency: { type: Type.STRING, description: "Return frequency: 'Monthly' or 'Quarterly'" }
              },
              required: ["name", "gstin"]
            }
          }
        }
      });

      const extractedClients = JSON.parse(response.text || '[]');
      
      if (extractedClients.length === 0) {
        toast.error('No clients could be extracted from the text');
        setIsProcessing(false);
        return;
      }

      let addedCount = 0;
      extractedClients.forEach((client: any) => {
        if (client.name && client.gstin) {
          addClient({
            name: client.name,
            gstin: client.gstin,
            email: client.email || '',
            phone: client.phone || '',
            returnFrequency: client.returnFrequency === 'Quarterly' ? 'Quarterly' : 'Monthly'
          });
          addedCount++;
        }
      });

      setIsProcessing(false);
      setIsOpen(false);
      setAiInput('');
      
      if (addedCount > 0) {
        toast.success(`Smart AI successfully imported ${addedCount} clients`);
        onImportComplete();
      } else {
        toast.error('Extracted clients were missing required fields (Name or GSTIN)');
      }
    } catch (error) {
      console.error('Smart import error:', error);
      setIsProcessing(false);
      toast.error('Failed to process text with AI. Please check your API key or try again.');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={<Button variant="outline" className="mr-2" />}>
        <Upload className="w-4 h-4 mr-2" /> Bulk Import
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Import Clients</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* CSV Upload Section */}
          <div className="space-y-4 border-b pb-6">
            <h3 className="text-sm font-medium flex items-center">
              <FileText className="w-4 h-4 mr-2 text-blue-500" />
              Upload CSV File
            </h3>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Upload a CSV file with columns: Name, GSTIN, Email, Phone, ReturnFrequency.
              </p>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={downloadSample} size="sm">
                  Download Sample Format
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept=".csv"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    disabled={isProcessing}
                    ref={fileInputRef}
                  />
                  <Button disabled={isProcessing} size="sm">
                    {isProcessing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    Select & Upload CSV
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Smart AI Import Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium flex items-center">
              <Sparkles className="w-4 h-4 mr-2 text-purple-500" />
              Smart AI Import
            </h3>
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                Paste raw text, emails, or messages containing client details. Our AI will automatically extract and import them.
              </p>
              <textarea
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="E.g. Please add Acme Corp (GSTIN: 22AAAAA0000A1Z5, email: contact@acme.com) and Globex Inc (GSTIN: 27BBBBB1111B2Z6)..."
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                disabled={isProcessing}
              />
              <Button 
                onClick={handleSmartImport} 
                disabled={isProcessing || !aiInput.trim()}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              >
                {isProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Processing with AI...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Extract & Import</>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
