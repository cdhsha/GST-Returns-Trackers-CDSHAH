import React, { useState } from 'react';
import { getUsers, addUser, updateUser, deleteUser, getSession } from '@/lib/storage';
import { User } from '@/types/gst';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function UserManager() {
  const [users, setUsers] = useState<User[]>(getUsers());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<{ username: string; passwordHash: string; role: 'admin' | 'user'; displayName: string }>({ username: '', passwordHash: '', role: 'user', displayName: '' });
  
  const currentSession = getSession();

  const refreshUsers = () => setUsers(getUsers());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateUser(editingUser.id, formData);
      toast.success('User updated');
    } else {
      if (users.some(u => u.username === formData.username)) {
        toast.error('Username already exists');
        return;
      }
      addUser(formData as Omit<User, 'id'>);
      toast.success('User added');
    }
    setIsDialogOpen(false);
    refreshUsers();
  };

  const openEdit = (user: User) => {
    setEditingUser(user);
    setFormData({ username: user.username, passwordHash: user.passwordHash, role: user.role, displayName: user.displayName });
    setIsDialogOpen(true);
  };

  const openAdd = () => {
    setEditingUser(null);
    setFormData({ username: '', passwordHash: '', role: 'user', displayName: '' });
    setIsDialogOpen(true);
  };

  const handleDelete = () => {
    if (userToDelete) {
      if (userToDelete === currentSession?.id) {
        toast.error('You cannot delete your own account');
        setUserToDelete(null);
        return;
      }
      deleteUser(userToDelete);
      toast.success('User deleted');
      setUserToDelete(null);
      refreshUsers();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold tracking-tight">User Manager</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger render={<Button onClick={openAdd} />}>
            <Plus className="w-4 h-4 mr-2" /> Add User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Display Name</label>
                <Input value={formData.displayName} onChange={e => setFormData({ ...formData, displayName: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Username</label>
                <Input value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })} required disabled={!!editingUser} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Password</label>
                <Input type="password" value={formData.passwordHash} onChange={e => setFormData({ ...formData, passwordHash: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Role</label>
                <Select value={formData.role} onValueChange={v => setFormData({ ...formData, role: v as 'admin' | 'user' })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full">{editingUser ? 'Update' : 'Save'}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Display Name</TableHead>
              <TableHead>Username</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map(user => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.displayName}</TableCell>
                <TableCell>{user.username}</TableCell>
                <TableCell className="capitalize">{user.role}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEdit(user)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive" 
                    onClick={() => setUserToDelete(user.id)}
                    disabled={user.id === currentSession?.id}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this user account. This action cannot be undone.
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
