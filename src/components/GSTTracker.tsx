import React, { useState, useMemo, useEffect } from 'react';
import { getClients, getReturns, updateReturn, deleteReturn, getSession, autoGenerateReturns } from '@/lib/storage';
import { GSTReturn, ReturnStatus, MONTHS } from '@/types/gst';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, CheckCircle, Clock, AlertCircle, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

export default function GSTTracker({ financialYear }: { financialYear: string }) {
  const [selectedMonth, setSelectedMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [returns, setReturns] = useState<GSTReturn[]>([]);
  const [refresh, setRefresh] = useState(0);
  
  const clients = getClients();
  const currentUser = getSession();
  
  const [editingReturn, setEditingReturn] = useState<GSTReturn | null>(null);
  const [formData, setFormData] = useState<Partial<GSTReturn>>({});

  // Auto-generate and fetch returns when month or FY changes
  useEffect(() => {
    if (clients.length > 0) {
      autoGenerateReturns(financialYear, selectedMonth);
    }
    setReturns(getReturns());
  }, [financialYear, selectedMonth, refresh, clients.length]);

  const fyReturns = useMemo(() => {
    return returns.filter(r => r.financialYear === financialYear);
  }, [returns, financialYear]);

  const monthReturns = useMemo(() => {
    return fyReturns.filter(r => r.month === selectedMonth);
  }, [fyReturns, selectedMonth]);

  const stats = useMemo(() => {
    return {
      total: fyReturns.length,
      filed: fyReturns.filter(r => r.status === 'Filed').length,
      pending: fyReturns.filter(r => r.status === 'Pending').length,
      overdue: fyReturns.filter(r => r.status === 'Overdue').length,
    };
  }, [fyReturns]);

  const handleToggleFiled = (ret: GSTReturn, checked: boolean) => {
    if (currentUser?.role !== 'admin' && ret.status === 'Filed' && !checked) {
      toast.error('Only administrators can unmark a filed return.');
      return;
    }

    const newStatus: ReturnStatus = checked ? 'Filed' : 'Pending';
    const filedDate = checked ? new Date().toISOString().slice(0, 10) : '';
    
    updateReturn(ret.id, { status: newStatus, filedDate });
    toast.success(`${ret.type} marked as ${newStatus}`);
    setRefresh(r => r + 1);
  };

  const openEdit = (ret: GSTReturn) => {
    setEditingReturn(ret);
    setFormData(ret);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReturn) {
      updateReturn(editingReturn.id, formData);
      toast.success('Return details updated');
      setEditingReturn(null);
      setRefresh(r => r + 1);
    }
  };

  const isQuarterEnd = ['June', 'September', 'December', 'March'].includes(selectedMonth);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-blue-50/50 border-blue-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Returns (FY)</CardTitle>
            <FileText className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-green-50/50 border-green-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Filed (FY)</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{stats.filed}</div>
          </CardContent>
        </Card>
        <Card className="bg-amber-50/50 border-amber-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-800">Pending (FY)</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-900">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-red-50/50 border-red-100">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Overdue (FY)</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{stats.overdue}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Smart GST Tracking</h2>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full sm:w-auto">
          <Input 
            placeholder="Search client or GSTIN..." 
            className="w-full sm:w-[250px]"
            onChange={(e) => {
              // We'll filter the clients inline below
              const val = e.target.value.toLowerCase();
              const rows = document.querySelectorAll('.client-row');
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
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-sm font-medium text-muted-foreground whitespace-nowrap">Select Month:</label>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Select Month" /></SelectTrigger>
              <SelectContent>
                {MONTHS.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="border rounded-md bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Client Name</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead className="text-center">GSTR-1</TableHead>
              <TableHead className="text-center">GSTR-3B</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  Add clients in Client Master first to start tracking returns.
                </TableCell>
              </TableRow>
            ) : (
              clients.map(client => {
                const clientReturns = monthReturns.filter(r => r.clientId === client.id);
                const gstr1 = clientReturns.find(r => r.type === 'GSTR-1');
                const gstr3b = clientReturns.find(r => r.type === 'GSTR-3B');
                
                const freq = client.returnFrequency || 'Monthly';
                const needs3B = freq === 'Monthly' || (freq === 'Quarterly' && isQuarterEnd);

                return (
                  <TableRow key={client.id} className="client-row">
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{client.gstin}</TableCell>
                    <TableCell>
                      <Badge variant={freq === 'Quarterly' ? 'secondary' : 'default'} className="font-normal">
                        {freq}
                      </Badge>
                    </TableCell>
                    
                    {/* GSTR-1 Cell */}
                    <TableCell className="text-center">
                      {gstr1 ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center justify-center gap-3">
                            <Checkbox 
                              checked={gstr1.status === 'Filed'} 
                              onCheckedChange={(checked) => handleToggleFiled(gstr1, checked as boolean)}
                              disabled={currentUser?.role !== 'admin' && gstr1.status === 'Filed'}
                              className="h-5 w-5"
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(gstr1)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {gstr1.status === 'Filed' && gstr1.filedDate && (
                            <span className="text-[10px] text-muted-foreground font-medium text-green-600">{gstr1.filedDate}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">N/A</span>
                      )}
                    </TableCell>

                    {/* GSTR-3B Cell */}
                    <TableCell className="text-center">
                      {needs3B && gstr3b ? (
                        <div className="flex flex-col items-center justify-center gap-1">
                          <div className="flex items-center justify-center gap-3">
                            <Checkbox 
                              checked={gstr3b.status === 'Filed'} 
                              onCheckedChange={(checked) => handleToggleFiled(gstr3b, checked as boolean)}
                              disabled={currentUser?.role !== 'admin' && gstr3b.status === 'Filed'}
                              className="h-5 w-5"
                            />
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(gstr3b)}>
                              <Edit2 className="h-3 w-3" />
                            </Button>
                          </div>
                          {gstr3b.status === 'Filed' && gstr3b.filedDate && (
                            <span className="text-[10px] text-muted-foreground font-medium text-green-600">{gstr3b.filedDate}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs bg-muted px-2 py-1 rounded">Not Required</span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editingReturn} onOpenChange={(open) => !open && setEditingReturn(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Return Details ({editingReturn?.type})</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select 
                value={formData.status} 
                onValueChange={v => setFormData({ ...formData, status: v as ReturnStatus })}
                disabled={currentUser?.role !== 'admin' && editingReturn?.status === 'Filed'}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Filed">Filed</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Due Date</label>
              <Input type="date" value={formData.dueDate || ''} onChange={e => setFormData({ ...formData, dueDate: e.target.value })} required />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Filed Date</label>
              <Input type="date" value={formData.filedDate || ''} onChange={e => setFormData({ ...formData, filedDate: e.target.value })} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">ARN (Acknowledgement Number)</label>
              <Input value={formData.arn || ''} onChange={e => setFormData({ ...formData, arn: e.target.value })} placeholder="Enter ARN if filed" />
            </div>
            <Button type="submit" className="w-full">Update Details</Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
