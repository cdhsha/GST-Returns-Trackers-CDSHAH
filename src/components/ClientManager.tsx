import React, { useState } from 'react';
import { getClients, addClient, updateClient, deleteClient } from '@/lib/storage';
import { Client } from '@/types/gst';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import BulkImportClients from './BulkImportClients';

export default function ClientManager({ onRefresh }: { onRefresh: () => void }) {
  const [clients, setClients] = useState<Client[]>(getClients());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<{ name: string; gstin: string; email: string; phone: string; returnFrequency: 'Monthly' | 'Quarterly' }>({ name: '', gstin: '', email: '', phone: '', returnFrequency: 'Monthly' });

  const refreshClients = () => {
    setClients(getClients());
    onRefresh();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      updateClient(editingClient.id, formData);
      toast.success('Client updated');
    } else {
      addClient(formData);
      toast.success('Client added');
    }
    setIsDialogOpen(false);
    refreshClients();
  };

  const openEdit = (client: Client) => {
    setEditingClient(client);
    setFormData({ name: client.name, gstin: client.gstin, email: client.email, phone: client.phone, returnFrequency: client.returnFrequency || 'Monthly' });
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingClient(null);
    setFormData({ name: '', gstin: '', email: '', phone: '', returnFrequency: 'Monthly' });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      toast.success('Client deleted');
      setClientToDelete(null);
      refreshClients();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">Client Manager</h2>
        <div className="flex items-center gap-2">
          <BulkImportClients onImportComplete={refreshClients} />
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger render={<Button onClick={openAdd} />}>
              <Plus className="w-4 h-4 mr-2" /> Add Client
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Name</label>
                <Input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">GSTIN</label>
                <Input value={formData.gstin} onChange={e => setFormData({ ...formData, gstin: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email</label>
                <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone</label>
                <Input value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Return Frequency</label>
                <Select value={formData.returnFrequency} onValueChange={(v: 'Monthly' | 'Quarterly') => setFormData({ ...formData, returnFrequency: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{editingClient ? 'Update' : 'Save'}</Button>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>GSTIN</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No clients found. Add one to get started.</TableCell>
              </TableRow>
            ) : (
              clients.map(client => (
                <TableRow key={client.id}>
                  <TableCell className="font-medium">{client.name}</TableCell>
                  <TableCell>{client.gstin}</TableCell>
                  <TableCell>{client.email}</TableCell>
                  <TableCell>{client.phone}</TableCell>
                  <TableCell>
                    <Badge variant={client.returnFrequency === 'Quarterly' ? 'secondary' : 'default'} className="font-normal">
                      {client.returnFrequency || 'Monthly'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(client)}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setClientToDelete(client.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!clientToDelete} onOpenChange={(open) => !open && setClientToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this client and all their associated GST returns. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
