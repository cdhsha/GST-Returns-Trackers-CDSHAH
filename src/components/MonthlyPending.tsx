import React, { useState, useMemo } from 'react';
import { getClients, getReturns, autoGenerateReturns } from '@/lib/storage';
import { MONTHS, GSTReturn } from '@/types/gst';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function MonthlyPending({ financialYear }: { financialYear: string }) {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [refresh, setRefresh] = useState(0);
  const clients = getClients();
  const returns = getReturns();

  const pendingData = useMemo(() => {
    const fyReturns = returns.filter(r => r.financialYear === financialYear && r.month === selectedMonth);
    
    return clients.map(client => {
      const clientReturns = fyReturns.filter(r => r.clientId === client.id);
      const gstr1 = clientReturns.find(r => r.type === 'GSTR-1');
      const gstr3b = clientReturns.find(r => r.type === 'GSTR-3B');
      
      const freq = client.returnFrequency || 'Monthly';
      const isQuarterEnd = ['June', 'September', 'December', 'March'].includes(selectedMonth);
      const needs3B = freq === 'Monthly' || (freq === 'Quarterly' && isQuarterEnd);

      return {
        client,
        gstr1: gstr1 || null,
        gstr3b: gstr3b || null,
        needs3B
      };
    }).filter(row => {
      const gstr1Pending = !row.gstr1 || row.gstr1.status !== 'Filed';
      const gstr3bPending = row.needs3B && (!row.gstr3b || row.gstr3b.status !== 'Filed');
      return gstr1Pending || gstr3bPending;
    });
  }, [clients, returns, financialYear, selectedMonth, refresh]);

  const getStatusBadge = (ret: GSTReturn | null) => {
    if (!ret) return <span className="text-muted-foreground text-sm">Not Tracked</span>;

    return (
      <div className="flex items-center gap-2">
        {ret.status === 'Filed' && <Badge className="bg-green-500">Filed</Badge>}
        {ret.status === 'Pending' && <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>}
        {ret.status === 'Overdue' && <Badge variant="destructive">Overdue</Badge>}
      </div>
    );
  };

  const handleAutoGenerate = () => {
    const added = autoGenerateReturns(financialYear, selectedMonth);
    if (added > 0) {
      toast.success(`Successfully auto-generated ${added} pending returns for ${selectedMonth}`);
      setRefresh(prev => prev + 1);
    } else {
      toast.info(`All returns for ${selectedMonth} are already tracked.`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Monthly Pending Report</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Input 
            placeholder="Search client or GSTIN..." 
            className="w-full sm:w-[250px]"
            onChange={(e) => {
              const val = e.target.value.toLowerCase();
              const rows = document.querySelectorAll('.pending-client-row');
              rows.forEach(row => {
                const text = row.textContent?.toLowerCase() || '';
                if (text.includes(val)) {
                  (row as HTMLElement).style.display = '';
                } else {
                  (row as HTMLElement).style.display = 'none';
                }
              });
            }}
          />
          <Button onClick={handleAutoGenerate} variant="outline" className="bg-purple-50 hover:bg-purple-100 text-purple-600 border-purple-200 w-full sm:w-auto">
            <Sparkles className="w-4 h-4 mr-2" /> Auto-Generate Returns
          </Button>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium whitespace-nowrap">Select Month:</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>GSTR-1 Status</TableHead>
              <TableHead>GSTR-3B Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pendingData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-8">No pending returns found for this month.</TableCell>
              </TableRow>
            ) : (
              pendingData.map(row => (
                <TableRow key={row.client.id} className="pending-client-row">
                  <TableCell className="font-medium">{row.client.name}</TableCell>
                  <TableCell>{row.client.gstin}</TableCell>
                  <TableCell>{getStatusBadge(row.gstr1)}</TableCell>
                  <TableCell>
                    {!row.needs3B ? (
                      <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded">Not Required</span>
                    ) : (
                      getStatusBadge(row.gstr3b)
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
